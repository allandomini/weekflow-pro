import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppContext } from '../contexts/SupabaseAppContext';
import { Routine, RoutineCompletion } from '../types';

interface UseRoutinesOptimizedReturn {
  routines: Routine[];
  routineCompletions: Record<string, Record<string, RoutineCompletion>>;
  loading: boolean;
  completeRoutine: (routineId: string, date?: string) => Promise<void>;
  getRoutineProgress: (routineId: string, date?: string) => { count: number; goal: number; skipped: boolean; paused: boolean };
  refreshRoutines: () => Promise<void>;
}

export function useRoutinesOptimized(): UseRoutinesOptimizedReturn {
  const { 
    routines, 
    routineCompletions, 
    routineLoading, 
    completeRoutineOnce, 
    getRoutineProgress: originalGetRoutineProgress,
    refreshData 
  } = useAppContext();

  const [localCompletions, setLocalCompletions] = useState<Record<string, Record<string, RoutineCompletion>>>({});
  const [isCompleting, setIsCompleting] = useState<Set<string>>(new Set());

  // Initialize and sync local completions from context
  useEffect(() => {
    setLocalCompletions(prev => {
      // Merge context completions with local optimistic updates
      const merged = { ...routineCompletions };
      
      // Preserve any optimistic updates that haven't been synced yet
      Object.keys(prev).forEach(date => {
        Object.keys(prev[date]).forEach(routineId => {
          const localCompletion = prev[date][routineId];
          const contextCompletion = routineCompletions[date]?.[routineId];
          
          // If local completion has higher count, keep it (optimistic update)
          if (!contextCompletion || localCompletion.count > contextCompletion.count) {
            if (!merged[date]) merged[date] = {};
            merged[date][routineId] = localCompletion;
          }
        });
      });
      
      return merged;
    });
  }, [routineCompletions]);

  // Memoized active routines
  const activeRoutines = useMemo(() => 
    routines.filter(r => !r.deletedAt), 
    [routines]
  );

  // Optimized complete routine function with local state management
  const completeRoutine = useCallback(async (routineId: string, date?: string) => {
    const completionKey = `${routineId}:${date || new Date().toISOString().split('T')[0]}`;
    
    // Prevent duplicate completions
    if (isCompleting.has(completionKey)) {
      return;
    }

    setIsCompleting(prev => new Set(prev).add(completionKey));

    try {
      // Get current progress
      const progress = getRoutineProgress(routineId, date);
      const routine = activeRoutines.find(r => r.id === routineId);
      
      if (!routine) {
        throw new Error('Routine not found');
      }

      // Check if already completed
      if (progress.count >= progress.goal) {
        throw new Error('Routine already completed for this date');
      }

      // Optimistic update
      const d = date || new Date().toISOString().split('T')[0];
      const currentCompletion = localCompletions[d]?.[routineId];
      
      const optimisticCompletion: RoutineCompletion = {
        id: currentCompletion?.id || `temp-${Date.now()}`,
        routineId: routineId,
        date: d,
        count: progress.count + 1,
        goal: progress.goal,
        skipped: false,
        paused: false,
        specificTime: currentCompletion?.specificTime,
        completedAt: new Date(),
        createdAt: currentCompletion?.createdAt || new Date(),
        updatedAt: new Date()
      };

      // Update local state immediately
      setLocalCompletions(prev => {
        const dayMap = { ...(prev[d] || {}) };
        return { ...prev, [d]: { ...dayMap, [routineId]: optimisticCompletion } };
      });

      // Call the original function
      await completeRoutineOnce(routineId, date);
      
      // Force a refresh of routine completions to ensure UI is in sync
      setTimeout(() => {
        setLocalCompletions(prev => {
          const updated = { ...prev };
          if (updated[d] && updated[d][routineId]) {
            // Mark as synced by updating the ID if it was temporary
            if (updated[d][routineId].id.startsWith('temp-')) {
              updated[d][routineId] = {
                ...updated[d][routineId],
                id: `synced-${Date.now()}`,
                updatedAt: new Date()
              };
            }
          }
          return updated;
        });
      }, 100);

    } catch (error) {
      console.error('Error completing routine:', error);
      throw error;
    } finally {
      setIsCompleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(completionKey);
        return newSet;
      });
    }
  }, [completeRoutineOnce, activeRoutines, localCompletions, isCompleting]);

  // Optimized get routine progress with local state
  const getRoutineProgress = useCallback((routineId: string, date?: string) => {
    const d = date || new Date().toISOString().split('T')[0];
    const routine = activeRoutines.find(r => r.id === routineId);
    
    if (!routine) {
      return { count: 0, goal: 0, skipped: false, paused: false };
    }

    // Check if routine is paused or skipped
    const paused = routine.pausedUntil && routine.pausedUntil >= d;
    const skipped = routine.exceptions?.[d]?.skip || false;
    const goal = routine.exceptions?.[d]?.overrideTimesPerDay || routine.timesPerDay;

    // Check local completions first
    const localCompletion = localCompletions[d]?.[routineId];
    if (localCompletion) {
      return { 
        count: localCompletion.count, 
        goal, 
        skipped, 
        paused 
      };
    }

    // Fallback to context completions
    const contextCompletion = routineCompletions[d]?.[routineId];
    if (contextCompletion) {
      return { 
        count: contextCompletion.count, 
        goal, 
        skipped, 
        paused 
      };
    }

    return { count: 0, goal, skipped, paused };
  }, [activeRoutines, localCompletions, routineCompletions]);

  // Refresh routines
  const refreshRoutines = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  return {
    routines: activeRoutines,
    routineCompletions: localCompletions,
    loading: routineLoading,
    completeRoutine,
    getRoutineProgress,
    refreshRoutines
  };
}

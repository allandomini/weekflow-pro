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
    // Always prioritize context completions over local state to ensure data consistency
    // This fixes the issue where completed routines show as incomplete after refresh
    setLocalCompletions(routineCompletions);
  }, [routineCompletions]);

  // Memoized active routines
  const activeRoutines = useMemo(() => 
    routines.filter(r => !r.deletedAt), 
    [routines]
  );

  // Optimized complete routine function with local state management
  const completeRoutine = useCallback(async (routineId: string, date?: string) => {
    const d = date || new Date().toISOString().split('T')[0];
    const completionKey = `${routineId}:${d}`;
    
    // Prevent duplicate completions
    if (isCompleting.has(completionKey)) {
      return;
    }

    setIsCompleting(prev => new Set(prev).add(completionKey));

    try {
      // Get current progress from context (most reliable source)
      const contextCompletion = routineCompletions[d]?.[routineId];
      const routine = activeRoutines.find(r => r.id === routineId);
      
      if (!routine) {
        throw new Error('Routine not found');
      }

      const currentCount = contextCompletion?.count || 0;
      const goal = routine.timesPerDay || 1;

      // Check if already completed using context data
      if (currentCount >= goal) {
        throw new Error(`Esta rotina já foi completada ${goal} vez(es) hoje.`);
      }

      // Optimistic update with proper count
      const optimisticCompletion: RoutineCompletion = {
        id: contextCompletion?.id || `temp-${Date.now()}`,
        routineId: routineId,
        date: d,
        count: currentCount + 1,
        goal: goal,
        skipped: false,
        paused: false,
        specificTime: contextCompletion?.specificTime,
        completedAt: new Date(),
        createdAt: contextCompletion?.createdAt || new Date(),
        updatedAt: new Date()
      };

      // Update local state immediately
      setLocalCompletions(prev => {
        const dayMap = { ...(prev[d] || {}) };
        return { ...prev, [d]: { ...dayMap, [routineId]: optimisticCompletion } };
      });

      // Call the original function
      await completeRoutineOnce(routineId, date);
      
    } catch (error) {
      // Rollback optimistic update on error
      setLocalCompletions(prev => {
        const dayMap = { ...(prev[d] || {}) };
        if (routineCompletions[d]?.[routineId]) {
          // Restore from context
          return { ...prev, [d]: { ...dayMap, [routineId]: routineCompletions[d][routineId] } };
        } else {
          // Remove if no context data
          const newDayMap = { ...dayMap };
          delete newDayMap[routineId];
          return { ...prev, [d]: newDayMap };
        }
      });
      
      console.error('Error completing routine:', error);
      throw error;
    } finally {
      setIsCompleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(completionKey);
        return newSet;
      });
    }
  }, [completeRoutineOnce, activeRoutines, routineCompletions, isCompleting]);

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

    // Prioritize context completions for consistency
    const contextCompletion = routineCompletions[d]?.[routineId];
    if (contextCompletion) {
      return { 
        count: contextCompletion.count, 
        goal, 
        skipped, 
        paused 
      };
    }

    // Fallback to local completions only if no context data
    const localCompletion = localCompletions[d]?.[routineId];
    if (localCompletion) {
      return { 
        count: localCompletion.count, 
        goal, 
        skipped, 
        paused 
      };
    }

    return { count: 0, goal, skipped, paused };
  }, [activeRoutines, routineCompletions, localCompletions]);

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

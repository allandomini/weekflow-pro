import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';
import { Routine, RoutineCompletion } from '../types';

interface RoutineCacheEntry {
  data: Routine[];
  timestamp: number;
  expiresAt: number;
}

interface CompletionsCacheEntry {
  data: Record<string, Record<string, RoutineCompletion>>;
  timestamp: number;
  expiresAt: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const COMPLETIONS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export function useRoutineCache() {
  const { user } = useAuth();
  const [routinesCache, setRoutinesCache] = useState<RoutineCacheEntry | null>(null);
  const [completionsCache, setCompletionsCache] = useState<CompletionsCacheEntry | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if cache is valid
  const isCacheValid = useCallback((cache: { expiresAt: number } | null): boolean => {
    return cache !== null && Date.now() < cache.expiresAt;
  }, []);

  // Load routines with caching
  const loadRoutines = useCallback(async (forceRefresh = false): Promise<Routine[]> => {
    if (!user) return [];

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(routinesCache)) {
      return routinesCache!.data;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const transformedRoutines: Routine[] = (data || []).map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        color: r.color || '#3B82F6',
        timesPerDay: r.times_per_day || 1,
        specificTimes: Array.isArray(r.specific_times) ? r.specific_times : 
                      (typeof r.specific_times === 'string' ? JSON.parse(r.specific_times || '[]') : []),
        weekdays: Array.isArray(r.weekdays) ? r.weekdays : 
                 (typeof r.weekdays === 'string' ? JSON.parse(r.weekdays || '[]') : []),
        durationDays: r.duration_days,
        priority: (r.priority as 'low' | 'medium' | 'high') || 'medium',
        schedule: typeof r.schedule === 'object' ? r.schedule : {},
        activeFrom: r.active_from,
        activeTo: r.active_to,
        pausedUntil: r.paused_until,
        exceptions: typeof r.exceptions === 'object' && r.exceptions ? r.exceptions as Record<string, any> : {},
        deletedAt: r.deleted_at,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at)
      }));

      // Update cache
      const cacheEntry: RoutineCacheEntry = {
        data: transformedRoutines,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION
      };
      setRoutinesCache(cacheEntry);

      return transformedRoutines;
    } catch (error) {
      console.error('Error loading routines:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, routinesCache, isCacheValid]);

  // Load routine completions with caching
  const loadCompletions = useCallback(async (forceRefresh = false): Promise<Record<string, Record<string, RoutineCompletion>>> => {
    if (!user) return {};

    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(completionsCache)) {
      return completionsCache!.data;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('routine_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .limit(200);

      if (error) throw error;

      const completionsMap: Record<string, Record<string, RoutineCompletion>> = {};
      (data || []).forEach(completion => {
        if (!completionsMap[completion.date]) {
          completionsMap[completion.date] = {};
        }
        completionsMap[completion.date][completion.routine_id] = {
          id: completion.id,
          routineId: completion.routine_id,
          date: completion.date,
          completedAt: new Date(completion.completed_at),
          specificTime: completion.specific_time || undefined,
          count: completion.count || 1,
          goal: completion.goal || 1,
          skipped: false,
          paused: false,
          createdAt: new Date(completion.created_at),
          updatedAt: new Date(completion.updated_at)
        };
      });

      // Update cache
      const cacheEntry: CompletionsCacheEntry = {
        data: completionsMap,
        timestamp: Date.now(),
        expiresAt: Date.now() + COMPLETIONS_CACHE_DURATION
      };
      setCompletionsCache(cacheEntry);

      return completionsMap;
    } catch (error) {
      console.error('Error loading routine completions:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, [user, completionsCache, isCacheValid]);

  // Invalidate cache
  const invalidateCache = useCallback((type?: 'routines' | 'completions') => {
    if (!type || type === 'routines') {
      setRoutinesCache(null);
    }
    if (!type || type === 'completions') {
      setCompletionsCache(null);
    }
  }, []);

  // Get cached routines
  const getCachedRoutines = useCallback((): Routine[] => {
    return isCacheValid(routinesCache) ? routinesCache!.data : [];
  }, [routinesCache, isCacheValid]);

  // Get cached completions
  const getCachedCompletions = useCallback((): Record<string, Record<string, RoutineCompletion>> => {
    return isCacheValid(completionsCache) ? completionsCache!.data : {};
  }, [completionsCache, isCacheValid]);

  // Auto-load data on mount
  useEffect(() => {
    if (user && !isCacheValid(routinesCache)) {
      loadRoutines();
    }
  }, [user, loadRoutines, routinesCache, isCacheValid]);

  useEffect(() => {
    if (user && !isCacheValid(completionsCache)) {
      loadCompletions();
    }
  }, [user, loadCompletions, completionsCache, isCacheValid]);

  return {
    loading,
    loadRoutines,
    loadCompletions,
    getCachedRoutines,
    getCachedCompletions,
    invalidateCache,
    isCacheValid: (type: 'routines' | 'completions') => 
      type === 'routines' ? isCacheValid(routinesCache) : isCacheValid(completionsCache)
  };
}

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppContext } from '@/contexts/SupabaseAppContext';
import { useLoadingProgress } from '@/hooks/useLoadingProgress';
import LoadingScreen from './LoadingScreen';

export default function AppLoadingWrapper() {
  const { user } = useAuth();
  const { loading, routines, routineCompletions } = useAppContext();
  const { progress, currentMessage, completeStep, reset, isCompleted } = useLoadingProgress();
  const [showLoading, setShowLoading] = useState(false);
  const [hasCompletions, setHasCompletions] = useState(false);
  const [hasLoadedBefore, setHasLoadedBefore] = useState(false);

  // Check if app has been loaded before using localStorage (persists across refreshes)
  useEffect(() => {
    const appLoaded = localStorage.getItem('domini-app-loaded');
    const lastLoadTime = localStorage.getItem('domini-last-load');
    const now = Date.now();
    
    // Reset loading flag after 1 hour of inactivity
    if (appLoaded === 'true' && lastLoadTime) {
      const timeDiff = now - parseInt(lastLoadTime);
      if (timeDiff > 3600000) { // 1 hour
        localStorage.removeItem('domini-app-loaded');
        localStorage.removeItem('domini-last-load');
      } else {
        setHasLoadedBefore(true);
      }
    }
  }, []);

  // Monitor when routine completions are actually loaded
  useEffect(() => {
    if (routineCompletions && Object.keys(routineCompletions).length > 0) {
      console.log('🎯 Routine completions loaded, hiding loading screen');
      setHasCompletions(true);
      setShowLoading(false);
      // Mark app as loaded in localStorage (persists across refreshes)
      localStorage.setItem('domini-app-loaded', 'true');
      localStorage.setItem('domini-last-load', Date.now().toString());
    }
  }, [routineCompletions]);

  useEffect(() => {
    // Only show loading on first app load, not on page navigation
    if (user && !hasLoadedBefore && !hasCompletions) {
      setShowLoading(true);
      reset();
      
      // Start loading simulation
      const loadingSteps = [
        { step: 'auth', delay: 300 },
        { step: 'projects', delay: 800 },
        { step: 'tasks', delay: 600 },
        { step: 'routines', delay: 1200 },
        { step: 'finances', delay: 400 },
        { step: 'settings', delay: 300 },
        { step: 'finalize', delay: 500 }
      ];

      let currentStepIndex = 0;
      
      const executeNextStep = () => {
        if (currentStepIndex < loadingSteps.length) {
          const currentStep = loadingSteps[currentStepIndex];
          
          setTimeout(() => {
            completeStep(currentStep.step);
            currentStepIndex++;
            executeNextStep();
          }, currentStep.delay);
        }
      };

      executeNextStep();
    }
  }, [user, hasLoadedBefore, hasCompletions, completeStep, reset]);

  // Show loading overlay on top of everything
  if (showLoading) {
    return (
      <LoadingScreen 
        isLoading={true}
        progress={progress}
        message={currentMessage}
      />
    );
  }

  return null;
}

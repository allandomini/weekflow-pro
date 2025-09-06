import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from './useTranslation';

interface LoadingStep {
  id: string;
  name: string;
  weight: number;
  completed: boolean;
}

export function useLoadingProgress() {
  const { t } = useTranslation();
  
  const [steps, setSteps] = useState<LoadingStep[]>([
    { id: 'auth', name: t('loading.authenticating_user'), weight: 15, completed: false },
    { id: 'projects', name: t('loading.loading_projects'), weight: 20, completed: false },
    { id: 'tasks', name: t('loading.syncing_tasks'), weight: 15, completed: false },
    { id: 'routines', name: t('loading.preparing_routines'), weight: 20, completed: false },
    { id: 'finances', name: t('loading.loading_finances'), weight: 15, completed: false },
    { id: 'settings', name: t('loading.configuring_preferences'), weight: 10, completed: false },
    { id: 'finalize', name: t('loading.finalizing'), weight: 5, completed: false }
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Iniciando...');

  // Calculate progress based on completed steps
  const calculateProgress = useCallback((stepList: LoadingStep[]) => {
    const completedWeight = stepList
      .filter(step => step.completed)
      .reduce((sum, step) => sum + step.weight, 0);
    
    const totalWeight = stepList.reduce((sum, step) => sum + step.weight, 0);
    return Math.round((completedWeight / totalWeight) * 100);
  }, []);

  // Mark step as completed
  const completeStep = useCallback((stepId: string) => {
    setSteps(prevSteps => {
      const newSteps = prevSteps.map(step => 
        step.id === stepId ? { ...step, completed: true } : step
      );
      
      const newProgress = calculateProgress(newSteps);
      setProgress(newProgress);
      
      // Update current message to next incomplete step
      const nextStep = newSteps.find(step => !step.completed);
      if (nextStep) {
        setCurrentMessage(nextStep.name);
        setCurrentStep(newSteps.findIndex(step => step.id === nextStep.id));
      } else {
        setCurrentMessage('Concluído!');
      }
      
      return newSteps;
    });
  }, [calculateProgress]);

  // Reset loading state
  const reset = useCallback(() => {
    setSteps(prevSteps => prevSteps.map(step => ({ ...step, completed: false })));
    setProgress(0);
    setCurrentStep(0);
    setCurrentMessage('Iniciando...');
  }, []);

  // Check if all steps are completed
  const isCompleted = steps.every(step => step.completed);

  return {
    progress,
    currentMessage,
    currentStep,
    steps,
    completeStep,
    reset,
    isCompleted
  };
}

import React from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoutineLoadingIndicatorProps {
  isLoading: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RoutineLoadingIndicator({ 
  isLoading, 
  isSuccess = false, 
  isError = false, 
  size = 'sm',
  className 
}: RoutineLoadingIndicatorProps) {
  if (!isLoading && !isSuccess && !isError) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const iconClasses = cn(
    'animate-in transition-all duration-200',
    sizeClasses[size],
    className
  );

  if (isError) {
    return (
      <XCircle 
        className={cn(iconClasses, 'text-destructive')} 
      />
    );
  }

  if (isSuccess) {
    return (
      <CheckCircle 
        className={cn(iconClasses, 'text-green-500 animate-bounce')} 
      />
    );
  }

  if (isLoading) {
    return (
      <Loader2 
        className={cn(iconClasses, 'text-primary animate-spin')} 
      />
    );
  }

  return null;
}

// Optimized version for routine completion buttons
export function RoutineCompletionButton({ 
  routineId, 
  date, 
  onComplete, 
  isCompleted = false,
  isCompleting = false,
  className 
}: {
  routineId: string;
  date: string;
  onComplete: (routineId: string, date: string) => Promise<void>;
  isCompleted?: boolean;
  isCompleting?: boolean;
  className?: string;
}) {
  const handleClick = async () => {
    if (isCompleting || isCompleted) return;
    
    try {
      await onComplete(routineId, date);
    } catch (error) {
      console.error('Error completing routine:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isCompleting || isCompleted}
      className={cn(
        'flex items-center justify-center p-2 rounded-md transition-all duration-200',
        'hover:bg-primary/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        isCompleted && 'bg-green-100 text-green-700 hover:bg-green-200',
        !isCompleted && 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        className
      )}
    >
      <RoutineLoadingIndicator 
        isLoading={isCompleting}
        isSuccess={isCompleted}
        size="sm"
      />
    </button>
  );
}

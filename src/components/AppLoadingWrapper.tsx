import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppContext } from '@/contexts/SupabaseAppContext';
import LoadingScreen from './LoadingScreen';

export default function AppLoadingWrapper() {
  const { user } = useAuth();
  const { loading } = useAppContext();

  // Simple loading screen - only show when actually loading
  if (user && loading) {
    return (
      <LoadingScreen 
        isLoading={true}
        progress={75}
        message="Carregando dados..."
      />
    );
  }

  return null;
}

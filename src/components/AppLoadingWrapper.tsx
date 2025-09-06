import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppContext } from '@/contexts/SupabaseAppContext';
import { useTranslation } from '@/hooks/useTranslation';
import LoadingScreen from './LoadingScreen';

export default function AppLoadingWrapper() {
  const { user } = useAuth();
  const { loading } = useAppContext();
  const { t } = useTranslation();

  // Simple loading screen - only show when actually loading
  if (user && loading) {
    return (
      <LoadingScreen 
        isLoading={true}
        progress={75}
        message={t('loading.loading_data')}
      />
    );
  }

  return null;
}

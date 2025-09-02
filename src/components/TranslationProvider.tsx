import React, { Suspense } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

interface TranslationProviderProps {
  children: React.ReactNode;
}

const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={<div>Loading translations...</div>}>
        {children}
      </Suspense>
    </I18nextProvider>
  );
};

export default TranslationProvider;

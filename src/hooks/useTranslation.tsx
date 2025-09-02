import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useCallback } from 'react';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  const changeLanguage = useCallback((language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('weekflow-language', language);
  }, [i18n]);

  const getCurrentLanguage = useCallback(() => {
    return i18n.language;
  }, [i18n]);

  const getAvailableLanguages = useCallback(() => {
    return [
      { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' }
    ];
  }, []);

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
    currentLanguage: i18n.language,
    isLoading: !i18n.isInitialized
  };
};

export default useTranslation;

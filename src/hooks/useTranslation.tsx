import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useCallback } from 'react';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  // Wrapper function with extensive logging
  const translationWrapper = useCallback((key: string, options?: any): string => {
    console.log('🌐 [TRANSLATION DEBUG] ===================');
    console.log('🔑 Key requested:', key);
    console.log('🌍 Current language:', i18n.language);
    console.log('⚙️ i18n initialized:', i18n.isInitialized);
    console.log('📦 Available languages:', Object.keys(i18n.store.data));
    console.log('🗂️ Current language resources:', i18n.store.data[i18n.language]);
    
    // Check if the key exists in current language
    const keyExists = i18n.exists(key);
    console.log('✅ Key exists:', keyExists);
    
    // Get the translation
    const translation = t(key, options);
    console.log('📝 Translation result:', translation);
    console.log('🔍 Is fallback (same as key):', translation === key);
    
    // Try to get the raw resource to debug
    try {
      const keyParts = key.split('.');
      let resource: any = i18n.store.data[i18n.language];
      for (const part of keyParts) {
        resource = resource?.[part];
      }
      console.log('🎯 Raw resource value:', resource);
    } catch (error) {
      console.log('❌ Error accessing raw resource:', error);
    }
    
    console.log('🌐 [TRANSLATION DEBUG END] =============');
    
    // Ensure we always return a string
    return String(translation);
  }, [t, i18n]);

  const changeLanguage = useCallback((language: string) => {
    console.log('🔄 [LANGUAGE CHANGE] Changing from', i18n.language, 'to', language);
    i18n.changeLanguage(language);
    localStorage.setItem('weekflow-language', language);
    console.log('💾 Language saved to localStorage:', language);
  }, [i18n]);

  const getCurrentLanguage = useCallback(() => {
    const currentLang = i18n.language;
    console.log('📍 [GET CURRENT LANG]', currentLang);
    return currentLang;
  }, [i18n]);

  const getAvailableLanguages = useCallback(() => {
    const available = ['pt-BR', 'en', 'es'];
    console.log('📋 [AVAILABLE LANGS]', available);
    return available;
  }, []);

  // Log current state on every render
  console.log('🎭 [useTranslation RENDER] Current state:', {
    language: i18n.language,
    initialized: i18n.isInitialized,
    isLoading: !i18n.isInitialized,
    availableResources: Object.keys(i18n.store.data)
  });

  return {
    t: translationWrapper,
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
    currentLanguage: i18n.language,
    isLoading: !i18n.isInitialized
  };
};

export default useTranslation;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import es from './locales/es.json';

console.log('🚀 [i18n INIT] Starting i18n initialization...');
console.log('📦 [i18n INIT] Imported resources:', {
  'pt-BR': Object.keys(ptBR).length + ' keys',
  'en': Object.keys(en).length + ' keys', 
  'es': Object.keys(es).length + ' keys'
});

const resources = {
  'pt-BR': {
    translation: ptBR
  },
  en: {
    translation: en
  },
  es: {
    translation: es
  }
};

console.log('🗂️ [i18n INIT] Resources structure:', resources);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    debug: true, // Enable debug mode
    returnObjects: false, // Changed to false to avoid object returns
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
      lookupLocalStorage: 'weekflow-language',
      convertDetectedLanguage: (lng: string) => {
        console.log('🔍 [i18n DETECTION] Detected language:', lng);
        // Map browser language codes to our supported languages
        if (lng.startsWith('pt')) {
          console.log('✅ [i18n DETECTION] Mapped to pt-BR');
          return 'pt-BR';
        }
        if (lng.startsWith('en')) {
          console.log('✅ [i18n DETECTION] Mapped to en');
          return 'en';
        }
        if (lng.startsWith('es')) {
          console.log('✅ [i18n DETECTION] Mapped to es');
          return 'es';
        }
        console.log('⚠️ [i18n DETECTION] Fallback to pt-BR');
        return 'pt-BR'; // fallback
      }
    },

    interpolation: {
      escapeValue: false
    },

    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i']
    }
  })
  .then(() => {
    console.log('✅ [i18n INIT] i18n initialized successfully');
    console.log('🌍 [i18n INIT] Current language:', i18n.language);
    console.log('📚 [i18n INIT] Available resources:', Object.keys(i18n.store.data));
    console.log('💾 [i18n INIT] localStorage language:', localStorage.getItem('weekflow-language'));
  })
  .catch((error) => {
    console.error('❌ [i18n INIT] Failed to initialize i18n:', error);
  });

// Force immediate initialization
if (!i18n.isInitialized) {
  console.log('🔄 [i18n INIT] Forcing initialization...');
  i18n.init();
}

export default i18n;

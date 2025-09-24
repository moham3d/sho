import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation files
import en from './locales/en.json';
import ar from './locales/ar.json';

const resources = {
  en: {
    translation: en,
  },
  ar: {
    translation: ar,
  },
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React already escapes by default
      formatSeparator: ',',
      format: (value, format, lng) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'currency') {
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: 'EGP'
          }).format(value);
        }
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng).format(new Date(value));
        }
        if (format === 'datetime') {
          return new Intl.DateTimeFormat(lng, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(value));
        }
        return value;
      },
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true,
    },

    react: {
      useSuspense: false,
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'div'],
    },

    // Arabic specific settings
    lng: 'en',
    whitelist: ['en', 'ar'],
    nonExplicitWhitelist: true,
    load: 'languageOnly',
    preload: ['en', 'ar'],

    // RTL support
    supportedLngs: ['en', 'ar'],

    // Custom backend configuration
    backend: {
      loadPath: '/i18n/locales/{{lng}}.json',
      addPath: '/i18n/locales/{{lng}}.json',
    },
  });

// RTL language detection
export const isRTL = (lng: string): boolean => {
  return lng === 'ar';
};

// Set document direction based on language
export const setDocumentDirection = (lng: string): void => {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = isRTL(lng) ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  }
};

// Listen for language changes and update document direction
i18n.on('languageChanged', (lng) => {
  setDocumentDirection(lng);

  // Store language preference
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('i18nextLng', lng);
  }
});

// Initialize document direction
setDocumentDirection(i18n.language);

export default i18n;
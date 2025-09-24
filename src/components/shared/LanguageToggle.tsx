import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Toggle language"
    >
      {i18n.language === 'en' ? 'العربية' : 'English'}
    </button>
  );
};

export default LanguageToggle;
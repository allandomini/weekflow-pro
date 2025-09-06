import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';

const LanguageSelector: React.FC = () => {
  const { changeLanguage, getCurrentLanguage, getAvailableLanguages } = useTranslation();
  const currentLanguage = getCurrentLanguage();
  const availableLanguages = getAvailableLanguages();

  const handleLanguageChange = (value: string) => {
    changeLanguage(value);
  };

  const getLanguageDisplayName = (code: string) => {
    const languageNames = {
      'pt-BR': 'Português (Brasil)',
      'en': 'English',
      'es': 'Español'
    };
    return languageNames[code as keyof typeof languageNames] || code;
  };

  return (
    <Select value={currentLanguage} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[140px] h-8 text-xs border-muted bg-background/80">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" sideOffset={4}>
        {availableLanguages.map((lang) => (
          <SelectItem key={lang} value={lang} className="text-xs">
            {getLanguageDisplayName(lang)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;

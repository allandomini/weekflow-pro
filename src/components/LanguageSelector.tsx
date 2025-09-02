import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

const LanguageSelector: React.FC = () => {
  const { t, changeLanguage, getCurrentLanguage, getAvailableLanguages } = useTranslation();
  const currentLanguage = getCurrentLanguage();
  const availableLanguages = getAvailableLanguages();

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('settings.language')}
        </CardTitle>
        <CardDescription>
          {t('settings.language_selection')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="language-select">{t('settings.language')}</Label>
          <Select value={currentLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger id="language-select">
              <SelectValue placeholder={t('settings.language_selection')} />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  <div className="flex items-center gap-2">
                    <span>{language.flag}</span>
                    <span>{language.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {t('settings.auto_detect')}
        </div>
      </CardContent>
    </Card>
  );
};

export default LanguageSelector;

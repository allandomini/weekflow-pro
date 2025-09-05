import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from "@/utils/currency";
import { useTranslation } from "@/hooks/useTranslation";

interface CurrencySelectorProps {
  value: string;
  onValueChange: (currency: string) => void;
}

export default function CurrencySelector({ value, onValueChange }: CurrencySelectorProps) {
  const { t } = useTranslation();

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle>{t('settings.currency')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>{t('settings.select_currency')}</Label>
          <Select value={value || DEFAULT_CURRENCY} onValueChange={onValueChange}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('settings.select_currency')} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SUPPORTED_CURRENCIES).map(([code, config]) => (
                <SelectItem key={code} value={code}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{config.symbol}</span>
                    <span>{config.name}</span>
                    <span className="text-muted-foreground text-xs">({code})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-2">
            {t('settings.currency_description')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

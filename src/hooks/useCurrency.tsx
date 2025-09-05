import { useAppContext } from "@/contexts/SupabaseAppContext";
import { formatCurrency, getCurrencySymbol, getCurrencyConfig } from "@/utils/currency";

export function useCurrency() {
  const { currency } = useAppContext();

  const formatAmount = (amount: number): string => {
    return formatCurrency(amount, currency);
  };

  const getSymbol = (): string => {
    return getCurrencySymbol(currency);
  };

  const getConfig = () => {
    return getCurrencyConfig(currency);
  };

  return {
    formatAmount,
    getSymbol,
    getConfig,
    currency
  };
}

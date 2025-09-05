export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Real Brasileiro',
    locale: 'pt-BR'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB'
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    locale: 'ja-JP'
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    locale: 'en-CA'
  }
};

export const DEFAULT_CURRENCY = 'BRL';

export function formatCurrency(amount: number, currencyCode: string = DEFAULT_CURRENCY): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
  
  return amount.toLocaleString(currency.locale, {
    style: 'currency',
    currency: currency.code
  });
}

export function getCurrencySymbol(currencyCode: string = DEFAULT_CURRENCY): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
  return currency.symbol;
}

export function getCurrencyConfig(currencyCode: string = DEFAULT_CURRENCY): CurrencyConfig {
  return SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
}

// Exchange rate API integration (Frankfurter API)
export async function getExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number> | null> {
  try {
    const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${baseCurrency}`);
    if (!response.ok) throw new Error('Failed to fetch exchange rates');
    
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return null;
  }
}

export async function convertCurrency(
  amount: number, 
  fromCurrency: string, 
  toCurrency: string
): Promise<number | null> {
  if (fromCurrency === toCurrency) return amount;
  
  try {
    const response = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=${fromCurrency}&symbols=${toCurrency}`
    );
    if (!response.ok) throw new Error('Failed to fetch conversion rate');
    
    const data = await response.json();
    const rate = data.rates[toCurrency];
    
    if (!rate) throw new Error('Conversion rate not found');
    
    return amount * rate;
  } catch (error) {
    console.error('Error converting currency:', error);
    return null;
  }
}

import type { CurrencyCode } from '@/src/types';

export type { CurrencyCode };

export const SUPPORTED_CURRENCIES = {
  ZAR: { code: 'ZAR' as CurrencyCode, symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
  USD: { code: 'USD' as CurrencyCode, symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR' as CurrencyCode, symbol: '€', name: 'Euro', locale: 'de-DE' },
  GBP: { code: 'GBP' as CurrencyCode, symbol: '£', name: 'British Pound', locale: 'en-GB' },
} as const;

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return code in SUPPORTED_CURRENCIES;
}

export function formatCurrency(amount: number, currencyCode: CurrencyCode): string {
  try {
    const { locale } = SUPPORTED_CURRENCIES[currencyCode];
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback: symbol + fixed decimal
    const { symbol } = SUPPORTED_CURRENCIES[currencyCode];
    return `${symbol}${amount.toFixed(2)}`;
  }
}

export function pointsToMoney(points: number, conversionRate: number): number {
  return points * conversionRate;
}

export function formatPointsAsMoney(
  points: number,
  conversionRate: number,
  currencyCode: CurrencyCode,
): string {
  return formatCurrency(pointsToMoney(points, conversionRate), currencyCode);
}

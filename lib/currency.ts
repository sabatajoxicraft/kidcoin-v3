import { getLocales, useLocales } from 'expo-localization';
import type { CurrencyCode } from '@/src/types';

export type { CurrencyCode };

export const SUPPORTED_CURRENCIES = {
  ZAR: { code: 'ZAR' as CurrencyCode, symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
  USD: { code: 'USD' as CurrencyCode, symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR' as CurrencyCode, symbol: '€', name: 'Euro', locale: 'de-DE' },
  GBP: { code: 'GBP' as CurrencyCode, symbol: '£', name: 'British Pound', locale: 'en-GB' },
} as const;

const DEFAULT_CURRENCY: CurrencyCode = 'ZAR';

// Region code → currency for cases where locale object lacks currencyCode
const REGION_CURRENCY_MAP: Record<string, CurrencyCode> = {
  ZA: 'ZAR',
  US: 'USD',
  DE: 'EUR', AT: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR',
  BE: 'EUR', PT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR',
  GB: 'GBP',
};

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return code in SUPPORTED_CURRENCIES;
}

/**
 * Derive a supported CurrencyCode from expo-localization locale objects.
 * Pure function — safe for non-React contexts.
 */
export function currencyFromLocales(
  locales: ReadonlyArray<{ currencyCode?: string | null; regionCode?: string | null }> | null,
): CurrencyCode {
  if (!locales || locales.length === 0) return DEFAULT_CURRENCY;

  for (const loc of locales) {
    if (loc.currencyCode && isSupportedCurrency(loc.currencyCode)) {
      return loc.currencyCode;
    }
    if (loc.regionCode) {
      const mapped = REGION_CURRENCY_MAP[loc.regionCode.toUpperCase()];
      if (mapped) return mapped;
    }
  }

  return DEFAULT_CURRENCY;
}

/** Non-hook helper: detect device currency once (for non-React code). */
export function getDeviceCurrency(): CurrencyCode {
  return currencyFromLocales(getLocales());
}

/** React hook: reactively detect device currency. */
export function useDeviceCurrency(): CurrencyCode {
  return currencyFromLocales(useLocales());
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

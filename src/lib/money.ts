/**
 * Minor unit money formatting and conversion utilities.
 * Stored as integer paise/cents. Never store floats.
 */
export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD';

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  AED: 'en-AE',
  SGD: 'en-SG',
};

export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

export function fromMinorUnits(minorUnits: number): number {
  return minorUnits / 100;
}

export function formatMoney(amountMinor: number, currency: CurrencyCode = 'INR'): string {
  const locale = CURRENCY_LOCALES[currency] || 'en-IN';
  const major = fromMinorUnits(amountMinor);
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(major);
}

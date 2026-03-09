/**
 * Multi-currency utilities
 * Uses static fallback rates. For live rates, configure an API key later.
 */

export const SUPPORTED_CURRENCIES = [
  { code: "BRL", symbol: "R$", name: "Real Brasileiro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
] as const;

export type CurrencyCode = typeof SUPPORTED_CURRENCIES[number]["code"];

// Static fallback rates (BRL base). Updated: Mar 2026 approximation
const STATIC_RATES: Record<string, number> = {
  BRL: 1,
  USD: 0.175,
  EUR: 0.16,
  GBP: 0.138,
};

let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Fetch live exchange rates from a free API.
 * Falls back to static rates if unavailable.
 */
export async function fetchRates(base: CurrencyCode = "BRL"): Promise<Record<string, number>> {
  if (cachedRates && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedRates;
  }

  try {
    // Free API - no key required
    const resp = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
    if (resp.ok) {
      const data = await resp.json();
      cachedRates = data.rates;
      cacheTimestamp = Date.now();
      return cachedRates!;
    }
  } catch (e) {
    console.warn("Failed to fetch live rates, using static fallback:", e);
  }

  // Return static rates relative to requested base
  const baseRate = STATIC_RATES[base] || 1;
  const rates: Record<string, number> = {};
  for (const [code, rate] of Object.entries(STATIC_RATES)) {
    rates[code] = rate / baseRate;
  }
  cachedRates = rates;
  cacheTimestamp = Date.now();
  return rates;
}

/**
 * Convert an amount between currencies
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Record<string, number>
): number {
  if (from === to) return amount;
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  return (amount / fromRate) * toRate;
}

/**
 * Format a currency value
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "BRL",
  locale: string = "pt-BR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get symbol for a currency code
 */
export function getCurrencySymbol(code: CurrencyCode): string {
  return SUPPORTED_CURRENCIES.find(c => c.code === code)?.symbol || code;
}

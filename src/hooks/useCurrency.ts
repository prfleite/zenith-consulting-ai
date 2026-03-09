import { useState, useEffect, useCallback } from "react";
import { fetchRates, convertCurrency, formatCurrency, type CurrencyCode, SUPPORTED_CURRENCIES } from "@/lib/currencyUtils";

/**
 * Hook for multi-currency conversion.
 * Fetches rates on mount and provides conversion utilities.
 */
export function useCurrency(baseCurrency: CurrencyCode = "BRL") {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(baseCurrency);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRates(baseCurrency).then(r => {
      setRates(r);
      setLoading(false);
    });
  }, [baseCurrency]);

  const convert = useCallback(
    (amount: number, from: CurrencyCode = baseCurrency) =>
      convertCurrency(amount, from, displayCurrency, rates),
    [rates, displayCurrency, baseCurrency]
  );

  const format = useCallback(
    (amount: number, currency?: CurrencyCode) =>
      formatCurrency(amount, currency || displayCurrency),
    [displayCurrency]
  );

  const convertAndFormat = useCallback(
    (amount: number, from: CurrencyCode = baseCurrency) =>
      format(convert(amount, from)),
    [convert, format, baseCurrency]
  );

  return {
    rates,
    loading,
    displayCurrency,
    setDisplayCurrency,
    convert,
    format,
    convertAndFormat,
    currencies: SUPPORTED_CURRENCIES,
  };
}

// Currency utility functions
import { SUPPORTED_CURRENCIES } from '../types/invoice';
/**
 * Format a currency amount with proper symbol and decimal places
 */
export const formatCurrencyAmount = (amount, currency) => {
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: currency.decimalPlaces,
        maximumFractionDigits: currency.decimalPlaces,
    });
    return formatter.format(amount);
};
/**
 * Format a currency amount with custom symbol
 */
export const formatCurrencyWithSymbol = (amount, currency) => {
    const formattedNumber = amount.toFixed(currency.decimalPlaces);
    return `${currency.symbol}${formattedNumber}`;
};
/**
 * Get currency by code
 */
export const getCurrencyByCode = (code) => {
    return SUPPORTED_CURRENCIES.find(currency => currency.code === code);
};
/**
 * Check if a currency is supported
 */
export const isCurrencySupported = (code) => {
    return SUPPORTED_CURRENCIES.some(currency => currency.code === code);
};
/**
 * Convert amount between currencies using exchange rate
 */
export const convertCurrency = (amount, fromCurrency, toCurrency, exchangeRate) => {
    if (fromCurrency === toCurrency) {
        return {
            amount,
            currency: toCurrency,
            exchangeRate: 1,
            baseAmount: amount,
        };
    }
    const convertedAmount = amount * exchangeRate;
    return {
        amount: convertedAmount,
        currency: toCurrency,
        exchangeRate,
        baseAmount: amount,
    };
};
/**
 * Calculate exchange rate between two currencies
 */
export const calculateExchangeRate = (baseCurrency, targetCurrency, rates) => {
    // Direct rate
    const directRate = rates.find(rate => rate.baseCurrency === baseCurrency && rate.targetCurrency === targetCurrency);
    if (directRate) {
        return directRate.rate;
    }
    // Inverse rate
    const inverseRate = rates.find(rate => rate.baseCurrency === targetCurrency && rate.targetCurrency === baseCurrency);
    if (inverseRate) {
        return 1 / inverseRate.rate;
    }
    // Cross rate through USD (if available)
    const baseToUSD = rates.find(rate => rate.baseCurrency === baseCurrency && rate.targetCurrency === 'USD');
    const targetToUSD = rates.find(rate => rate.baseCurrency === targetCurrency && rate.targetCurrency === 'USD');
    if (baseToUSD && targetToUSD) {
        return baseToUSD.rate / targetToUSD.rate;
    }
    return null;
};
/**
 * Check if exchange rates are fresh (less than 1 hour old)
 */
export const areRatesFresh = (rates, maxAgeHours = 1) => {
    if (rates.length === 0)
        return false;
    const now = new Date();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    return rates.every(rate => {
        const age = now.getTime() - rate.timestamp.getTime();
        return age <= maxAge;
    });
};
/**
 * Get the oldest exchange rate timestamp
 */
export const getOldestRateTimestamp = (rates) => {
    if (rates.length === 0)
        return null;
    return rates.reduce((oldest, rate) => {
        return rate.timestamp < oldest ? rate.timestamp : oldest;
    }, rates[0].timestamp);
};
/**
 * Filter rates by currency pair
 */
export const getRateForPair = (rates, baseCurrency, targetCurrency) => {
    return rates.find(rate => rate.baseCurrency === baseCurrency && rate.targetCurrency === targetCurrency);
};
/**
 * Get all unique currencies from exchange rates
 */
export const getUniqueCurrenciesFromRates = (rates) => {
    const currencies = new Set();
    rates.forEach(rate => {
        currencies.add(rate.baseCurrency);
        currencies.add(rate.targetCurrency);
    });
    return Array.from(currencies);
};
/**
 * Validate currency amount format
 */
export const isValidCurrencyAmount = (amount, currency) => {
    if (amount < 0)
        return false;
    // Check if the amount has more decimal places than the currency supports
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    return decimalPlaces <= currency.decimalPlaces;
};
/**
 * Round amount to currency's decimal places
 */
export const roundToCurrencyPrecision = (amount, currency) => {
    const multiplier = Math.pow(10, currency.decimalPlaces);
    return Math.round(amount * multiplier) / multiplier;
};
/**
 * Parse currency amount from string
 */
export const parseCurrencyAmount = (amountString, currency) => {
    // Remove currency symbol and whitespace
    let cleanString = amountString.replace(currency.symbol, '').trim();
    // Remove commas (thousand separators)
    cleanString = cleanString.replace(/,/g, '');
    // Parse the number
    const parsed = parseFloat(cleanString);
    if (isNaN(parsed))
        return null;
    return roundToCurrencyPrecision(parsed, currency);
};
/**
 * Compare two currency amounts
 */
export const compareCurrencyAmounts = (amount1, amount2) => {
    // If same currency, compare directly
    if (amount1.currency === amount2.currency) {
        return amount1.amount - amount2.amount;
    }
    // If different currencies, compare base amounts if available
    if (amount1.baseAmount !== undefined && amount2.baseAmount !== undefined) {
        return amount1.baseAmount - amount2.baseAmount;
    }
    // Cannot compare without conversion
    throw new Error('Cannot compare amounts in different currencies without base amounts');
};

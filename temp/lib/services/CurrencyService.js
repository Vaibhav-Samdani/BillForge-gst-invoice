// CurrencyService - Handles currency operations and ExchangeRate-API integration
import { SUPPORTED_CURRENCIES } from '../types/invoice';
import { convertCurrency, areRatesFresh, getCurrencyByCode } from '../utils/currency';
// Custom error classes for currency operations
export class CurrencyError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'CurrencyError';
    }
}
// ExchangeRate-API configuration
const EXCHANGE_RATE_API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest';
const CACHE_DURATION_HOURS = 1;
export class CurrencyService {
    constructor() {
        this.exchangeRateCache = new Map();
        this.lastCacheUpdate = new Map();
    }
    /**
     * Get all supported currencies
     */
    getSupportedCurrencies() {
        return [...SUPPORTED_CURRENCIES];
    }
    /**
     * Get currency by code
     */
    getCurrency(code) {
        return getCurrencyByCode(code) || null;
    }
    /**
     * Check if a currency is supported
     */
    isCurrencySupported(code) {
        return SUPPORTED_CURRENCIES.some(currency => currency.code === code);
    }
    /**
     * Fetch exchange rates from ExchangeRate-API
     */
    async fetchExchangeRates(baseCurrency = 'USD') {
        if (!this.isCurrencySupported(baseCurrency)) {
            throw new CurrencyError(`Base currency ${baseCurrency} is not supported`, 'INVALID_CURRENCY_CODE');
        }
        try {
            const response = await fetch(`${EXCHANGE_RATE_API_BASE_URL}/${baseCurrency}`);
            if (!response.ok) {
                throw new CurrencyError(`Failed to fetch exchange rates: ${response.status} ${response.statusText}`, 'CURRENCY_API_UNAVAILABLE');
            }
            const data = await response.json();
            if (!data.rates) {
                throw new CurrencyError('Invalid response format from exchange rate API', 'CURRENCY_API_UNAVAILABLE');
            }
            const timestamp = new Date();
            const exchangeRates = [];
            // Convert API response to our ExchangeRate format
            for (const [targetCurrency, rate] of Object.entries(data.rates)) {
                if (this.isCurrencySupported(targetCurrency) && targetCurrency !== baseCurrency) {
                    exchangeRates.push({
                        baseCurrency,
                        targetCurrency,
                        rate: rate,
                        timestamp,
                        source: 'ExchangeRate-API'
                    });
                }
            }
            // Cache the results
            this.exchangeRateCache.set(baseCurrency, exchangeRates);
            this.lastCacheUpdate.set(baseCurrency, timestamp);
            return exchangeRates;
        }
        catch (error) {
            if (error instanceof CurrencyError) {
                throw error;
            }
            throw new CurrencyError(`Network error while fetching exchange rates: ${error instanceof Error ? error.message : 'Unknown error'}`, 'CURRENCY_API_UNAVAILABLE');
        }
    }
    /**
     * Get exchange rates with caching
     */
    async getExchangeRates(baseCurrency = 'USD', forceRefresh = false) {
        const cacheKey = baseCurrency;
        const cachedRates = this.exchangeRateCache.get(cacheKey);
        const lastUpdate = this.lastCacheUpdate.get(cacheKey);
        // Check if we have fresh cached data
        if (!forceRefresh && cachedRates && lastUpdate && areRatesFresh(cachedRates, CACHE_DURATION_HOURS)) {
            return cachedRates;
        }
        // Fetch fresh data
        try {
            return await this.fetchExchangeRates(baseCurrency);
        }
        catch (error) {
            // If API fails and we have cached data, return it with a warning
            if (cachedRates && cachedRates.length > 0) {
                console.warn('Using stale exchange rates due to API failure:', error);
                return cachedRates;
            }
            throw error;
        }
    }
    /**
     * Get exchange rate between two currencies
     */
    async getExchangeRate(fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return {
                baseCurrency: fromCurrency,
                targetCurrency: toCurrency,
                rate: 1,
                timestamp: new Date(),
                source: 'direct'
            };
        }
        if (!this.isCurrencySupported(fromCurrency) || !this.isCurrencySupported(toCurrency)) {
            throw new CurrencyError(`Unsupported currency: ${fromCurrency} or ${toCurrency}`, 'INVALID_CURRENCY_CODE');
        }
        // Try to get rates with fromCurrency as base
        try {
            const rates = await this.getExchangeRates(fromCurrency);
            const directRate = rates.find(rate => rate.targetCurrency === toCurrency);
            if (directRate) {
                return directRate;
            }
        }
        catch (error) {
            // Continue to try other methods
        }
        // Try to get rates with toCurrency as base and calculate inverse
        try {
            const rates = await this.getExchangeRates(toCurrency);
            const inverseRate = rates.find(rate => rate.targetCurrency === fromCurrency);
            if (inverseRate) {
                return {
                    baseCurrency: fromCurrency,
                    targetCurrency: toCurrency,
                    rate: 1 / inverseRate.rate,
                    timestamp: inverseRate.timestamp,
                    source: inverseRate.source
                };
            }
        }
        catch (error) {
            // Continue to try USD cross-rate
        }
        // Try cross-rate through USD
        try {
            const usdRates = await this.getExchangeRates('USD');
            const fromUsdRate = usdRates.find(rate => rate.targetCurrency === fromCurrency);
            const toUsdRate = usdRates.find(rate => rate.targetCurrency === toCurrency);
            if (fromUsdRate && toUsdRate) {
                const crossRate = toUsdRate.rate / fromUsdRate.rate;
                return {
                    baseCurrency: fromCurrency,
                    targetCurrency: toCurrency,
                    rate: crossRate,
                    timestamp: new Date(Math.min(fromUsdRate.timestamp.getTime(), toUsdRate.timestamp.getTime())),
                    source: 'cross-rate-USD'
                };
            }
        }
        catch (error) {
            // Final fallback failed
        }
        return null;
    }
    /**
     * Convert amount between currencies
     */
    async convertAmount(amount, fromCurrency, toCurrency) {
        if (amount < 0) {
            throw new CurrencyError('Amount cannot be negative', 'INVALID_AMOUNT');
        }
        const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
        if (!exchangeRate) {
            throw new CurrencyError(`Cannot find exchange rate from ${fromCurrency} to ${toCurrency}`, 'EXCHANGE_RATE_UNAVAILABLE');
        }
        return convertCurrency(amount, fromCurrency, toCurrency, exchangeRate.rate);
    }
    /**
     * Get cached exchange rates (for offline scenarios)
     */
    getCachedRates(baseCurrency = 'USD') {
        return this.exchangeRateCache.get(baseCurrency) || [];
    }
    /**
     * Check if cached rates are fresh
     */
    areCachedRatesFresh(baseCurrency = 'USD') {
        const cachedRates = this.exchangeRateCache.get(baseCurrency);
        return cachedRates ? areRatesFresh(cachedRates, CACHE_DURATION_HOURS) : false;
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.exchangeRateCache.clear();
        this.lastCacheUpdate.clear();
    }
    /**
     * Get cache status information
     */
    getCacheStatus() {
        const status = {};
        for (const [baseCurrency, rates] of this.exchangeRateCache.entries()) {
            const lastUpdate = this.lastCacheUpdate.get(baseCurrency);
            if (lastUpdate) {
                status[baseCurrency] = {
                    lastUpdate,
                    rateCount: rates.length,
                    isFresh: areRatesFresh(rates, CACHE_DURATION_HOURS)
                };
            }
        }
        return status;
    }
    /**
     * Refresh all cached rates
     */
    async refreshAllRates() {
        const baseCurrencies = Array.from(this.exchangeRateCache.keys());
        const refreshPromises = baseCurrencies.map(async (baseCurrency) => {
            try {
                await this.fetchExchangeRates(baseCurrency);
            }
            catch (error) {
                console.warn(`Failed to refresh rates for ${baseCurrency}:`, error);
            }
        });
        await Promise.all(refreshPromises);
    }
    /**
     * Validate exchange rate data
     */
    validateExchangeRate(rate) {
        const errors = [];
        if (!rate.baseCurrency || !rate.targetCurrency) {
            errors.push('Base currency and target currency are required');
        }
        if (rate.baseCurrency === rate.targetCurrency) {
            errors.push('Base currency and target currency cannot be the same');
        }
        if (!this.isCurrencySupported(rate.baseCurrency)) {
            errors.push(`Base currency ${rate.baseCurrency} is not supported`);
        }
        if (!this.isCurrencySupported(rate.targetCurrency)) {
            errors.push(`Target currency ${rate.targetCurrency} is not supported`);
        }
        if (typeof rate.rate !== 'number' || rate.rate <= 0) {
            errors.push('Exchange rate must be a positive number');
        }
        if (!rate.timestamp || !(rate.timestamp instanceof Date)) {
            errors.push('Valid timestamp is required');
        }
        if (!rate.source || typeof rate.source !== 'string') {
            errors.push('Source is required');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
// Export a singleton instance
export const currencyService = new CurrencyService();

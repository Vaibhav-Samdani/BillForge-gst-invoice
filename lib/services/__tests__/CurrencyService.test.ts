import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CurrencyService, CurrencyError } from '../CurrencyService';

// Mock fetch globally
global.fetch = vi.fn();

describe('CurrencyService', () => {
  let currencyService: CurrencyService;

  beforeEach(() => {
    vi.clearAllMocks();
    currencyService = new CurrencyService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSupportedCurrencies', () => {
    it('should return list of supported currencies', () => {
      const currencies = currencyService.getSupportedCurrencies();

      expect(currencies).toBeInstanceOf(Array);
      expect(currencies.length).toBeGreaterThan(0);

      // Check for common currencies
      const usd = currencies.find(c => c.code === 'USD');
      const eur = currencies.find(c => c.code === 'EUR');

      expect(usd).toBeDefined();
      expect(usd?.name).toBe('US Dollar');
      expect(usd?.symbol).toBe('$');
      expect(usd?.decimalPlaces).toBe(2);

      expect(eur).toBeDefined();
      expect(eur?.name).toBe('Euro');
      expect(eur?.symbol).toBe('€');
    });
  });

  describe('getExchangeRate', () => {
    it('should fetch exchange rate from API', async () => {
      const mockResponse = {
        rates: {
          EUR: 0.85
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const rate = await currencyService.getExchangeRate('USD', 'EUR');

      expect(rate?.baseCurrency).toBe('USD');
      expect(rate?.targetCurrency).toBe('EUR');
      expect(rate?.rate).toBe(0.85);
      expect(rate?.source).toBe('ExchangeRate-API');
      expect(rate?.timestamp).toBeInstanceOf(Date);
    });

    it('should return 1.0 for same currency conversion', async () => {
      const rate = await currencyService.getExchangeRate('USD', 'USD');

      expect(rate?.rate).toBe(1.0);
      expect(rate?.baseCurrency).toBe('USD');
      expect(rate?.targetCurrency).toBe('USD');
    });

    it('should use cached rates when available', async () => {
      const mockResponse = {
        rates: { EUR: 0.85 }
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // First call should fetch from API
      await currencyService.getExchangeRate('USD', 'EUR');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await currencyService.getExchangeRate('USD', 'EUR');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should refresh stale cache', async () => {
      const mockResponse = {
        rates: { EUR: 0.85 }
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // Mock Date.now to simulate time passage
      const originalNow = Date.now;
      let currentTime = 1000000;
      Date.now = vi.fn(() => currentTime);

      // First call
      await currencyService.getExchangeRate('USD', 'EUR');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Advance time by 2 hours (cache expires after 1 hour)
      currentTime += 2 * 60 * 60 * 1000;

      // Second call should refresh cache
      await currencyService.getExchangeRate('USD', 'EUR');
      expect(global.fetch).toHaveBeenCalledTimes(2);

      Date.now = originalNow;
    });

    it('should throw error when API is unavailable', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(currencyService.getExchangeRate('USD', 'EUR'))
        .rejects.toThrow(CurrencyError);
    });

    it('should throw error for unsupported currency', async () => {
      await expect(currencyService.getExchangeRate('USD', 'INVALID'))
        .rejects.toThrow(CurrencyError);
    });

    it('should handle API error response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      await expect(currencyService.getExchangeRate('USD', 'EUR'))
        .rejects.toThrow(CurrencyError);
    });
  });

  describe('convertAmount', () => {
    beforeEach(() => {
      const mockResponse = {
        rates: { EUR: 0.85, GBP: 0.75 }
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
    });

    it('should convert amount between currencies', async () => {
      const result = await currencyService.convertAmount(100, 'USD', 'EUR');

      expect(result.amount).toBe(85);
      expect(result.currency).toBe('EUR');
      expect(result.exchangeRate).toBe(0.85);
      expect(result.baseAmount).toBe(100);
    });

    it('should handle same currency conversion', async () => {
      const result = await currencyService.convertAmount(100, 'USD', 'USD');

      expect(result.amount).toBe(100);
      expect(result.currency).toBe('USD');
      expect(result.exchangeRate).toBe(1.0);
      expect(result.baseAmount).toBe(100);
    });

    it('should round to appropriate decimal places', async () => {
      const result = await currencyService.convertAmount(100, 'USD', 'EUR');

      // 100 * 0.85 = 85.00 (should be rounded to 2 decimal places)
      expect(result.amount).toBe(85);

      // Test with amount that would have more decimals
      const result2 = await currencyService.convertAmount(33.33, 'USD', 'EUR');
      expect(result2.amount).toBe(28.33); // 33.33 * 0.85 = 28.3305, rounded to 28.33
    });

    it('should handle zero amounts', async () => {
      await expect(currencyService.convertAmount(0, 'USD', 'EUR'))
        .rejects.toThrow(CurrencyError); // Service rejects negative amounts
    });

    it('should handle negative amounts', async () => {
      await expect(currencyService.convertAmount(-100, 'USD', 'EUR'))
        .rejects.toThrow(CurrencyError); // Service rejects negative amounts
    });
  });

  // Note: formatCurrency is likely in utils/currency, not the service
  describe('currency utilities', () => {
    it('should get currency by code', () => {
      const usd = currencyService.getCurrency('USD');
      expect(usd?.code).toBe('USD');
      expect(usd?.name).toBe('US Dollar');
      expect(usd?.symbol).toBe('$');
    });

    it('should check if currency is supported', () => {
      expect(currencyService.isCurrencySupported('USD')).toBe(true);
      expect(currencyService.isCurrencySupported('EUR')).toBe(true);
      expect(currencyService.isCurrencySupported('INVALID')).toBe(false);
    });
  });

  describe('getCachedRates', () => {
    it('should return cached exchange rates', async () => {
      const mockResponse = {
        rates: { EUR: 0.85, GBP: 0.75 }
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // Populate cache by fetching rates
      await currencyService.getExchangeRates('USD');

      const cachedRates = currencyService.getCachedRates('USD');

      expect(cachedRates.length).toBeGreaterThan(0);
      expect(cachedRates.find(r => r.targetCurrency === 'EUR')).toBeDefined();
      expect(cachedRates.find(r => r.targetCurrency === 'GBP')).toBeDefined();
    });

    it('should return empty array when no cached rates', () => {
      const cachedRates = currencyService.getCachedRates('USD');
      expect(cachedRates).toHaveLength(0);
    });
  });

  describe('refreshAllRates', () => {
    it('should refresh all cached rates', async () => {
      const mockResponse = {
        rates: { EUR: 0.85, GBP: 0.75 }
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // Populate cache
      await currencyService.getExchangeRate('USD', 'EUR');
      await currencyService.getExchangeRate('USD', 'GBP');

      // Clear fetch mock calls
      vi.clearAllMocks();

      // Refresh rates
      await currencyService.refreshAllRates();

      // Should have made API calls for cached currencies
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only one call for USD base currency
    });
  });

  describe('error handling', () => {
    it('should throw CurrencyError with appropriate codes', async () => {
      // Test API unavailable
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      try {
        await currencyService.getExchangeRate('USD', 'EUR');
      } catch (error) {
        expect(error).toBeInstanceOf(CurrencyError);
        expect((error as CurrencyError).code).toBe('CURRENCY_API_UNAVAILABLE');
      }

      // Test invalid currency
      try {
        await currencyService.getExchangeRate('USD', 'INVALID');
      } catch (error) {
        expect(error).toBeInstanceOf(CurrencyError);
        expect((error as CurrencyError).code).toBe('INVALID_CURRENCY_CODE');
      }
    });
  });
});
import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  convertCurrency,
  getCurrencySymbol,
  getCurrencyDecimalPlaces,
  roundToCurrency,
  parseCurrencyAmount,
  validateCurrencyCode,
  calculateExchangeRate,
  formatExchangeRate,
  getCurrencyName
} from '../currency';

describe('Currency Utilities', () => {
  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
      expect(formatCurrency(0, 'USD')).toBe('$0.00');
      expect(formatCurrency(-100, 'USD')).toBe('-$100.00');
    });

    it('should format EUR currency correctly', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
      expect(formatCurrency(0, 'EUR')).toBe('€0.00');
    });

    it('should format GBP currency correctly', () => {
      expect(formatCurrency(1234.56, 'GBP')).toBe('£1,234.56');
    });

    it('should format JPY currency correctly (no decimals)', () => {
      expect(formatCurrency(1234, 'JPY')).toBe('¥1,234');
      expect(formatCurrency(1234.56, 'JPY')).toBe('¥1,235'); // Rounded
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1234567.89, 'USD')).toBe('$1,234,567.89');
    });

    it('should handle small numbers', () => {
      expect(formatCurrency(0.01, 'USD')).toBe('$0.01');
      expect(formatCurrency(0.001, 'USD')).toBe('$0.00'); // Rounded
    });

    it('should handle unknown currency codes', () => {
      expect(formatCurrency(100, 'UNKNOWN')).toBe('UNKNOWN 100.00');
    });
  });

  describe('convertCurrency', () => {
    it('should convert currency amounts', () => {
      const result = convertCurrency(100, 0.85);
      expect(result).toBe(85);
    });

    it('should handle decimal precision', () => {
      const result = convertCurrency(33.33, 0.85);
      expect(result).toBe(28.33); // 33.33 * 0.85 = 28.3305, rounded to 28.33
    });

    it('should handle zero amounts', () => {
      const result = convertCurrency(0, 0.85);
      expect(result).toBe(0);
    });

    it('should handle negative amounts', () => {
      const result = convertCurrency(-100, 0.85);
      expect(result).toBe(-85);
    });

    it('should handle rate of 1', () => {
      const result = convertCurrency(100, 1);
      expect(result).toBe(100);
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return correct symbols for major currencies', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('EUR')).toBe('€');
      expect(getCurrencySymbol('GBP')).toBe('£');
      expect(getCurrencySymbol('JPY')).toBe('¥');
      expect(getCurrencySymbol('CAD')).toBe('C$');
      expect(getCurrencySymbol('AUD')).toBe('A$');
    });

    it('should return currency code for unknown currencies', () => {
      expect(getCurrencySymbol('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('getCurrencyDecimalPlaces', () => {
    it('should return correct decimal places for currencies', () => {
      expect(getCurrencyDecimalPlaces('USD')).toBe(2);
      expect(getCurrencyDecimalPlaces('EUR')).toBe(2);
      expect(getCurrencyDecimalPlaces('GBP')).toBe(2);
      expect(getCurrencyDecimalPlaces('JPY')).toBe(0);
      expect(getCurrencyDecimalPlaces('KRW')).toBe(0);
    });

    it('should return 2 decimal places for unknown currencies', () => {
      expect(getCurrencyDecimalPlaces('UNKNOWN')).toBe(2);
    });
  });

  describe('roundToCurrency', () => {
    it('should round to currency decimal places', () => {
      expect(roundToCurrency(123.456, 'USD')).toBe(123.46);
      expect(roundToCurrency(123.454, 'USD')).toBe(123.45);
      expect(roundToCurrency(123.456, 'JPY')).toBe(123);
    });

    it('should handle negative numbers', () => {
      expect(roundToCurrency(-123.456, 'USD')).toBe(-123.46);
    });

    it('should handle zero', () => {
      expect(roundToCurrency(0, 'USD')).toBe(0);
    });
  });

  describe('parseCurrencyAmount', () => {
    it('should parse valid currency strings', () => {
      expect(parseCurrencyAmount('$123.45')).toBe(123.45);
      expect(parseCurrencyAmount('€1,234.56')).toBe(1234.56);
      expect(parseCurrencyAmount('£100')).toBe(100);
      expect(parseCurrencyAmount('¥1,000')).toBe(1000);
    });

    it('should parse numbers without currency symbols', () => {
      expect(parseCurrencyAmount('123.45')).toBe(123.45);
      expect(parseCurrencyAmount('1,234.56')).toBe(1234.56);
    });

    it('should handle negative amounts', () => {
      expect(parseCurrencyAmount('-$123.45')).toBe(-123.45);
      expect(parseCurrencyAmount('($123.45)')).toBe(-123.45);
    });

    it('should handle whitespace', () => {
      expect(parseCurrencyAmount(' $123.45 ')).toBe(123.45);
      expect(parseCurrencyAmount('$ 123.45')).toBe(123.45);
    });

    it('should return NaN for invalid strings', () => {
      expect(parseCurrencyAmount('invalid')).toBeNaN();
      expect(parseCurrencyAmount('')).toBeNaN();
      expect(parseCurrencyAmount('$')).toBeNaN();
    });
  });

  describe('validateCurrencyCode', () => {
    it('should validate supported currency codes', () => {
      expect(validateCurrencyCode('USD')).toBe(true);
      expect(validateCurrencyCode('EUR')).toBe(true);
      expect(validateCurrencyCode('GBP')).toBe(true);
      expect(validateCurrencyCode('JPY')).toBe(true);
    });

    it('should reject invalid currency codes', () => {
      expect(validateCurrencyCode('INVALID')).toBe(false);
      expect(validateCurrencyCode('US')).toBe(false); // Too short
      expect(validateCurrencyCode('USDD')).toBe(false); // Too long
      expect(validateCurrencyCode('')).toBe(false);
      expect(validateCurrencyCode('123')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(validateCurrencyCode('usd')).toBe(false);
      expect(validateCurrencyCode('Usd')).toBe(false);
    });
  });

  describe('calculateExchangeRate', () => {
    it('should calculate exchange rate from amounts', () => {
      const rate = calculateExchangeRate(100, 85);
      expect(rate).toBe(0.85);
    });

    it('should handle decimal precision', () => {
      const rate = calculateExchangeRate(100, 33.33);
      expect(rate).toBe(0.3333);
    });

    it('should handle zero target amount', () => {
      const rate = calculateExchangeRate(100, 0);
      expect(rate).toBe(0);
    });

    it('should throw error for zero base amount', () => {
      expect(() => calculateExchangeRate(0, 100)).toThrow('Base amount cannot be zero');
    });

    it('should handle negative amounts', () => {
      const rate = calculateExchangeRate(-100, -85);
      expect(rate).toBe(0.85);
    });
  });

  describe('formatExchangeRate', () => {
    it('should format exchange rates with appropriate precision', () => {
      expect(formatExchangeRate(0.85)).toBe('0.8500');
      expect(formatExchangeRate(1.2345)).toBe('1.2345');
      expect(formatExchangeRate(0.123456)).toBe('0.1235'); // Rounded to 4 decimals
    });

    it('should handle rates close to 1', () => {
      expect(formatExchangeRate(1.0)).toBe('1.0000');
      expect(formatExchangeRate(0.9999)).toBe('0.9999');
    });

    it('should handle very small rates', () => {
      expect(formatExchangeRate(0.0001)).toBe('0.0001');
      expect(formatExchangeRate(0.00001)).toBe('0.0000'); // Rounded
    });

    it('should handle large rates', () => {
      expect(formatExchangeRate(100.5)).toBe('100.5000');
    });
  });

  describe('getCurrencyName', () => {
    it('should return correct names for major currencies', () => {
      expect(getCurrencyName('USD')).toBe('US Dollar');
      expect(getCurrencyName('EUR')).toBe('Euro');
      expect(getCurrencyName('GBP')).toBe('British Pound');
      expect(getCurrencyName('JPY')).toBe('Japanese Yen');
      expect(getCurrencyName('CAD')).toBe('Canadian Dollar');
      expect(getCurrencyName('AUD')).toBe('Australian Dollar');
    });

    it('should return currency code for unknown currencies', () => {
      expect(getCurrencyName('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very large numbers', () => {
      const largeNumber = 999999999999.99;
      expect(formatCurrency(largeNumber, 'USD')).toBe('$999,999,999,999.99');
    });

    it('should handle very small numbers', () => {
      const smallNumber = 0.001;
      expect(formatCurrency(smallNumber, 'USD')).toBe('$0.00');
      expect(roundToCurrency(smallNumber, 'USD')).toBe(0);
    });

    it('should handle Infinity and NaN', () => {
      expect(formatCurrency(Infinity, 'USD')).toBe('$Infinity');
      expect(formatCurrency(NaN, 'USD')).toBe('$NaN');
      expect(roundToCurrency(NaN, 'USD')).toBeNaN();
    });

    it('should handle null and undefined inputs gracefully', () => {
      expect(formatCurrency(null as any, 'USD')).toBe('$0');
      expect(formatCurrency(undefined as any, 'USD')).toBe('$NaN');
      expect(getCurrencySymbol(null as any)).toBe('null');
      expect(getCurrencySymbol(undefined as any)).toBe('undefined');
    });
  });
});
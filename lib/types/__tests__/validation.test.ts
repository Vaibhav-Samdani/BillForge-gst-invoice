// Test file for validation functions
import { describe, it, expect } from 'vitest';
import {
  validateCurrency,
  validateExchangeRate,
  validateCurrencyAmount,
  validateRecurringConfig,
  validateClientUser,
  validatePasswordStrength,
} from '../validation';
import { Currency, ExchangeRate, CurrencyAmount, RecurringConfig, ClientUser } from '../invoice';

describe('Validation Functions', () => {
  describe('validateCurrency', () => {
    it('should validate a correct currency', () => {
      const currency: Currency = {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        decimalPlaces: 2,
      };

      const result = validateCurrency(currency);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid currency code', () => {
      const currency: Currency = {
        code: 'INVALID',
        symbol: '$',
        name: 'US Dollar',
        decimalPlaces: 2,
      };

      const result = validateCurrency(currency);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Currency code must be a 3-character string');
    });

    it('should reject unsupported currency', () => {
      const currency: Currency = {
        code: 'XYZ',
        symbol: 'X',
        name: 'Test Currency',
        decimalPlaces: 2,
      };

      const result = validateCurrency(currency);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Currency XYZ is not supported');
    });
  });

  describe('validateExchangeRate', () => {
    it('should validate a correct exchange rate', () => {
      const exchangeRate: ExchangeRate = {
        baseCurrency: 'USD',
        targetCurrency: 'EUR',
        rate: 0.85,
        timestamp: new Date(),
        source: 'ExchangeRate-API',
      };

      const result = validateExchangeRate(exchangeRate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject same base and target currency', () => {
      const exchangeRate: ExchangeRate = {
        baseCurrency: 'USD',
        targetCurrency: 'USD',
        rate: 1.0,
        timestamp: new Date(),
        source: 'ExchangeRate-API',
      };

      const result = validateExchangeRate(exchangeRate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Base currency and target currency cannot be the same');
    });

    it('should reject old exchange rates', () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25); // 25 hours ago

      const exchangeRate: ExchangeRate = {
        baseCurrency: 'USD',
        targetCurrency: 'EUR',
        rate: 0.85,
        timestamp: oldDate,
        source: 'ExchangeRate-API',
      };

      const result = validateExchangeRate(exchangeRate);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Exchange rate is older than 24 hours');
    });
  });

  describe('validateCurrencyAmount', () => {
    it('should validate a correct currency amount', () => {
      const currencyAmount: CurrencyAmount = {
        amount: 100.50,
        currency: 'USD',
        exchangeRate: 1.0,
        baseAmount: 100.50,
      };

      const result = validateCurrencyAmount(currencyAmount);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative amounts', () => {
      const currencyAmount: CurrencyAmount = {
        amount: -50.00,
        currency: 'USD',
      };

      const result = validateCurrencyAmount(currencyAmount);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount cannot be negative');
    });
  });

  describe('validateRecurringConfig', () => {
    it('should validate a correct recurring config', () => {
      const config: RecurringConfig = {
        frequency: 'monthly',
        interval: 1,
        startDate: new Date(),
        nextGenerationDate: new Date(),
        isActive: true,
      };

      const result = validateRecurringConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid frequency', () => {
      const config: RecurringConfig = {
        frequency: 'invalid' as any,
        interval: 1,
        startDate: new Date(),
        nextGenerationDate: new Date(),
        isActive: true,
      };

      const result = validateRecurringConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Frequency must be one of: weekly, monthly, quarterly, yearly');
    });

    it('should reject end date before start date', () => {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before

      const config: RecurringConfig = {
        frequency: 'monthly',
        interval: 1,
        startDate,
        endDate,
        nextGenerationDate: startDate,
        isActive: true,
      };

      const result = validateRecurringConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('End date must be after start date');
    });
  });

  describe('validateClientUser', () => {
    it('should validate a correct client user', () => {
      const user: ClientUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        name: 'John Doe',
        company: 'Test Company',
        isVerified: true,
        createdAt: new Date(),
      };

      const result = validateClientUser(user);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid email', () => {
      const user: ClientUser = {
        id: 'user-123',
        email: 'invalid-email',
        passwordHash: 'hashedpassword123',
        name: 'John Doe',
        isVerified: true,
        createdAt: new Date(),
      };

      const result = validateClientUser(user);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid email address is required');
    });

    it('should reject short names', () => {
      const user: ClientUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        name: 'A',
        isVerified: true,
        createdAt: new Date(),
      };

      const result = validateClientUser(user);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name must be at least 2 characters');
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate a strong password', () => {
      const result = validatePasswordStrength('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = validatePasswordStrength('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should require uppercase letters', () => {
      const result = validatePasswordStrength('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should require numbers', () => {
      const result = validatePasswordStrength('NoNumbers!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should require special characters', () => {
      const result = validatePasswordStrength('NoSpecialChars123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });
});
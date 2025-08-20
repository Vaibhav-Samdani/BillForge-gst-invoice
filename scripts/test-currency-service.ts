// Test script to demonstrate CurrencyService functionality
import { CurrencyService } from '../lib/services/CurrencyService';

async function testCurrencyService() {
  console.log('🚀 Testing CurrencyService...\n');

  const currencyService = new CurrencyService();

  try {
    // Test 1: Get supported currencies
    console.log('1. Supported Currencies:');
    const currencies = currencyService.getSupportedCurrencies();
    currencies.forEach(currency => {
      console.log(`   ${currency.code} (${currency.symbol}) - ${currency.name}`);
    });
    console.log();

    // Test 2: Check currency support
    console.log('2. Currency Support Check:');
    console.log(`   USD supported: ${currencyService.isCurrencySupported('USD')}`);
    console.log(`   EUR supported: ${currencyService.isCurrencySupported('EUR')}`);
    console.log(`   XYZ supported: ${currencyService.isCurrencySupported('XYZ')}`);
    console.log();

    // Test 3: Get currency by code
    console.log('3. Get Currency by Code:');
    const usd = currencyService.getCurrency('USD');
    const invalid = currencyService.getCurrency('INVALID');
    console.log(`   USD: ${usd ? `${usd.name} (${usd.symbol})` : 'Not found'}`);
    console.log(`   INVALID: ${invalid ? `${invalid.name} (${invalid.symbol})` : 'Not found'}`);
    console.log();

    // Test 4: Fetch exchange rates (this will fail without internet, but shows the API)
    console.log('4. Fetching Exchange Rates (this may fail without internet):');
    try {
      const rates = await currencyService.fetchExchangeRates('USD');
      console.log(`   Successfully fetched ${rates.length} exchange rates`);
      rates.slice(0, 3).forEach(rate => {
        console.log(`   ${rate.baseCurrency} → ${rate.targetCurrency}: ${rate.rate}`);
      });
    } catch (error) {
      console.log(`   ❌ Failed to fetch rates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    console.log();

    // Test 5: Cache status
    console.log('5. Cache Status:');
    const cacheStatus = currencyService.getCacheStatus();
    if (Object.keys(cacheStatus).length === 0) {
      console.log('   No cached data');
    } else {
      Object.entries(cacheStatus).forEach(([currency, status]) => {
        console.log(`   ${currency}: ${status.rateCount} rates, fresh: ${status.isFresh}`);
      });
    }
    console.log();

    // Test 6: Validation
    console.log('6. Exchange Rate Validation:');
    const validRate = {
      baseCurrency: 'USD',
      targetCurrency: 'EUR',
      rate: 0.85,
      timestamp: new Date(),
      source: 'test'
    };
    
    const invalidRate = {
      baseCurrency: 'USD',
      targetCurrency: 'USD', // Same currency
      rate: -1, // Negative rate
      timestamp: new Date(),
      source: 'test'
    };

    const validResult = currencyService.validateExchangeRate(validRate);
    const invalidResult = currencyService.validateExchangeRate(invalidRate);

    console.log(`   Valid rate: ${validResult.isValid ? '✅' : '❌'}`);
    console.log(`   Invalid rate: ${invalidResult.isValid ? '✅' : '❌'}`);
    if (!invalidResult.isValid) {
      console.log(`   Errors: ${invalidResult.errors.join(', ')}`);
    }

    console.log('\n✅ CurrencyService test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testCurrencyService();
}

export { testCurrencyService };
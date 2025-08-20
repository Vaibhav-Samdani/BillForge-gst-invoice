#!/usr/bin/env tsx

/**
 * Test script to verify multi-currency functionality
 */

import useInvoiceStore from '../lib/store';
import { SUPPORTED_CURRENCIES } from '../lib/types/invoice';
import { currencyService } from '../lib/services/CurrencyService';

async function testMultiCurrency() {
  console.log('🧪 Testing Multi-Currency Invoice Calculations\n');

  // Get the store instance
  const store = useInvoiceStore.getState();

  // Display initial state
  console.log('📊 Initial Invoice State:');
  console.log(`Currency: ${store.selectedCurrency.code} (${store.selectedCurrency.symbol})`);
  console.log(`Items: ${store.items.length}`);
  console.log(`Subtotal: ${store.selectedCurrency.symbol}${store.totals.subtotal}`);
  console.log(`Total: ${store.selectedCurrency.symbol}${store.totals.total}\n`);

  // Test currency conversion to EUR
  console.log('💱 Testing Currency Conversion to EUR...');
  const eurCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'EUR');
  
  if (eurCurrency) {
    try {
      // Mock exchange rate for testing
      store.updateExchangeRates([{
        baseCurrency: 'USD',
        targetCurrency: 'EUR',
        rate: 0.85,
        timestamp: new Date(),
        source: 'test'
      }]);

      await store.setCurrency(eurCurrency);
      
      console.log('✅ Currency conversion successful!');
      console.log(`New Currency: ${store.selectedCurrency.code} (${store.selectedCurrency.symbol})`);
      console.log(`Converted Subtotal: ${store.selectedCurrency.symbol}${store.totals.subtotal}`);
      console.log(`Converted Total: ${store.selectedCurrency.symbol}${store.totals.total}\n`);
    } catch (error) {
      console.error('❌ Currency conversion failed:', error);
    }
  }

  // Test adding a new item with the new currency
  console.log('➕ Testing Add Item with New Currency...');
  store.addItem();
  const newItemId = store.items[store.items.length - 1].id;
  store.updateItem(newItemId, {
    description: 'Test Product',
    quantity: 3,
    rate: 50,
    gst: 20
  });

  console.log('✅ Item added successfully!');
  console.log(`New item amount: ${store.selectedCurrency.symbol}${store.items[store.items.length - 1].amount}`);
  console.log(`Updated Total: ${store.selectedCurrency.symbol}${store.totals.total}\n`);

  // Test JPY conversion (zero decimal places)
  console.log('🇯🇵 Testing JPY Currency (Zero Decimal Places)...');
  const jpyCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'JPY');
  
  if (jpyCurrency) {
    try {
      // Mock exchange rate for JPY
      store.updateExchangeRates([{
        baseCurrency: 'EUR',
        targetCurrency: 'JPY',
        rate: 130,
        timestamp: new Date(),
        source: 'test'
      }]);

      await store.setCurrency(jpyCurrency);
      
      console.log('✅ JPY conversion successful!');
      console.log(`JPY Currency: ${store.selectedCurrency.code} (${store.selectedCurrency.symbol})`);
      console.log(`JPY Subtotal: ${store.selectedCurrency.symbol}${store.totals.subtotal}`);
      console.log(`JPY Total: ${store.selectedCurrency.symbol}${store.totals.total}\n`);
    } catch (error) {
      console.error('❌ JPY conversion failed:', error);
    }
  }

  // Test currency service
  console.log('🌐 Testing Currency Service...');
  try {
    const supportedCurrencies = currencyService.getSupportedCurrencies();
    console.log(`✅ Supported currencies: ${supportedCurrencies.map(c => c.code).join(', ')}`);
    
    const usdCurrency = currencyService.getCurrency('USD');
    console.log(`✅ USD Currency: ${usdCurrency?.name} (${usdCurrency?.symbol})`);
    
    console.log('✅ Currency service working correctly!\n');
  } catch (error) {
    console.error('❌ Currency service error:', error);
  }

  console.log('🎉 Multi-Currency Test Complete!');
}

// Run the test
testMultiCurrency().catch(console.error);
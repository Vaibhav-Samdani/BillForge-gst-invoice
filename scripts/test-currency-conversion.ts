#!/usr/bin/env tsx

/**
 * Simple test to verify currency conversion logic
 */

import { convertCurrency, formatCurrencyAmount } from '../lib/utils/currency';
import { SUPPORTED_CURRENCIES } from '../lib/types/invoice';

async function testCurrencyConversion() {
  console.log('🧪 Testing Currency Conversion Logic\n');

  // Test basic conversion
  const usdCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'USD')!;
  const eurCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'EUR')!;
  const jpyCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'JPY')!;

  // Test USD to EUR conversion
  console.log('💱 USD to EUR Conversion:');
  const usdAmount = 100;
  const exchangeRate = 0.85;
  const convertedAmount = convertCurrency(usdAmount, 'USD', 'EUR', exchangeRate);
  
  console.log(`Original: ${formatCurrencyAmount(usdAmount, usdCurrency)}`);
  console.log(`Converted: ${formatCurrencyAmount(convertedAmount.amount, eurCurrency)}`);
  console.log(`Exchange Rate: ${exchangeRate}`);
  console.log(`Base Amount: ${convertedAmount.baseAmount}\n`);

  // Test USD to JPY conversion (zero decimal places)
  console.log('🇯🇵 USD to JPY Conversion:');
  const jpyRate = 110;
  const jpyAmount = convertCurrency(usdAmount, 'USD', 'JPY', jpyRate);
  
  console.log(`Original: ${formatCurrencyAmount(usdAmount, usdCurrency)}`);
  console.log(`Converted: ${formatCurrencyAmount(jpyAmount.amount, jpyCurrency)}`);
  console.log(`Exchange Rate: ${jpyRate}`);
  console.log(`Base Amount: ${jpyAmount.baseAmount}\n`);

  // Test same currency conversion
  console.log('🔄 Same Currency Conversion:');
  const sameAmount = convertCurrency(usdAmount, 'USD', 'USD', 1);
  
  console.log(`Original: ${formatCurrencyAmount(usdAmount, usdCurrency)}`);
  console.log(`Converted: ${formatCurrencyAmount(sameAmount.amount, usdCurrency)}`);
  console.log(`Exchange Rate: ${sameAmount.exchangeRate}`);
  console.log(`Base Amount: ${sameAmount.baseAmount}\n`);

  // Test formatting with different currencies
  console.log('💰 Currency Formatting Test:');
  const testAmount = 1234.56;
  
  SUPPORTED_CURRENCIES.forEach(currency => {
    const formatted = formatCurrencyAmount(testAmount, currency);
    console.log(`${currency.code}: ${formatted}`);
  });

  console.log('\n🎉 Currency Conversion Test Complete!');
}

// Run the test
testCurrencyConversion().catch(console.error);
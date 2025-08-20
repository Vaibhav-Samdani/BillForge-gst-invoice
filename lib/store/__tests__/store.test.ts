import { describe, it, expect, beforeEach, vi } from 'vitest';
import useInvoiceStore from '..';
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '../../types/invoice';
import { currencyService } from '../../services/CurrencyService';

// Mock the currency service
vi.mock('../../services/CurrencyService', () => ({
  currencyService: {
    getExchangeRate: vi.fn(),
  },
}));

describe('Invoice Store - Multi-Currency Support', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useInvoiceStore.setState({
      business: {
        name: "Test Business",
        address: "Test Address",
        phone: "1234567890",
        gstin: "TEST123",
        email: "test@example.com",
        company: "Test Company",
      },
      client: {
        name: "Test Client",
        company: "Client Company",
        address: "Client Address",
        phone: "0987654321",
        email: "client@example.com",
        gstin: "CLIENT123",
      },
      items: [
        {
          id: "1",
          description: "Test Item",
          hsnSac: "1234",
          quantity: 2,
          rate: 100,
          per: "NOS",
          gst: 18,
          amount: 200,
        },
      ],
      invoiceNumber: "TEST001",
      invoiceDate: "2024-01-01",
      sameGst: true,
      globalGst: 18,
      selectedCurrency: DEFAULT_CURRENCY,
      exchangeRates: [],
      supportedCurrencies: SUPPORTED_CURRENCIES,
      recurringConfig: null,
      recurringInvoices: [],
      currentInvoice: null,
      savedInvoices: [],
      totals: {
        subtotal: 200,
        cgst: 18,
        sgst: 18,
        igst: 0,
        round_off: 0,
        total: 236,
      },
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  it('should calculate totals correctly with default currency', () => {
    const state = useInvoiceStore.getState();
    
    expect(state.totals.subtotal).toBe(200);
    expect(state.totals.cgst).toBe(18);
    expect(state.totals.sgst).toBe(18);
    expect(state.totals.total).toBe(236);
    expect(state.selectedCurrency.code).toBe('USD');
  });

  it('should update item amounts with currency precision', () => {
    const { updateItem } = useInvoiceStore.getState();
    
    // Update item with decimal values
    updateItem("1", { rate: 100.555, quantity: 2 });
    
    const state = useInvoiceStore.getState();
    const updatedItem = state.items.find(item => item.id === "1");
    
    expect(updatedItem?.rate).toBe(100.555);
    expect(updatedItem?.amount).toBe(201.11); // Rounded to 2 decimal places for USD
  });

  it('should handle currency change without conversion when no exchange rates', async () => {
    const { setCurrency } = useInvoiceStore.getState();
    const eurCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'EUR')!;
    
    // Mock currency service to return null (no exchange rate available)
    vi.mocked(currencyService.getExchangeRate).mockResolvedValue(null);
    
    await setCurrency(eurCurrency);
    
    const state = useInvoiceStore.getState();
    expect(state.selectedCurrency.code).toBe('EUR');
    // Items should remain unchanged if conversion fails
    expect(state.items[0].rate).toBe(100);
    expect(state.items[0].amount).toBe(200);
  });

  it('should convert currency when exchange rate is available', async () => {
    const { setCurrency } = useInvoiceStore.getState();
    const eurCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'EUR')!;
    
    // Mock currency service to return exchange rate
    vi.mocked(currencyService.getExchangeRate).mockResolvedValue({
      baseCurrency: 'USD',
      targetCurrency: 'EUR',
      rate: 0.85,
      timestamp: new Date(),
      source: 'test',
    });
    
    await setCurrency(eurCurrency);
    
    const state = useInvoiceStore.getState();
    expect(state.selectedCurrency.code).toBe('EUR');
    expect(state.items[0].rate).toBe(85); // 100 * 0.85
    expect(state.items[0].amount).toBe(170); // 2 * 85
  });

  it('should recalculate totals after currency change', async () => {
    const { setCurrency } = useInvoiceStore.getState();
    const eurCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'EUR')!;
    
    // Mock currency service to return exchange rate
    vi.mocked(currencyService.getExchangeRate).mockResolvedValue({
      baseCurrency: 'USD',
      targetCurrency: 'EUR',
      rate: 0.85,
      timestamp: new Date(),
      source: 'test',
    });
    
    await setCurrency(eurCurrency);
    
    const state = useInvoiceStore.getState();
    expect(state.totals.subtotal).toBe(170); // 200 * 0.85
    expect(state.totals.cgst).toBe(15.3); // 18 * 0.85
    expect(state.totals.sgst).toBe(15.3); // 18 * 0.85
    expect(state.totals.total).toBe(201); // Rounded total
  });

  it('should handle JPY currency with zero decimal places', () => {
    const { updateItem } = useInvoiceStore.getState();
    const jpyCurrency = SUPPORTED_CURRENCIES.find(c => c.code === 'JPY')!;
    
    // Set currency to JPY first
    useInvoiceStore.setState({ selectedCurrency: jpyCurrency });
    
    // Update item with decimal values
    updateItem("1", { rate: 100.75, quantity: 2 });
    
    const state = useInvoiceStore.getState();
    const updatedItem = state.items.find(item => item.id === "1");
    
    expect(updatedItem?.amount).toBe(202); // Rounded to 0 decimal places for JPY
  });

  it('should not change currency if same currency is selected', async () => {
    const { setCurrency } = useInvoiceStore.getState();
    const originalState = useInvoiceStore.getState();
    
    await setCurrency(DEFAULT_CURRENCY);
    
    const newState = useInvoiceStore.getState();
    expect(newState.items).toEqual(originalState.items);
    expect(newState.totals).toEqual(originalState.totals);
  });
});
// lib/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Currency, ExchangeRate, RecurringConfig, EnhancedInvoice, DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from "./types/invoice";
import { currencyService } from "./services/CurrencyService";
import { convertCurrency, calculateExchangeRate } from "./utils/currency";

// Interface definitions
export interface BusinessInfo {
  name: string;
  company: string;
  address: string;
  gstin: string;
  email: string;
  phone: string;
}

export interface ClientInfo {
  name: string;
  company: string;
  address: string;
  gstin: string;
  email: string;
  phone: string;
}

export interface LineItem {
  id: string;
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  per: string;
  gst: number;
  amount: number;
}

export interface InvoiceTotals {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  round_off: number;
  total: number;
}

export interface InvoiceState {
  business: BusinessInfo;
  client: ClientInfo;
  items: LineItem[];
  invoiceNumber: string;
  invoiceDate: string;
  sameGst: boolean;
  globalGst: number;
  totals: InvoiceTotals;

  // Enhanced fields for multi-currency and recurring invoices
  selectedCurrency: Currency;
  exchangeRates: ExchangeRate[];
  supportedCurrencies: Currency[];
  recurringConfig: RecurringConfig | null;
  recurringInvoices: EnhancedInvoice[];
  currentInvoice: EnhancedInvoice | null;
  savedInvoices: EnhancedInvoice[];

  // Existing actions
  setBusiness: (business: Partial<BusinessInfo>) => void;
  setClient: (client: Partial<ClientInfo>) => void;
  setInvoiceNumber: (number: string) => void;
  setInvoiceDate: (date: string) => void;
  addItem: () => void;
  updateItem: (id: string, item: Partial<LineItem>) => void;
  removeItem: (id: string) => void;
  setSameGst: (same: boolean) => void;
  setGlobalGst: (gst: number) => void;

  // New enhanced actions
  setCurrency: (currency: Currency) => Promise<void>;
  updateExchangeRates: (rates: ExchangeRate[]) => void;
  setRecurringConfig: (config: RecurringConfig | null) => void;
  saveInvoice: (invoice: EnhancedInvoice) => Promise<void>;
  loadInvoices: () => Promise<EnhancedInvoice[]>;
  generateRecurringInvoice: (templateId: string) => Promise<EnhancedInvoice>;
}

// Define a type for just the data needed for calculations
export type InvoiceData = {
  business: BusinessInfo;
  client: ClientInfo;
  items: LineItem[];
  invoiceNumber: string;
  invoiceDate: string;
  sameGst: boolean;
  globalGst: number;
};

// Helper function to convert line item amounts to target currency
const convertLineItemAmounts = async (
  items: LineItem[], 
  fromCurrency: Currency, 
  toCurrency: Currency, 
  exchangeRates: ExchangeRate[]
): Promise<LineItem[]> => {
  if (fromCurrency.code === toCurrency.code) {
    return items; // No conversion needed
  }

  const exchangeRate = calculateExchangeRate(fromCurrency.code, toCurrency.code, exchangeRates);
  
  if (!exchangeRate) {
    // If no exchange rate available, try to fetch it
    try {
      const rate = await currencyService.getExchangeRate(fromCurrency.code, toCurrency.code);
      if (rate) {
        const precision = Math.pow(10, toCurrency.decimalPlaces);
        return items.map(item => {
          const newRate = Math.round(item.rate * rate.rate * precision) / precision;
          const newAmount = Math.round(item.quantity * newRate * precision) / precision;
          return {
            ...item,
            rate: newRate,
            amount: newAmount
          };
        });
      }
    } catch (error) {
      console.warn('Failed to convert currency for line items:', error);
    }
    
    // Return original items if conversion fails or no rate available
    return items;
  }

  const precision = Math.pow(10, toCurrency.decimalPlaces);
  return items.map(item => {
    const newRate = Math.round(item.rate * exchangeRate * precision) / precision;
    const newAmount = Math.round(item.quantity * newRate * precision) / precision;
    return {
      ...item,
      rate: newRate,
      amount: newAmount
    };
  });
};

// Helper function to calculate invoice totals with currency support
const calculateTotals = (state: InvoiceData & { selectedCurrency?: Currency; exchangeRates?: ExchangeRate[] }): InvoiceTotals => {
  const subtotal = state.items.reduce((sum, item) => sum + item.amount, 0);

  // GST Calculation
  // Check if stateCode exists before comparing
  let cgst = 0,
    sgst = 0;
    const igst = 0;

  state.items.forEach((item) => {
    const gstAmount = (item.amount * item.gst) / 100;
    cgst += gstAmount / 2;
    sgst += gstAmount / 2;
  });

  let total = subtotal + cgst + sgst;
  const round_off = Math.round(total) - total;
  total = Math.round(total); 

  // Round amounts to currency precision
  const currency = state.selectedCurrency || DEFAULT_CURRENCY;
  const precision = Math.pow(10, currency.decimalPlaces);
  
  return { 
    subtotal: Math.round(subtotal * precision) / precision,
    cgst: Math.round(cgst * precision) / precision,
    sgst: Math.round(sgst * precision) / precision,
    igst: Math.round(igst * precision) / precision,
    round_off: Math.round(round_off * precision) / precision,
    total: Math.round(total * precision) / precision
  };
};

// Create default totals object
const DEFAULT_TOTALS: InvoiceTotals = {
  subtotal: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  round_off: 0,
  total: 0,
};

const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => {
      // Initial state
      const initialState = {
        business: {
          name: "SHREE GANPATI SANITARY",
          address:
            "Nayi Aabadi Nahri, Raipur Road, Nahri, Teh. Raipur, Bhilwara, Rajasthan 311803",
          phone: "8955555509",
          gstin: "08GWPPB19XXX1ZS",
          email: "sanitaryati@gmail.com",
          company: "",
        },
        client: {
          name: "Vaibhadani",
          company: "Sanitary Sanitary",
          address:
            "SHOP NO O1, Mohan Market, Bigod, Bhira, Rajasthan, 311601",
          phone: "9079245896",
          email: "",
          gstin: "08GEPPB1xx9N1ZS",
        },
        items: [
          {
            id: "1",
            description: "PVC PIPE",
            hsnSac: "3917",
            quantity: 60,
            rate: 220.35,
            per: "NOS",
            gst: 18,
            amount: 13221.0,
          },
        ],
        invoiceNumber: "103",
        invoiceDate: new Date().toISOString().split("T")[0],
        sameGst: true,
        globalGst: 18,
        totals: DEFAULT_TOTALS, // Initialize with default totals

        // Enhanced fields initialization
        selectedCurrency: DEFAULT_CURRENCY,
        exchangeRates: [],
        supportedCurrencies: SUPPORTED_CURRENCIES,
        recurringConfig: null,
        recurringInvoices: [],
        currentInvoice: null,
        savedInvoices: [],
      };

      // Calculate initial totals
      initialState.totals = calculateTotals(initialState);

      return {
        ...initialState,

        // Actions
        setBusiness: (business) =>
          set((state) => {
            const newState = {
              ...state,
              business: { ...state.business, ...business },
            };
            return { ...newState, totals: calculateTotals(newState) };
          }),

        setClient: (client) =>
          set((state) => {
            const newState = {
              ...state,
              client: { ...state.client, ...client },
            };
            return { ...newState, totals: calculateTotals(newState) };
          }),

        setInvoiceNumber: (number) => set({ invoiceNumber: number }),

        setInvoiceDate: (date) => set({ invoiceDate: date }),

        addItem: () =>
          set((state) => {
            const newItem = {
              id: Date.now().toString(),
              description: "",
              hsnSac: "",
              quantity: 1,
              rate: 0,
              per: "NOS",
              gst: state.sameGst ? state.globalGst : 0,
              amount: 0,
            };

            const newItems = [...state.items, newItem];
            const newState = { ...state, items: newItems };
            return { ...newState, totals: calculateTotals(newState) };
          }),

        updateItem: (id, item) =>
          set((state) => {
            const newItems = state.items.map((i) => {
              if (i.id === id) {
                const quantity =
                  item.quantity !== undefined ? item.quantity : i.quantity;
                const rate = item.rate !== undefined ? item.rate : i.rate;
                
                // Round the amount to currency precision
                const currency = state.selectedCurrency;
                const precision = Math.pow(10, currency.decimalPlaces);
                const amount = Math.round(quantity * rate * precision) / precision;
                
                return {
                  ...i,
                  ...item,
                  amount,
                };
              }
              return i;
            });
            const newState = { ...state, items: newItems };
            return { ...newState, totals: calculateTotals(newState) };
          }),

        removeItem: (id) =>
          set((state) => {
            const newItems = state.items.filter((item) => item.id !== id);
            const newState = { ...state, items: newItems };
            return { ...newState, totals: calculateTotals(newState) };
          }),

        setSameGst: (same) =>
          set((state) => {
            // If switching to same GST, apply global GST to all items
            let newItems = state.items;
            if (same) {
              newItems = state.items.map((item) => ({
                ...item,
                gst: state.globalGst,
              }));
            }

            const newState = { ...state, sameGst: same, items: newItems };
            return { ...newState, totals: calculateTotals(newState) };
          }),

        setGlobalGst: (gst) =>
          set((state) => {
            // If same GST is enabled, apply to all items
            let newItems = state.items;
            if (state.sameGst) {
              newItems = state.items.map((item) => ({
                ...item,
                gst,
              }));
            }

            const newState = { ...state, globalGst: gst, items: newItems };
            return { ...newState, totals: calculateTotals(newState) };
          }),

        // Enhanced actions implementation
        setCurrency: async (currency) => {
          const state = get();
          const previousCurrency = state.selectedCurrency;
          
          // If currency hasn't changed, no need to update
          if (previousCurrency.code === currency.code) {
            return;
          }

          try {
            // Convert line item amounts to new currency
            const convertedItems = await convertLineItemAmounts(
              state.items,
              previousCurrency,
              currency,
              state.exchangeRates
            );

            const newState = {
              ...state,
              selectedCurrency: currency,
              items: convertedItems,
            };

            // Update state with converted items and recalculated totals
            set({ 
              ...newState, 
              totals: calculateTotals(newState) 
            });
          } catch (error) {
            console.error('Failed to convert currency:', error);
            // Set new currency but keep original amounts if conversion fails
            set({
              ...state,
              selectedCurrency: currency,
            });
          }
        },

        updateExchangeRates: (rates) =>
          set((state) => ({
            ...state,
            exchangeRates: rates,
          })),

        setRecurringConfig: (config) =>
          set((state) => ({
            ...state,
            recurringConfig: config,
          })),

        saveInvoice: async (invoice) => {
          // This will be implemented when we add database integration
          // For now, just update the saved invoices in state
          set((state) => ({
            ...state,
            savedInvoices: [...state.savedInvoices.filter(i => i.id !== invoice.id), invoice],
            currentInvoice: invoice,
          }));
        },

        loadInvoices: async () => {
          // This will be implemented when we add database integration
          // For now, return the saved invoices from state
          const state = get();
          return state.savedInvoices;
        },

        generateRecurringInvoice: async (templateId) => {
          // This will be implemented when we add recurring invoice logic
          // For now, return a placeholder
          const state = get();
          const template = state.savedInvoices.find(i => i.id === templateId);
          
          if (!template) {
            throw new Error('Template invoice not found');
          }

          // Create a new invoice based on the template
          const newInvoice: EnhancedInvoice = {
            ...template,
            id: Date.now().toString(),
            invoiceNumber: `${template.invoiceNumber}-${Date.now()}`,
            invoiceDate: new Date().toISOString().split("T")[0],
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'draft',
            paymentStatus: 'unpaid',
            paidAt: undefined,
          };

          return newInvoice;
        },
      };
    },
    {
      name: "invoice-store",
      partialize: (state) => ({
        business: state.business,
        client: state.client,
        items: state.items,
        invoiceNumber: state.invoiceNumber,
        invoiceDate: state.invoiceDate,
        sameGst: state.sameGst,
        globalGst: state.globalGst,
        selectedCurrency: state.selectedCurrency,
        exchangeRates: state.exchangeRates,
        recurringConfig: state.recurringConfig,
        savedInvoices: state.savedInvoices,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recalculate totals after rehydration
          state.totals = calculateTotals(state);
        }
      },
    }
  )
);

// Export a hook that uses shallow equality for totals
export const useInvoiceTotals = () => useInvoiceStore((state) => state.totals);

// Export a hook to get safe totals (never undefined)
export const useSafeInvoiceTotals = () => {
  const totals = useInvoiceTotals();
  return totals || DEFAULT_TOTALS;
};

export default useInvoiceStore;

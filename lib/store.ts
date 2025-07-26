// lib/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

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

  // Actions
  setBusiness: (business: Partial<BusinessInfo>) => void;
  setClient: (client: Partial<ClientInfo>) => void;
  setInvoiceNumber: (number: string) => void;
  setInvoiceDate: (date: string) => void;
  addItem: () => void;
  updateItem: (id: string, item: Partial<LineItem>) => void;
  removeItem: (id: string) => void;
  setSameGst: (same: boolean) => void;
  setGlobalGst: (gst: number) => void;
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

// Helper function to calculate invoice totals
const calculateTotals = (state: InvoiceData): InvoiceTotals => {
  const subtotal = state.items.reduce((sum, item) => sum + item.amount, 0);

  // GST Calculation
  // Check if stateCode exists before comparing
  let cgst = 0,
    sgst = 0,
    igst = 0;

  state.items.forEach((item) => {
    const gstAmount = (item.amount * item.gst) / 100;
    cgst += gstAmount / 2;
    sgst += gstAmount / 2;
  });

  // let total = subtotal + cgst + sgst + igst;
  let total = subtotal + cgst + sgst + igst;
  const round_off = Math.round(total) - total;
  total = Math.round(total); 

  return { subtotal, cgst, sgst, igst, round_off, total };
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
                return {
                  ...i,
                  ...item,
                  amount: quantity * rate,
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

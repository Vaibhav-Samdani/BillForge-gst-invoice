import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ToWords } from "to-words";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: number, currencyCode: string = "INR") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Add numberToWords implementation here or use a library
export const numberToWords = (num: number, currencyCode: string = "INR"): string => {
  // Currency-specific configurations
  const currencyConfigs: Record<string, any> = {
    INR: {
      localeCode: "en-IN",
      currencyOptions: {
        name: "Rupee",
        plural: "Rupees",
        symbol: "₹",
        fractionalUnit: { name: "Paisa", plural: "Paise", symbol: "" },
      },
    },
    USD: {
      localeCode: "en-US",
      currencyOptions: {
        name: "Dollar",
        plural: "Dollars",
        symbol: "$",
        fractionalUnit: { name: "Cent", plural: "Cents", symbol: "" },
      },
    },
    EUR: {
      localeCode: "en-US",
      currencyOptions: {
        name: "Euro",
        plural: "Euros",
        symbol: "€",
        fractionalUnit: { name: "Cent", plural: "Cents", symbol: "" },
      },
    },
    GBP: {
      localeCode: "en-GB",
      currencyOptions: {
        name: "Pound",
        plural: "Pounds",
        symbol: "£",
        fractionalUnit: { name: "Penny", plural: "Pence", symbol: "" },
      },
    },
  };

  const config = currencyConfigs[currencyCode] || currencyConfigs.USD;
  
  const toWords = new ToWords({
    localeCode: config.localeCode,
    converterOptions: {
      currency: true,
      ignoreDecimal: false,
      doNotAddOnly: false,
      currencyOptions: config.currencyOptions,
    },
  });

  return toWords.convert(num);
};

// Memoized currency formatter with currency support
const memoizedFormatter = () => {
  const cache = new Map<string, string>();

  return (value: number, currencyCode: string = "INR") => {
    const cacheKey = `${value}-${currencyCode}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey)!;

    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(value);

    cache.set(cacheKey, formatted);
    return formatted;
  };
};

export const memoizedFormatCurrency = memoizedFormatter();

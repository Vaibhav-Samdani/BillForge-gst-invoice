import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ToWords } from "to-words";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
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
export const numberToWords = (num: number): string => {
  const toWords = new ToWords({
    localeCode: "en-IN",
    converterOptions: {
      currency: true,
      ignoreDecimal: false,
      doNotAddOnly: false,
      currencyOptions: {
        name: "Rupee",
        plural: "Rupees",
        symbol: "₹",
        fractionalUnit: { name: "Paisa", plural: "Paise", symbol: "" },
      },
    },
  });

  // Implementation would go here
  return toWords.convert(num);
};

// Memoized currency formatter
const memoizedFormatter = () => {
  const cache = new Map<number, string>();

  return (value: number) => {
    if (cache.has(value)) return cache.get(value)!;

    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

    cache.set(value, formatted);
    return formatted;
  };
};

export const memoizedFormatCurrency = memoizedFormatter();

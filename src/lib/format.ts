/** Format a number as Nigerian naira, e.g. 12500 -> "₦12,500". */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

/** Format a price with unit, e.g. "₦1,500 / kg". */
export function formatPriceUnit(price: number, unit: string): string {
  return `${formatNaira(price)} / ${unit}`;
}

/** Format a creation timestamp as a short readable date. */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format timestamp with time, for order receipts. */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ORDER_STATUS_META: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-100 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmed",
    className:
      "bg-sky-100 text-sky-800 border-sky-200",
    dot: "bg-sky-500",
  },
  processing: {
    label: "Processing",
    className:
      "bg-violet-100 text-violet-800 border-violet-200",
    dot: "bg-violet-500",
  },
  completed: {
    label: "Completed",
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-rose-100 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
};

export const PRODUCT_STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  available: {
    label: "Available",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  unavailable: {
    label: "Unavailable",
    className: "bg-stone-200 text-stone-600 border-stone-300",
  },
};

"use client";

import React from "react";
import { useCurrency } from "@/context/CurrencyContext";

interface XlmAmountProps {
  xlm: number;
  /** Pass null to skip fiat conversion regardless of user preference */
  price?: number | null;
  className?: string;
}

/**
 * Renders an XLM amount with an optional fiat equivalent based on the user's
 * selected currency. Hovering shows the original XLM value.
 */
export function XlmAmount({ xlm, className }: XlmAmountProps) {
  const { formatFiat } = useCurrency();

  const xlmStr = `${xlm.toLocaleString(undefined, { maximumFractionDigits: 7 })} XLM`;
  const fiatStr = formatFiat(xlm);

  if (!fiatStr) {
    return <span className={className}>{xlmStr}</span>;
  }

  return (
    <span className={className} title={xlmStr}>
      {fiatStr}{" "}
      <span className="text-gray-500 dark:text-gray-400 font-normal text-[0.85em]">
        ({xlmStr})
      </span>
    </span>
  );
}

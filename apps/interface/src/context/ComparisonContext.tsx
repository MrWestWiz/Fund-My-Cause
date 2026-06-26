"use client";

import React, { createContext, useContext, useState } from "react";

interface ComparisonContextType {
  selected: string[];
  toggle: (id: string) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  hydrate: (ids: string[]) => void;
}

const ComparisonContext = createContext<ComparisonContextType | null>(null);

export function ComparisonProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const clear = () => setSelected([]);
  const isSelected = (id: string) => selected.includes(id);

  /** Hydrate selection from URL; silently drops invalid/unknown IDs */
  const hydrate = (ids: string[]) => {
    const valid = ids
      .filter((id) => typeof id === "string" && id.trim() !== "")
      .slice(0, 4);
    setSelected(valid);
  };

  return (
    <ComparisonContext.Provider
      value={{ selected, toggle, clear, isSelected, hydrate }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const ctx = useContext(ComparisonContext);
  if (!ctx)
    throw new Error("useComparison must be used within ComparisonProvider");
  return ctx;
}

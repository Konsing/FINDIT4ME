"use client";

import { useState, useMemo, useCallback } from "react";
import { Product } from "./types";

export function useSearch(initialProducts: Product[]) {
  const [filterQuery, setFilterQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return initialProducts;
    return initialProducts.filter((p) =>
      p.name.toLowerCase().includes(q)
    );
  }, [initialProducts, filterQuery]);

  const handleSearch = useCallback((query: string) => {
    setFilterQuery(query);
  }, []);

  return {
    products: filteredProducts,
    filterQuery,
    isLoading: false,
    error: null,
    handleSearch,
  };
}

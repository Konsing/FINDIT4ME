"use client";

import { useState, useRef, useCallback } from "react";
import { Product } from "./types";

export function useSearch(initialProducts: Product[]) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [brandName, setBrandName] = useState("Dispatch (2025)");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(
    async (query: string) => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Empty query = reset to defaults
      if (!query.trim()) {
        setProducts(initialProducts);
        setBrandName("Dispatch (2025)");
        setError(null);
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/products?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await res.json();
        setProducts(data.products);
        setBrandName(query.trim());
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "Unable to fetch products. Please try again."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [initialProducts]
  );

  return { products, brandName, isLoading, error, handleSearch };
}

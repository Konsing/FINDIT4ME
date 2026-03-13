"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import BrandBar from "@/components/BrandBar";
import ProductGrid from "@/components/ProductGrid";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import Footer from "@/components/Footer";
import AboutModal from "@/components/AboutModal";
import { useSearch } from "@/lib/useSearch";
import defaultProducts from "@/data/dispatch.json";
import { Product } from "@/lib/types";

export default function Home() {
  const { products, brandName, isLoading, error, handleSearch } = useSearch(
    defaultProducts as Product[]
  );
  const [aboutOpen, setAboutOpen] = useState(false);

  const handleRetry = useCallback(() => {
    if (brandName !== "Dispatch (2025)") {
      handleSearch(brandName);
    }
  }, [brandName, handleSearch]);

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header
        onSearch={handleSearch}
        onAboutClick={() => setAboutOpen(true)}
      />
      <BrandBar
        brandName={brandName}
        productCount={products.length}
        isLoading={isLoading}
      />
      {error && products.length === 0 ? (
        <ErrorState message={error} onRetry={handleRetry} />
      ) : isLoading ? (
        <LoadingState />
      ) : (
        <ProductGrid products={products} />
      )}
      {error && products.length > 0 && (
        <div className="px-6 py-2">
          <p className="text-xs text-red-400/70 text-center">{error}</p>
        </div>
      )}
      <Footer />
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}

"use client";

import { useState } from "react";
import Header from "@/components/Header";
import BrandBar from "@/components/BrandBar";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import AboutModal from "@/components/AboutModal";
import { useSearch } from "@/lib/useSearch";
import defaultProducts from "@/data/dispatch.json";
import { Product } from "@/lib/types";

export default function Home() {
  const { products, filterQuery, handleSearch } = useSearch(
    defaultProducts as Product[]
  );
  const [aboutOpen, setAboutOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleLogoClick = () => {
    handleSearch("");
    setResetKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header
        onSearch={handleSearch}
        onAboutClick={() => setAboutOpen(true)}
        onLogoClick={handleLogoClick}
        resetKey={resetKey}
      />
      <BrandBar
        brandName="Dispatch (2025)"
        productCount={products.length}
        isLoading={false}
        filterQuery={filterQuery}
      />
      <ProductGrid products={products} />
      <Footer />
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}

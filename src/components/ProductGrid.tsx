import { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import type { SortOption } from "./SortDropdown";

interface ProductGridProps {
  products: Product[];
  sortOption: SortOption;
}

export default function ProductGrid({ products, sortOption }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <p className="text-[#555] text-sm">
          No products found. Try a different search.
        </p>
      </div>
    );
  }

  const sorted = [...products].sort((a, b) => {
    switch (sortOption) {
      case "price-asc": {
        const priceA = a.price ?? Infinity;
        const priceB = b.price ?? Infinity;
        return priceA - priceB;
      }
      case "price-desc": {
        const priceA = a.price ?? -Infinity;
        const priceB = b.price ?? -Infinity;
        return priceB - priceA;
      }
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      default: {
        // Shopify (official store) first, in-stock, then price ascending
        const aShopify = a.id.startsWith("shopify-") ? 0 : 1;
        const bShopify = b.id.startsWith("shopify-") ? 0 : 1;
        if (aShopify !== bShopify) return aShopify - bShopify;
        if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
        const priceA = a.price ?? Infinity;
        const priceB = b.price ?? Infinity;
        return priceA - priceB;
      }
    }
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5 px-6 lg:px-16 xl:px-24 py-2 flex-1">
      {sorted.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

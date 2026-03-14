"use client";

import { useState } from "react";
import { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  const priceDisplay =
    product.price !== null
      ? `$${product.price.toFixed(2)} ${product.currency}`
      : "Price unavailable";

  return (
    <a
      href={product.productUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block cursor-pointer"
    >
      <div className="relative bg-[#1a1a1a] aspect-square overflow-hidden">
        {imgError || !product.imageUrl ? (
          <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
            <span className="text-4xl font-bold text-[#333]">
              {product.name.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        )}
        {!product.inStock && (
          <div className="absolute top-2 right-2 bg-[#c8c8c8] text-black text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm">
            Sold out
          </div>
        )}
      </div>
      <div className="px-1 py-2.5">
        <div className="text-sm font-semibold text-white">
          {product.name}
        </div>
        <div className="text-xs mt-1 text-[#aaa]">
          {priceDisplay}
        </div>
        <div className="text-[10px] mt-0.5 text-[#555]">
          {product.source}
        </div>
      </div>
    </a>
  );
}

import type { Product, ScrapeResult } from "@/lib/types";
import { scrapeShopify } from "@/lib/scrapers/shopify";
import { scrapeEbay } from "@/lib/scrapers/ebay";
import { scrapeSerpApi } from "@/lib/scrapers/google";

export async function scrapeAll(query: string): Promise<Product[]> {
  const results = await Promise.allSettled<ScrapeResult>([
    scrapeShopify(query),
    scrapeEbay(query),
    scrapeSerpApi(query),
  ]);

  const allProducts: Product[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      allProducts.push(...result.value.products);
    }
  }

  // Deduplicate by productUrl
  const seen = new Set<string>();
  const unique = allProducts.filter((p) => {
    if (seen.has(p.productUrl)) return false;
    seen.add(p.productUrl);
    return true;
  });

  // Sort: in-stock first, then by price ascending (null prices last)
  unique.sort((a, b) => {
    // In-stock items first
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;

    // Then by price ascending, null prices last
    if (a.price === null && b.price === null) return 0;
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return a.price - b.price;
  });

  return unique;
}

import type { Product, ScrapeResult } from "@/lib/types";

interface ShopifyVariant {
  id: number;
  price: string;
  available: boolean;
}

interface ShopifyImage {
  src: string;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

export async function scrapeShopify(query: string): Promise<ScrapeResult> {
  const stores = (process.env.SHOPIFY_STORES ?? "store.adhocla.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allProducts: Product[] = [];

  for (const store of stores) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(
        `https://${store}/products.json?limit=250`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = (await res.json()) as { products: ShopifyProduct[] };
      const lowerQuery = query.toLowerCase();

      const matched = data.products.filter((p) =>
        p.title.toLowerCase().includes(lowerQuery)
      );

      for (const p of matched) {
        allProducts.push({
          id: `shopify-${p.id}`,
          name: p.title,
          price: p.variants.length > 0 ? parseFloat(p.variants[0].price) : null,
          currency: "USD",
          imageUrl: p.images[0]?.src ?? "",
          productUrl: `https://${store}/products/${p.handle}`,
          source: store,
          inStock: p.variants.some((v) => v.available),
          scrapedAt: new Date().toISOString(),
        });
      }
    } catch {
      // Continue to next store on failure
    }
  }

  return { products: allProducts, source: "shopify" };
}

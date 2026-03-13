import fs from "fs";
import path from "path";

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

interface Product {
  id: string;
  name: string;
  price: number | null;
  currency: string;
  imageUrl: string;
  productUrl: string;
  source: string;
  inStock: boolean;
  scrapedAt: string;
}

async function main() {
  const store = "store.adhocla.com";
  console.log(`Fetching products from ${store}...`);

  const res = await fetch(`https://${store}/products.json?limit=250`);
  if (!res.ok) {
    console.error(`Failed to fetch: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const data = (await res.json()) as { products: ShopifyProduct[] };
  const now = new Date().toISOString();

  const products: Product[] = data.products.map((p) => ({
    id: `shopify-${p.id}`,
    name: p.title,
    price: p.variants.length > 0 ? parseFloat(p.variants[0].price) : null,
    currency: "USD",
    imageUrl: p.images[0]?.src ?? "",
    productUrl: `https://${store}/products/${p.handle}`,
    source: store,
    inStock: p.variants.some((v) => v.available),
    scrapedAt: now,
  }));

  // Sort: in-stock first, then by price ascending
  products.sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    const priceA = a.price ?? Infinity;
    const priceB = b.price ?? Infinity;
    return priceA - priceB;
  });

  const outPath = path.join(__dirname, "..", "src", "data", "dispatch.json");
  fs.writeFileSync(outPath, JSON.stringify(products, null, 2) + "\n");

  console.log(`Wrote ${products.length} products to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

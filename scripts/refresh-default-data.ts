import fs from "fs";
import path from "path";

// ── Types ──────────────────────────────────────────────

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

// ── Shopify types ──────────────────────────────────────

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

// ── Google CSE types ───────────────────────────────────

interface GooglePagemap {
  offer?: Array<{ price?: string }>;
  product?: Array<{ price?: string }>;
  cse_image?: Array<{ src?: string }>;
}

interface GoogleSearchItem {
  title: string;
  link: string;
  pagemap?: GooglePagemap;
}

interface GoogleSearchResponse {
  items?: GoogleSearchItem[];
  error?: { code: number; message: string };
}

// ── eBay types ─────────────────────────────────────────

interface EbayItemSummary {
  itemId: string;
  title: string;
  price: { value: string; currency: string };
  image: { imageUrl: string };
  itemWebUrl: string;
}

interface EbaySearchResponse {
  itemSummaries?: EbayItemSummary[];
}

// ── Helpers ────────────────────────────────────────────

const EXCLUDED_DOMAINS = [
  "wikipedia.org",
  "reddit.com",
  "youtube.com",
  "twitter.com",
  "facebook.com",
  "instagram.com",
];

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function cleanTitle(title: string): string {
  return title.replace(/\s*[-|]\s*[^-|]+$/, "").trim();
}

// ── Shopify scraper ────────────────────────────────────

async function scrapeShopify(): Promise<Product[]> {
  const store = "store.adhocla.com";
  console.log(`  Shopify: fetching from ${store}...`);

  const res = await fetch(`https://${store}/products.json?limit=250`);
  if (!res.ok) {
    console.error(`  Shopify: failed ${res.status} ${res.statusText}`);
    return [];
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

  console.log(`  Shopify: found ${products.length} products`);
  return products;
}

// ── Google CSE scraper ─────────────────────────────────

async function scrapeGoogle(query: string): Promise<Product[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    console.log("  Google CSE: skipping (no credentials)");
    return [];
  }

  console.log(`  Google CSE: searching for "${query}"...`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const searchQuery = encodeURIComponent(`${query} merchandise buy`);
    const url = `https://customsearch.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${searchQuery}&num=10`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.status === 429) {
      console.warn("  Google CSE: quota exceeded (429)");
      return [];
    }

    if (!res.ok) {
      const body = await res.text();
      console.error(`  Google CSE: API returned ${res.status}: ${body}`);
      return [];
    }

    const data = (await res.json()) as GoogleSearchResponse;

    if (data.error) {
      console.error(`  Google CSE: API error ${data.error.code}: ${data.error.message}`);
      return [];
    }

    const items = data.items ?? [];
    const now = new Date().toISOString();

    const products: Product[] = items
      .filter((item) => {
        const hostname = getHostname(item.link);
        return !EXCLUDED_DOMAINS.some((d) => hostname.endsWith(d));
      })
      .filter((item) => {
        // Must have an image to be useful
        return item.pagemap?.cse_image?.[0]?.src;
      })
      .map((item, index) => ({
        id: `google-${index}-${Date.now()}`,
        name: cleanTitle(item.title),
        price:
          (() => {
            const raw =
              item.pagemap?.offer?.[0]?.price ??
              item.pagemap?.product?.[0]?.price ??
              null;
            if (raw == null) return null;
            const parsed = parseFloat(raw);
            return isNaN(parsed) ? null : parsed;
          })(),
        currency: "USD",
        imageUrl: item.pagemap?.cse_image?.[0]?.src ?? "",
        productUrl: item.link,
        source: getHostname(item.link),
        inStock: true,
        scrapedAt: now,
      }));

    console.log(`  Google CSE: found ${products.length} products`);
    return products;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  Google CSE: error — ${message}`);
    return [];
  }
}

// ── eBay scraper ───────────────────────────────────────

async function scrapeEbay(query: string): Promise<Product[]> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log("  eBay: skipping (no credentials)");
    return [];
  }

  console.log(`  eBay: searching for "${query}"...`);

  try {
    // Get OAuth token
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const tokenRes = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
    });

    if (!tokenRes.ok) {
      console.error(`  eBay: token request failed ${tokenRes.status}`);
      return [];
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };
    const token = tokenData.access_token;

    // Search
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const searchQuery = encodeURIComponent(`${query} merchandise`);
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${searchQuery}&limit=20&filter=buyingOptions:{FIXED_PRICE}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`  eBay: search failed ${res.status}`);
      return [];
    }

    const data = (await res.json()) as EbaySearchResponse;
    const items = data.itemSummaries ?? [];
    const now = new Date().toISOString();

    const products: Product[] = items.map((item) => ({
      id: `ebay-${item.itemId}`,
      name: item.title,
      price: parseFloat(item.price.value),
      currency: item.price.currency ?? "USD",
      imageUrl: item.image?.imageUrl ?? "",
      productUrl: item.itemWebUrl,
      source: "ebay.com",
      inStock: true,
      scrapedAt: now,
    }));

    console.log(`  eBay: found ${products.length} products`);
    return products;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  eBay: error — ${message}`);
    return [];
  }
}

// ── Main ───────────────────────────────────────────────

async function main() {
  console.log("Refreshing default product data...\n");

  // Run all scrapers in parallel
  const [shopifyProducts, googleProducts, ebayProducts] = await Promise.all([
    scrapeShopify(),
    scrapeGoogle("dispatch adhoc studio"),
    scrapeEbay("dispatch adhoc studio game"),
  ]);

  // Merge all products
  const allProducts = [...shopifyProducts, ...googleProducts, ...ebayProducts];

  // Deduplicate by productUrl
  const seen = new Set<string>();
  const unique = allProducts.filter((p) => {
    if (seen.has(p.productUrl)) return false;
    seen.add(p.productUrl);
    return true;
  });

  // Sort: in-stock first, then by price ascending (null last)
  unique.sort((a, b) => {
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    const priceA = a.price ?? Infinity;
    const priceB = b.price ?? Infinity;
    return priceA - priceB;
  });

  const outPath = path.join(__dirname, "..", "src", "data", "dispatch.json");
  fs.writeFileSync(outPath, JSON.stringify(unique, null, 2) + "\n");

  console.log(`\nWrote ${unique.length} total products to dispatch.json`);
  console.log(`  Shopify: ${shopifyProducts.length}`);
  console.log(`  Google CSE: ${googleProducts.length}`);
  console.log(`  eBay: ${ebayProducts.length}`);
  console.log(`  After dedup: ${unique.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

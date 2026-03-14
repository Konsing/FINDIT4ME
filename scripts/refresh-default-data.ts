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

// ── SerpAPI types ──────────────────────────────────────

interface SerpApiShoppingResult {
  title: string;
  product_id?: string;
  product_link: string;
  source: string;
  price?: string;
  extracted_price?: number;
  thumbnail?: string;
}

interface SerpApiResponse {
  shopping_results?: SerpApiShoppingResult[];
  error?: string;
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

// Filter out products related to 911/emergency dispatch, not the game
const EXCLUDED_KEYWORDS = [
  "bingo",
  "icebreaker",
  "911",
  "dispatcher",
  "comm center",
  "radio strap",
  "thin gold line",
];

function isExcludedProduct(name: string): boolean {
  const lower = name.toLowerCase();
  return EXCLUDED_KEYWORDS.some((kw) => lower.includes(kw));
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
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

// ── SerpAPI scraper ────────────────────────────────────

async function scrapeSerpApi(query: string, pages: number = 4): Promise<Product[]> {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    console.log("  SerpAPI: skipping (no credentials)");
    return [];
  }

  console.log(`  SerpAPI: searching for "${query}" (${pages} pages)...`);

  const allProducts: Product[] = [];

  for (let page = 0; page < pages; page++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);

      const searchQuery = encodeURIComponent(query);
      const start = page * 20;
      const url = `https://serpapi.com/search.json?engine=google_shopping&q=${searchQuery}&api_key=${apiKey}&num=20&start=${start}`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        const body = await res.text();
        console.error(`  SerpAPI: page ${page + 1} returned ${res.status}: ${body}`);
        break;
      }

      const data = (await res.json()) as SerpApiResponse;

      if (data.error) {
        console.error(`  SerpAPI: page ${page + 1} error — ${data.error}`);
        break;
      }

      const items = data.shopping_results ?? [];
      if (items.length === 0) {
        console.log(`  SerpAPI: page ${page + 1} — no more results`);
        break;
      }

      const now = new Date().toISOString();

      const products: Product[] = items
        .filter((item) => {
          const hostname = getHostname(item.product_link);
          return !EXCLUDED_DOMAINS.some((d) => hostname.endsWith(d));
        })
        .filter((item) => item.thumbnail)
        .filter((item) => !isExcludedProduct(item.title))
        .map((item) => ({
          id: `serp-${item.product_id ?? item.title}`,
          name: item.title,
          price: item.extracted_price ?? null,
          currency: "USD",
          imageUrl: item.thumbnail ?? "",
          productUrl: item.product_link,
          source: item.source ?? getHostname(item.product_link),
          inStock: true,
          scrapedAt: now,
        }));

      allProducts.push(...products);
      console.log(`  SerpAPI: page ${page + 1} — ${products.length} products`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  SerpAPI: page ${page + 1} error — ${message}`);
      break;
    }
  }

  console.log(`  SerpAPI: total for "${query}" — ${allProducts.length} products`);
  return allProducts;
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

    const searchQuery = encodeURIComponent(query);
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${searchQuery}&limit=50&filter=buyingOptions:{FIXED_PRICE}`;

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

  // 5 SerpAPI queries × 1 page = 5 searches/day = ~150/month (within 250 free limit)
  // Extra pages are wasteful — Google Shopping repeats the same ~40 products across pages
  const [shopifyProducts, serp1, serp2, serp3, serp4, serp5, ebay1, ebay2, ebay3, ebay4] = await Promise.all([
    scrapeShopify(),
    scrapeSerpApi("Dispatch Game Merch", 1),
    scrapeSerpApi("Dispatch Game Displate", 1),
    scrapeSerpApi("Dispatch Game Etsy", 1),
    scrapeSerpApi("Dispatch Adhoc Studio Merch", 1),
    scrapeSerpApi("Dispatch Game Redbubble", 1),
    scrapeEbay("dispatch adhoc"),
    scrapeEbay("Dispatch clothing game"),
    scrapeEbay("Dispatch SDN"),
    scrapeEbay("Dispatch video game 2025 merch"),
  ]);

  // Merge all products
  const ebayProducts = [...ebay1, ...ebay2, ...ebay3, ...ebay4];
  const allProducts = [...shopifyProducts, ...serp1, ...serp2, ...serp3, ...serp4, ...serp5, ...ebayProducts];

  // Deduplicate by product id (catches same product across queries/pages)
  const seen = new Set<string>();
  const unique = allProducts.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  // Sort: Shopify first, then in-stock, then by price ascending (null last)
  unique.sort((a, b) => {
    const aShopify = a.id.startsWith("shopify-") ? 0 : 1;
    const bShopify = b.id.startsWith("shopify-") ? 0 : 1;
    if (aShopify !== bShopify) return aShopify - bShopify;
    if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
    const priceA = a.price ?? Infinity;
    const priceB = b.price ?? Infinity;
    return priceA - priceB;
  });

  const outPath = path.join(__dirname, "..", "src", "data", "dispatch.json");
  fs.writeFileSync(outPath, JSON.stringify(unique, null, 2) + "\n");

  console.log(`\nWrote ${unique.length} total products to dispatch.json`);
  console.log(`  Shopify: ${shopifyProducts.length}`);
  console.log(`  SerpAPI: ${serp1.length + serp2.length + serp3.length + serp4.length + serp5.length}`);
  console.log(`  eBay: ${ebay1.length + ebay2.length + ebay3.length + ebay4.length}`);
  console.log(`  After dedup: ${unique.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

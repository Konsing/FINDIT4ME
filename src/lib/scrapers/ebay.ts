import type { Product, ScrapeResult } from "@/lib/types";

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getEbayToken(): Promise<string | null> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) return null;

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000 - 60_000; // refresh 1 min early

  return cachedToken;
}

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

export async function scrapeEbay(query: string): Promise<ScrapeResult> {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { products: [], source: "ebay" };
  }

  try {
    const token = await getEbayToken();
    if (!token) {
      return { products: [], source: "ebay" };
    }

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
      return { products: [], source: "ebay", error: `eBay API returned ${res.status}` };
    }

    const data = (await res.json()) as EbaySearchResponse;
    const items = data.itemSummaries ?? [];

    const products: Product[] = items.map((item) => ({
      id: `ebay-${item.itemId}`,
      name: item.title,
      price: parseFloat(item.price.value),
      currency: item.price.currency ?? "USD",
      imageUrl: item.image?.imageUrl ?? "",
      productUrl: item.itemWebUrl,
      source: "ebay.com",
      inStock: true,
      scrapedAt: new Date().toISOString(),
    }));

    return { products, source: "ebay" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { products: [], source: "ebay", error: message };
  }
}

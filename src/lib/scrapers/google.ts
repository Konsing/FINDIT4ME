import type { Product, ScrapeResult } from "@/lib/types";

const EXCLUDED_DOMAINS = [
  "wikipedia.org",
  "reddit.com",
  "youtube.com",
  "twitter.com",
  "facebook.com",
  "instagram.com",
];

interface SerpApiShoppingResult {
  title: string;
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

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function isExcludedDomain(url: string): boolean {
  const hostname = getHostname(url);
  return EXCLUDED_DOMAINS.some((domain) => hostname.endsWith(domain));
}

export async function scrapeSerpApi(query: string): Promise<ScrapeResult> {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    return { products: [], source: "serpapi" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const searchQuery = encodeURIComponent(`${query} merchandise`);
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${searchQuery}&api_key=${apiKey}&num=20`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      return { products: [], source: "serpapi", error: `SerpAPI returned ${res.status}` };
    }

    const data = (await res.json()) as SerpApiResponse;

    if (data.error) {
      return { products: [], source: "serpapi", error: data.error };
    }

    const items = data.shopping_results ?? [];
    const now = new Date().toISOString();

    const products: Product[] = items
      .filter((item) => !isExcludedDomain(item.product_link))
      .filter((item) => item.thumbnail)
      .map((item, index) => ({
        id: `serp-${index}-${Date.now()}`,
        name: item.title,
        price: item.extracted_price ?? null,
        currency: "USD",
        imageUrl: item.thumbnail ?? "",
        productUrl: item.product_link,
        source: item.source ?? getHostname(item.product_link),
        inStock: true,
        scrapedAt: now,
      }));

    return { products, source: "serpapi" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { products: [], source: "serpapi", error: message };
  }
}

import type { Product, ScrapeResult } from "@/lib/types";

const EXCLUDED_DOMAINS = [
  "wikipedia.org",
  "reddit.com",
  "youtube.com",
  "twitter.com",
  "facebook.com",
  "instagram.com",
];

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
}

function extractPrice(pagemap?: GooglePagemap): number | null {
  const raw =
    pagemap?.offer?.[0]?.price ??
    pagemap?.product?.[0]?.price ??
    null;

  if (raw == null) return null;

  const parsed = parseFloat(raw);
  return isNaN(parsed) ? null : parsed;
}

function cleanTitle(title: string): string {
  // Remove common site name suffixes like " - Amazon.com", " | eBay", etc.
  return title.replace(/\s*[-|]\s*[^-|]+$/, "").trim();
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

export async function scrapeGoogle(query: string): Promise<ScrapeResult> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    return { products: [], source: "google" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const searchQuery = encodeURIComponent(`${query} merchandise buy`);
    const url = `https://customsearch.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${searchQuery}&num=10`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.status === 429) {
      return { products: [], source: "google", error: "Google API quota exceeded" };
    }

    if (!res.ok) {
      return { products: [], source: "google", error: `Google API returned ${res.status}` };
    }

    const data = (await res.json()) as GoogleSearchResponse;
    const items = data.items ?? [];

    const products: Product[] = items
      .filter((item) => !isExcludedDomain(item.link))
      .map((item, index) => ({
        id: `google-${index}-${Date.now()}`,
        name: cleanTitle(item.title),
        price: extractPrice(item.pagemap),
        currency: "USD",
        imageUrl: item.pagemap?.cse_image?.[0]?.src ?? "",
        productUrl: item.link,
        source: getHostname(item.link),
        inStock: true,
        scrapedAt: new Date().toISOString(),
      }));

    return { products, source: "google" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { products: [], source: "google", error: message };
  }
}

export interface Product {
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

export interface ScrapeResult {
  products: Product[];
  source: string;
  error?: string;
}

export interface CachedData {
  products: Product[];
  cachedAt: string;
  query: string;
}

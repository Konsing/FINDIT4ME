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

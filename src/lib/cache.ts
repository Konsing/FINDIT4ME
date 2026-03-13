import { Redis } from "@upstash/redis";
import type { Product } from "@/lib/types";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  return new Redis({ url, token });
}

function normalizeKey(query: string): string {
  return `products:${query.toLowerCase().trim()}`;
}

export async function getCachedProducts(query: string): Promise<Product[] | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;

    const key = normalizeKey(query);
    const cached = await redis.get<Product[]>(key);

    return cached ?? null;
  } catch {
    return null;
  }
}

export async function setCachedProducts(query: string, products: Product[]): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;

    const key = normalizeKey(query);
    await redis.set(key, products, { ex: 86400 });
  } catch {
    // Silently fail — caching is best-effort
  }
}

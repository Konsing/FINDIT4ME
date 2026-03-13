import { NextRequest, NextResponse } from "next/server";
import { scrapeAll } from "@/lib/scrapers";
import { getCachedProducts, setCachedProducts } from "@/lib/cache";
import dispatchProducts from "@/data/dispatch.json";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  // Serve dispatch.json directly when no query or "dispatch"
  if (!query || query.toLowerCase() === "dispatch") {
    return NextResponse.json({
      products: dispatchProducts,
      query: query || "dispatch",
      count: dispatchProducts.length,
    });
  }

  // Try cache first
  try {
    const cached = await getCachedProducts(query);
    if (cached) {
      return NextResponse.json({
        products: cached,
        query,
        count: cached.length,
        cached: true,
      });
    }
  } catch {
    // Redis failure — continue to scrape
  }

  // Cache miss — scrape fresh data
  const products = await scrapeAll(query);

  // Cache in the background (don't block the response)
  setCachedProducts(query, products).catch(() => {
    // Silently ignore cache write failures
  });

  return NextResponse.json({
    products,
    query,
    count: products.length,
    cached: false,
  });
}

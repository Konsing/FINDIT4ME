import { NextRequest, NextResponse } from "next/server";
import { scrapeAll } from "@/lib/scrapers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2 || query.length > 100) {
    return NextResponse.json(
      { error: "Query must be between 2 and 100 characters" },
      { status: 400 }
    );
  }

  const products = await scrapeAll(query);

  return NextResponse.json({
    products,
    query,
    count: products.length,
  });
}

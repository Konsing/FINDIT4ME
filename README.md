# FINDIT4ME

A product aggregator that finds merchandise for any brand or franchise across multiple online retailers. Search for a brand, see what's available, and click to buy directly from the store.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-blue)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black)

## Features

- **Multi-retailer search** — Aggregates products from Shopify stores, eBay, and Google Shopping results
- **Default collection** — Pre-loaded with Dispatch (2025 video game) merchandise from AdHoc Studio
- **On-demand scraping** — Type any brand in the search bar to find its merch across the web
- **Direct purchase links** — Every product links straight to the retailer's page
- **Stock status** — "Sold Out" badges on unavailable items with dimmed styling
- **Responsive grid** — 4 columns on desktop, 3 on tablet, 2 on mobile
- **Smart caching** — Search results cached for 24 hours to stay fast and within API limits
- **Daily refresh** — GitHub Action updates the default product data every day
- **Graceful degradation** — Works with zero API keys (serves default data), progressively better with each key added

## Tech Stack

- **Framework**: Next.js (App Router) with TypeScript
- **Styling**: Tailwind CSS v4
- **Hosting**: Vercel (free tier)
- **Caching**: Upstash Redis
- **Scraping**: Shopify `/products.json`, eBay Browse API, Google Custom Search API

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone https://github.com/Konsing/FINDIT4ME.git
cd FINDIT4ME
npm install
```

### Environment Variables

Copy the example env file and fill in any keys you have:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis URL for caching |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis token |
| `EBAY_CLIENT_ID` | No | eBay developer app ID |
| `EBAY_CLIENT_SECRET` | No | eBay developer cert ID |
| `GOOGLE_API_KEY` | No | Google Cloud API key |
| `GOOGLE_SEARCH_ENGINE_ID` | No | Google Custom Search engine ID |
| `SHOPIFY_STORES` | No | Comma-separated Shopify store domains (default: `store.adhocla.com`) |

> **None of the keys are required to run the app.** Without them, the site serves the pre-loaded Dispatch products. Each key you add enables an additional scraping source.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (dark theme, fonts, metadata)
│   ├── page.tsx                # Main page (search state, component assembly)
│   ├── globals.css             # Tailwind imports
│   └── api/
│       ├── products/route.ts   # Product API (cache-first, fallback to scrape)
│       └── scrape/route.ts     # Raw scraping endpoint
├── components/
│   ├── Header.tsx              # Logo + search bar + about link
│   ├── SearchBar.tsx           # Debounced search input
│   ├── BrandBar.tsx            # Current brand name + product count
│   ├── ProductGrid.tsx         # Responsive grid with sorting
│   ├── ProductCard.tsx         # Product display with stock status
│   ├── LoadingState.tsx        # Skeleton loading cards
│   ├── ErrorState.tsx          # Error display with retry
│   ├── Footer.tsx              # Disclaimer + credit
│   └── AboutModal.tsx          # About dialog
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   ├── cache.ts                # Upstash Redis cache helpers
│   ├── useSearch.ts            # Search state management hook
│   └── scrapers/
│       ├── shopify.ts          # Shopify store scraper
│       ├── ebay.ts             # eBay Browse API client
│       ├── google.ts           # Google Custom Search client
│       └── index.ts            # Parallel scraper orchestrator
└── data/
    └── dispatch.json           # Pre-scraped default products
```

## API

### `GET /api/products?q=<query>`

Returns products for a query. Serves cached results when available.

- No query or `q=dispatch` → returns pre-loaded Dispatch products
- Any other query → checks cache → scrapes if miss → caches for 24h

### `GET /api/scrape?q=<query>`

Raw scraping endpoint. Always scrapes fresh (no cache). Query must be 2-100 characters.

## Data Sources

| Source | Method | Free Tier |
|--------|--------|-----------|
| Shopify stores | `/products.json` endpoint | Unlimited |
| eBay | Browse API (OAuth) | No explicit limit |
| Google | Custom Search API | 100 queries/day |

## License

MIT

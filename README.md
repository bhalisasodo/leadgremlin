# LeadGremlin - AI Outbound Lead Engine (MVP)

Production-ready, modular outbound lead generation engine built for discovering local businesses, enriching data, scoring website opportunities, and exporting leads.

---

## Features

- **Google Maps Scraper (Playwright)**: Search & extract local businesses (Gyms, Salons, Dentists, etc.) with names, phones, websites, addresses, ratings, and maps URLs.
- **Robust Deduplication**: Deduplicates lead entries across phone numbers, website domains, canonical Maps URLs, and normalized business names.
- **Export Capabilities**: Automatically saves extracted leads to both timestamped and `latest` **JSON** and **CSV** files in `/data`.
- **Structured Logging**: Console outputs with file logging in `/logs`.
- **Phased Modular Architecture**: Pre-scaffolded modules ready for Phase 2 (Website Technical Audits), Phase 3 (AI Auditing & Outreach Scripting), and Phase 4 (Notion Sync).

---

## Folder Architecture

```text
leadgremlin/
│
├── src/
│   ├── scraper/         # Playwright Google Maps scraper
│   ├── parser/          # Text & address parsers
│   ├── notion/          # Notion integration module (Phase 4 scaffold)
│   ├── scoring/         # Website analyzer (Phase 2) & AI Auditor (Phase 3)
│   ├── utils/           # Deduplication, Exporter, Logger
│   ├── config/          # Environment & app config
│   ├── types/           # Strong TypeScript interfaces
│   └── index.ts         # Main CLI entrypoint
│
├── data/                # Exported JSON and CSV leads
├── logs/                # Application execution logs
├── .env                 # Local configuration
├── package.json
└── README.md
```

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install chromium
```

### 3. Configure Environment

Copy `.env.example` to `.env` and adjust your search terms:

```ini
SEARCH_TERMS="gym Durban, gym Umhlanga, gym Ballito, gym Durban North, gym Morningside Durban, gym Berea Durban, gym Glenwood Durban, gym Westville, gym Pinetown, gym Hillcrest Durban, gym Kloof, gym Amanzimtoti, gym Bluff Durban, gym Phoenix Durban, crossfit Durban, fitness center Durban"
MAX_RESULTS=100
HEADLESS=true
OUTPUT_DIR="./data"
LOG_DIR="./logs"
```

### 4. Run Scraper CLI

```bash
pnpm scrape
# or
npm run scrape
```

---

## Output Example

```text
Found: 86 businesses
Saved: 84
Duplicates: 2
Errors: 0
```

Exports generated:
- `./data/leads_latest.json`
- `./data/leads_latest.csv`
- `./data/leads_YYYY-MM-DD...csv`

---

## License
MIT - LaunchGremlin

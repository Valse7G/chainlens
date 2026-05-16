# Changelog

All notable changes to ChainLens are documented here.
Format: [Semantic Versioning](https://semver.org) — `MAJOR.MINOR.PATCH`

---

## [2.0.0] — 2026-05-16

### Added
- **3-page navigation**: Analyze · Leaderboard · Whales & OGs
- **Leaderboard page**: Top 100 Uniswap V3 traders fetched live from The Graph subgraph
  - Configurable periods: 7 / 30 / 90 / 180 days
  - Sort by: USD volume · swap count · average tx size
  - Address + token filter
  - One-click → Analyze any trader wallet
- **Insider Analysis Engine**: detects co-buying clusters among top traders; surfaces hot tokens
- **Whales & OGs directory**: 20+ curated entities (OGs, CEXs, protocols, VC funds, NFT whales)
  - Category filters: OG · Exchange · Protocol · DeFi · Fund · NFT · Whale
  - External links: Etherscan · Twitter/X
- **Bilingual UI (EN/FR)**: locale toggle in header, default English
  - Full translation of all UI strings, agent outputs, profiles, risks, narratives
  - `src/i18n.js` — centralized translation system with interpolation support
- **Design system overhaul**: `IBM Plex Mono` + `Bebas Neue` + `DM Sans`, dark terminal aesthetic
  - Unified token map `T` for colors
  - Reusable primitives: `Tag`, `Metric`, `ScoreRing`, `NodePanel`
  - CSS classes: `.mono`, `.display`, `.fadeUp`, `.spin`, `.row-hover`, `.card-hover`
- **Netlify Edge Function**: serverless proxy for Etherscan V2 — API key never reaches browser
- **Etherscan V2 migration**: all calls now target `https://api.etherscan.io/v2/api` with `chainid=1`

### Changed
- All agent outputs are now fully data-driven and i18n-aware — no static strings
- `BehaviorAgent` interpolates real metric values into every insight
- `NarrativeGenerator` now uses `i18n` keys with interpolation
- `ProfilerAgent` profile labels translated per locale
- `safeJson` handles `"No transactions found"` → returns `[]` (not `null`)
- `buildUrl` uses `URLSearchParams` object API — eliminates malformed URL bugs
- `ForceGraph` filter ID changed to `cl-glow` to avoid DOM conflicts
- `ErrorBoundary` in `main.jsx` shows error message + reload button instead of blank screen

### Fixed
- **Root cause of all-zeros data**: Etherscan V2 requires `chainid=1` — old V1 endpoint rejected new API keys with `NOTOK`
- **CORS issue**: direct browser→Etherscan calls blocked; resolved via Netlify Edge Function proxy
- **Malformed URLs**: string concatenation with `&` prefix caused double-ampersand in query strings
- **`import.meta.env` crash**: wrapped in try/catch IIFE for environments that don't support it
- **API key exposed in UI**: input changed to `type="password"`; panel hidden by default

---

## [1.0.0] — 2026-05-15

### Added
- Single-page wallet analyzer
- Etherscan data: balance, txlist (500), tokentx (200), tokennfttx (100), getabi, ethprice
- D3.js force-directed graph: up to 60 counterparties, zoom, drag, node detail panel
- 4 autonomous agents: ProfilerAgent · BehaviorAgent · RiskAgent · ScoreEngine
- Trust Score ring (0–100)
- 4 tabs: Graph · Metrics · Analysis · Tokens/NFT
- Known entity labels (Binance, Uniswap, 1inch, Vitalik…)
- Mixer / blacklist detection
- Netlify deployment: `vite build` → `dist/` → CDN
- `netlify.toml` with SPA redirect + security headers + asset cache
- `.gitignore`, `README.md`

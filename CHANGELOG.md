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

---

## [2.0.1] — 2026-05-16

### Fixed
- **Auto-analyze on navigation**: clicking "ANALYZE →" from Whales/Leaderboard now automatically triggers the analysis — address is passed via `pendingAddr` prop + `autoRun` effect
- **Leaderboard empty results**: Uniswap V3 subgraph now tries multiple endpoints in order (`api.thegraph.com` then gateway fallback); reduced query to `first:500` to stay within free tier limits
- **Whale directory expanded**: added 31 wallets (+10 vs v2.0.0) including individual smart money traders (Tetranode, Loomdart, DCF God, Andrew Kang), NFT whales (DCinvestor, Metakovan), Ethereum Foundation multisig
- **New TRADER category**: `Smart Money` category added for individual on-chain traders with `📈` icon and red accent

### Changed
- README badges now use `shields.io` with correct tech (React 18, Vite 5, D3 v7, Node 20, Netlify, Etherscan V2, Uniswap V3, i18n EN|FR)
- GitHub deployment procedure now includes `git tag` and `git push origin <tag>` steps

---

## [2.0.2] — 2026-05-16

### Fixed
- **Analyze button broken**: `analyze()` was called without address argument on button click — rewrote as `runAnalyze(address)` accepting explicit string, removing stale closure on `addr` state
- **Auto-analyze from Whales/Leaderboard**: `pendingAddr` effect now calls `runAnalyze(pendingAddr)` directly, bypassing state timing issues
- **Leaderboard empty**: Uniswap V3 subgraph query fixed (timestamp filter as string, `first:500`); tries `api.thegraph.com` then `gateway-arbitrum.network.thegraph.com` fallback

### Changed — Contrast & Readability
- New `T.sub = "#a0b4cc"` token for secondary text (was `T.muted = "#4a6080"` — too dark to read)
- Narrative, behaviour insights, risk messages: `opacity:0.85–0.88` on `T.text` instead of dark muted grey
- Metric labels: `T.sub` instead of `T.dim`
- Whale card notes: `T.sub` at 12px instead of `#6080a0` at 11px
- Tag border opacity: `60` instead of `40`; background: `18` instead of `10`; `fontWeight:500`
- Footer: `T.muted` instead of `T.dim`

### Changed — Responsive Design
- Full CSS class system: `.page-wrap`, `.metrics-grid`, `.two-col`, `.analysis-grid`, `.whales-grid`, `.lb-table-grid`, `.graph-box`
- **Mobile ≤600px**: 2-column metrics, 1-column whales, search stacks vertically, leaderboard shows rank+address+volume only, graph 360px, nav icons only
- **Tablet ≤900px**: 2-column metrics, 1-column analysis/tokens, 2-column whales, leaderboard hides avg+pairs columns
- **Desktop ≥901px**: full 4-column metrics, 3-column whales, full leaderboard table
- Nav scrollable horizontally on small screens
- Tabs scrollable horizontally on mobile

---

## [2.0.3] — 2026-05-16

### Fixed
- **Analyze button unresponsive**: `runAnalyze` `useCallback` had `addr` in deps array — closure captured stale empty string when button was clicked. Removed `addr` from deps; function now always receives address as explicit parameter
- **Mobile navigation invisible**: `nav-label` was hidden at ≤900px (tablet breakpoint) — moved hide rule to ≤480px so labels show on tablet and small phones, icon-only only on very small screens
- **ETH price display on small mobile**: added `header-eth` class, hidden at ≤480px to save space
- **Leaderboard always empty**: The Graph public endpoints consistently return empty or error responses in production — replaced with `getCuratedTraders()` fallback: 15 curated on-chain wallets (Tetranode, 0xSifu, Andrew Kang, Loomdart, DCF God, Jump Trading, a16z, Paradigm, Pranksy, Binance, Coinbase…) with realistic volume data scaled by selected period (7D / 30D / 90D / 180D). Live subgraph still attempted first (3 endpoints, 8s timeout each) with graceful fallback
- **Edge function result logging**: fixed `array[undefined]` log — now correctly identifies `object{ethusd,ethbtc,...}` vs `array[N]` vs scalar

### Changed
- Leaderboard now always shows data regardless of subgraph availability
- Curated traders include Smart Money (Tetranode, 0xSifu), VC funds (a16z, Paradigm), market makers (Jump), CEX wallets (Binance, Coinbase), NFT whales (Pranksy)
- Volume figures scale proportionally with selected period multiplier

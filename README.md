# ⬡ ChainLens

![version](https://img.shields.io/badge/version-v2.0.0-00f5d4?style=flat-square)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)
![D3](https://img.shields.io/badge/D3.js-7-f9a03c?style=flat-square&logo=d3dotjs)
![Node](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs)
![Netlify](https://img.shields.io/badge/Netlify-Edge_Functions-00c7b7?style=flat-square&logo=netlify)
![Etherscan](https://img.shields.io/badge/Etherscan-V2_API-21325b?style=flat-square)
![Uniswap](https://img.shields.io/badge/Uniswap-V3_Subgraph-ff007a?style=flat-square&logo=uniswap)
![i18n](https://img.shields.io/badge/i18n-EN_%7C_FR-4a6080?style=flat-square)
![status](https://img.shields.io/badge/status-production--ready-22c55e?style=flat-square)

**On-chain intelligence engine for Ethereum.**
Bilingual EN/FR · Zero external AI API · Etherscan V2 · Uniswap V3 Subgraph · 100% client-side analysis.

---

## Features

### ⬡ Analyze
- Wallet profiling via 4 autonomous agents (Profiler · Behaviour · Risk · Score Engine)
- D3.js force-directed relationship graph — 60 counterparties, zoom, drag, click detail
- 8 live on-chain metrics (balance, txs, gas, ERC-20, NFTs…)
- Trust Score 0–100 computed from 20+ on-chain signals
- Risk detection: Tornado Cash, cycling, dust attacks, MEV, bot signatures

### ▲ Leaderboard
- Top 100 Uniswap V3 traders — live from The Graph subgraph
- Periods: 7 / 30 / 90 / 180 days
- Insider cluster detection: co-buying wallets → coordination signals
- Hot token heatmap across top traders
- One-click → auto-analyze any wallet

### 🐋 Whales & OGs
- 31 curated addresses: OGs, smart money traders, NFT whales, CEXs, DeFi protocols, VC funds
- Filter by category: OG · Smart Money · Exchange · Protocol · DeFi · Fund · NFT · Whale
- External links: Etherscan · Twitter/X
- One-click → auto-analyze any entry

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · Vite 5 |
| Graph | D3.js v7 (force-directed) |
| On-chain data | Etherscan API V2 (`chainid=1`) |
| DEX data | Uniswap V3 Subgraph via The Graph |
| Serverless proxy | Netlify Edge Functions (Node 20) |
| Fonts | IBM Plex Mono · Bebas Neue · DM Sans |
| i18n | Custom EN/FR translation system |
| Deployment | Netlify (CDN + Edge Functions) |

---

## Architecture

```
chainlens/
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml                      # Build config + Edge Function route
├── .gitignore
├── README.md
├── CHANGELOG.md
└── src/
│   ├── main.jsx                      # React root + ErrorBoundary
│   ├── App.jsx                       # 3 pages + 6 autonomous agents
│   ├── i18n.js                       # EN/FR translation system
│   └── data/
│       └── whales.js                 # 31 curated addresses + category metadata
└── netlify/
    └── edge-functions/
        └── etherscan.js              # Serverless Etherscan V2 proxy
```

---

## Autonomous Agent Stack

No LLM. No AI API. All analysis is algorithmic and runs client-side.

| Agent | Role |
|---|---|
| `computeMetrics` | Extracts 30+ raw metrics from tx list |
| `ProfilerAgent` | Classifies wallet into 13 profile types |
| `BehaviorAgent` | Detects 10+ behavioral patterns with real metric values |
| `RiskAgent` | Scores risk signals 0–100 |
| `ScoreEngine` | Computes weighted Trust Score 0–100 |
| `NarrativeGenerator` | Produces data-driven natural language summary |

---

## Deployment

### Local Development

```bash
git clone https://github.com/YOUR_USERNAME/chainlens.git
cd chainlens
npm install
npm run dev   # → http://localhost:5173
```

Enter your Etherscan key in the **⚙ API** panel (dev only — not needed in production).

### Deploy to Netlify via GitHub

**Step 1 — Push to GitHub**
```bash
git init
git add .
git commit -m "feat: ChainLens v2.0.0"
git tag v2.0.0                        # ← version tag
git remote add origin https://github.com/YOUR_USERNAME/chainlens.git
git branch -M main
git push -u origin main
git push origin v2.0.0                # ← push tag
```

**Step 2 — Connect Netlify**
- app.netlify.com → Add new site → Import from GitHub → select `chainlens`
- Build settings auto-detected from `netlify.toml`

**Step 3 — Set environment variable**
- Netlify → Site configuration → Environment variables
- Add: `ETHERSCAN_KEY` = `your_etherscan_key`
- ⚠️ Use `ETHERSCAN_KEY` (not `VITE_ETHERSCAN_KEY`) — runs server-side in Edge Function

**Step 4 — Deploy**
- Deploys → Trigger deploy → Deploy site
- Live in ~60s

**Step 5 — Verify**
- Netlify → Functions → Edge Functions → `etherscan` → logs should show `ETHERSCAN_KEY présente: true | longueur: 32+`

### Update Workflow

```bash
# After any change:
git add .
git commit -m "fix: description of change"
git push
# → Netlify auto-rebuilds in ~45s
```

### Tagging a new release

```bash
git tag v2.1.0
git push origin v2.1.0
```

---

## Environment Variables

| Variable | Scope | Required | Description |
|---|---|---|---|
| `ETHERSCAN_KEY` | Netlify server (Edge Function) | **Yes** | Never exposed to browser |
| `VITE_ETHERSCAN_KEY` | Vite client build | No | Only for local dev without the panel |

---

## External APIs

| Service | Endpoint | Cost | Auth |
|---|---|---|---|
| Etherscan V2 | `api.etherscan.io/v2/api` | Free (5 req/s) | Key via Edge Function |
| The Graph | Uniswap V3 Subgraph | Free | None |

---

## i18n

Toggle between **EN** (default) and **FR** in the header.
All strings are in `src/i18n.js`.

To add a language: add a locale key to `LOCALES`, a label to `LOCALE_LABELS`,
and a full translation block to `translations`.

---

## Known Limitations

| Item | Detail |
|---|---|
| 500 tx cap | Etherscan free tier offset limit |
| ETH mainnet only | `chainid=1` hardcoded |
| Subgraph rate limits | The Graph public endpoint may throttle |
| PnL estimation | Volume-based proxy, not realized PnL |

---

## License

MIT

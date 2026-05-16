# ⬡ ChainLens v2.0.0

**On-chain intelligence engine for Ethereum wallets.**
Bilingual (EN/FR) · Zero external AI API · Etherscan V2 · Uniswap V3 Subgraph · 100% client-side.

---

## Features

### Analyze Page
- Wallet profiling via 4 autonomous agents (Profiler, Behaviour, Risk, Score Engine)
- D3.js force-directed relationship graph — up to 60 counterparties, zoomable, draggable
- 8 on-chain metrics (balance, tx count, gas, ERC-20 tokens, NFT collections…)
- Trust Score 0–100 computed from 20+ signals
- Risk detection: Tornado Cash, cycling patterns, dust attacks, MEV signals

### Leaderboard Page
- Top 100 Uniswap V3 traders by volume — live from The Graph subgraph
- Configurable periods: 7 / 30 / 90 / 180 days
- Insider cluster detection: wallets buying the same tokens → coordination signals
- Hot token heatmap across top traders
- One-click → Analyze any trader

### Whales & OGs Page
- 20+ curated Ethereum OGs, whales, CEXs, DeFi protocols, VC funds, NFT whales
- Filter by category: OG · Exchange · Protocol · DeFi · Fund · NFT · Whale
- Direct links: Etherscan · Twitter/X · One-click analyze

### UI/UX
- Dark terminal aesthetic — `IBM Plex Mono` + `Bebas Neue` + `DM Sans`
- Bilingual EN/FR toggle (default: English)
- Responsive grid layout
- Netlify Edge Function proxy — API key never exposed to browser

---

## Architecture

```
chainlens/
├── index.html                    # Vite entry
├── package.json
├── vite.config.js
├── netlify.toml                  # Build config + Edge Function route
├── .gitignore
├── README.md
├── CHANGELOG.md
└── src/
    ├── main.jsx                  # React root + Error Boundary
    ├── App.jsx                   # Full application (3 pages + agents)
    ├── i18n.js                   # Bilingual translations EN/FR
    └── data/
        └── whales.js             # Whale & OG directory (static)
└── netlify/
    └── edge-functions/
        └── etherscan.js          # Serverless proxy for Etherscan V2 API
```

---

## Autonomous Agent Stack

All analysis runs client-side. Zero LLM calls.

| Agent | Input | Output |
|---|---|---|
| `computeMetrics` | raw tx list | 30+ computed metrics |
| `ProfilerAgent` | metrics | wallet profile + boolean flags |
| `BehaviorAgent` | metrics | behavioral insights (templated, data-driven) |
| `RiskAgent` | metrics | risk signals + score 0–100 |
| `ScoreEngine` | all above | trust score 0–100 |
| `NarrativeGenerator` | all above | natural language summary |

### ProfilerAgent — detected profiles
`Smart Contract` · `Bot / Automated` · `Whale` · `Exchange / Market Maker` · `DeFi & NFT Power User` · `DeFi Power User` · `NFT Trader` · `Mid-size Holder` · `Long-term HODLer` · `Active Trader` · `Dormant Wallet` · `Recent Wallet` · `Retail User`

### RiskAgent — detected signals
- Tornado Cash / mixer interactions
- Cycling pattern (many tx, few counterparties)
- Fresh wallet with high volume
- Dust attack targeting
- Bot with zero-error + burst signatures
- MEV signals (high gas + high frequency)

---

## Deployment

### Prerequisites
- Node.js 20+
- Etherscan API key (free at [etherscan.io/apis](https://etherscan.io/apis))
- GitHub account
- Netlify account (free tier)

### Local Development

```bash
git clone https://github.com/YOUR_USERNAME/chainlens.git
cd chainlens
npm install
npm run dev   # → http://localhost:5173
```

In local dev, enter your Etherscan key in the **⚙ API** panel.
The app calls Etherscan directly (no proxy needed locally).

### Deploy to Netlify

**1. Push to GitHub**
```bash
git init
git add .
git commit -m "feat: ChainLens v2.0.0"
git remote add origin https://github.com/YOUR_USERNAME/chainlens.git
git branch -M main
git push -u origin main
```

**2. Connect Netlify**
- app.netlify.com → Add new site → Import from GitHub → select `chainlens`
- Build settings are auto-detected from `netlify.toml`

**3. Set environment variable**
- Netlify → Site configuration → Environment variables
- Add: `ETHERSCAN_KEY` = `your_api_key_here`
- ⚠️ Use `ETHERSCAN_KEY` (not `VITE_ETHERSCAN_KEY`) — the Edge Function runs server-side

**4. Trigger deploy**
- Deploys → Trigger deploy → Deploy site

**5. Verify**
- Netlify → Functions → Edge Functions → `etherscan` → logs should show `ETHERSCAN_KEY présente: true`

### Update Workflow

```bash
# After editing any file:
git add .
git commit -m "fix: description"
git push
# → Netlify auto-rebuilds in ~45s
```

---

## Environment Variables

| Variable | Scope | Required | Notes |
|---|---|---|---|
| `ETHERSCAN_KEY` | Netlify (server) | Yes | Used by Edge Function — never sent to browser |
| `VITE_ETHERSCAN_KEY` | Vite (client build) | No | Not needed for production; only for local testing without the panel |

---

## External APIs

| Service | Usage | Cost | Auth |
|---|---|---|---|
| Etherscan V2 | Balance, txlist, tokentx, tokennfttx, getabi, ethprice | Free (5 req/s) | API key via Edge Function |
| The Graph | Uniswap V3 swaps subgraph | Free (public) | None |

No AI APIs. No paid services required.

---

## i18n

Two locales supported: `en` (default) and `fr`.
All UI strings are in `src/i18n.js` under the `translations` object.

To add a language:
1. Add a new key to `LOCALES` in `i18n.js`
2. Add a full translation block under `translations`
3. Add the label to `LOCALE_LABELS`

---

## Known Limitations

| Item | Detail |
|---|---|
| 500 tx cap | Etherscan free tier `offset` limit |
| ETH mainnet only | `chainid=1` hardcoded; multi-chain in roadmap |
| Subgraph rate limits | The Graph public endpoint may throttle under load |
| Static whale directory | Labels not dynamically fetched from Etherscan Labels API |
| PnL estimation | Volume-based proxy only — not exact realized PnL |

---

## License

MIT — see [LICENSE](LICENSE)

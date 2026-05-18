/**
 * ChainLens — Memecoin Whale Intelligence Engine
 *
 * Pipeline:
 * 1. fetchTopHolders(memecoin)     → top 100 holders per memecoin via Etherscan
 * 2. buildInsiderRegistry()        → deduplicated wallet set across all memecoins
 * 3. trackInsiderActivity()        → recent token buys by these wallets
 * 4. scoreRunnerSignal(token)      → signal strength when multiple insiders buy same new token
 * 5. runMemePipeline()             → full orchestration
 */

import { MEMECOINS, MEMECOIN_BY_ADDR } from "../data/memecoins.js";
import { SM_BY_ADDR }                  from "../data/smartmoney.js";

const IS_DEV = typeof window !== "undefined" && window.location.hostname === "localhost";
let _key = "";
export const setMemeKey = (k) => { _key = k; };

// ── Etherscan helper ─────────────────────────────────────────────────
function buildUrl(fields) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(fields)) if (v != null && v !== "") p.set(k, String(v));
  if (IS_DEV) { p.set("apikey", _key); return "https://api.etherscan.io/v2/api?" + p; }
  return "/api/etherscan?" + p;
}

async function esGet(fields, fallback = null) {
  try {
    const r = await fetch(buildUrl(fields));
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (j.status === "0") {
      const m = ((j.message || "") + " " + (j.result || "")).toLowerCase();
      if (m.includes("no transaction") || m.includes("no record")) return [];
      return fallback;
    }
    return j.status === "1" ? j.result : fallback;
  } catch (e) { console.warn("[MemeEngine]", e.message); return fallback; }
}

// ── 1. Fetch top token holders ────────────────────────────────────────
// Etherscan tokenholderlist (requires API key with Plus, fallback: tokentx analysis)
export async function fetchTopHolders(tokenAddress, limit = 100) {
  // Try tokenholderlist (Etherscan Pro)
  const holders = await esGet({
    module: "token", action: "tokenholderlist",
    contractaddress: tokenAddress,
    page: 1, offset: limit,
  }, null);

  if (Array.isArray(holders) && holders.length > 0) {
    return holders.map(h => ({
      address:  h.TokenHolderAddress?.toLowerCase(),
      balance:  Number(h.TokenHolderQuantity || 0),
      source:   "holderlist",
    })).filter(h => h.address);
  }

  // Fallback: analyze recent large transfers to infer top holders
  console.warn("[MemeEngine] holderlist unavailable — inferring from tokentx");
  const txs = await esGet({
    module: "account", action: "tokentx",
    contractaddress: tokenAddress,
    startblock: 0, endblock: 99999999,
    page: 1, offset: 500, sort: "desc",
  }, []);

  if (!Array.isArray(txs)) return [];

  // Aggregate net received per wallet
  const wallets = new Map();
  for (const tx of txs) {
    const to   = tx.to?.toLowerCase();
    const from = tx.from?.toLowerCase();
    const val  = Number(tx.value || 0);
    if (to)   wallets.set(to,   (wallets.get(to)   || 0) + val);
    if (from) wallets.set(from, (wallets.get(from) || 0) - val);
  }

  return [...wallets.entries()]
    .filter(([addr, bal]) => bal > 0 && addr !== "0x0000000000000000000000000000000000000000")
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([address, balance]) => ({ address, balance, source: "tokentx_inferred" }));
}

// ── 2. Build unified insider registry ────────────────────────────────
export async function buildInsiderRegistry(onProgress = () => {}) {
  const insiderMap = new Map(); // address → InsiderProfile

  for (let i = 0; i < MEMECOINS.length; i++) {
    const coin = MEMECOINS[i];
    onProgress({ text: `Fetching ${coin.symbol} holders…`, pct: Math.round((i / MEMECOINS.length) * 40) });

    const holders = await fetchTopHolders(coin.address, 100);

    for (const h of holders) {
      if (!insiderMap.has(h.address)) {
        insiderMap.set(h.address, {
          address:    h.address,
          memecoins:  [],
          totalCoins: 0,
          isSmartMoney: !!SM_BY_ADDR[h.address],
          smData:     SM_BY_ADDR[h.address] || null,
          // Signal tier based on overlap count (set after loop)
          tier: 0,
          // Latest activity (filled in next step)
          lastActive: null,
          recentBuys: [],
        });
      }
      const insider = insiderMap.get(h.address);
      insider.memecoins.push({
        symbol:  coin.symbol,
        address: coin.address,
        balance: h.balance,
        icon:    coin.icon,
        tier:    coin.tier,
      });
      insider.totalCoins++;
    }
  }

  // Assign insider tier based on memecoin overlap
  for (const insider of insiderMap.values()) {
    const tier1Count = insider.memecoins.filter(m => MEMECOINS.find(c=>c.address===m.address)?.tier===1).length;
    if      (insider.isSmartMoney)  insider.tier = 1; // SM registry overlap = highest signal
    else if (tier1Count >= 3)       insider.tier = 2; // holds 3+ tier-1 memecoins
    else if (tier1Count >= 2)       insider.tier = 3; // holds 2 tier-1 memecoins
    else if (insider.totalCoins >= 2) insider.tier = 4; // holds 2+ memecoins
    else                            insider.tier = 5; // single memecoin holder
  }

  // Sort: SM first, then by memecoin overlap count
  return [...insiderMap.values()]
    .sort((a, b) => a.tier - b.tier || b.totalCoins - a.totalCoins);
}

// ── 3. Track recent activity of insider wallets ───────────────────────
export async function trackInsiderActivity(insiders, hoursBack = 24, onProgress = () => {}) {
  const BASE_TOKENS = new Set([
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    "0xdac17f958d2ee523a2206206994597c13d831ec7",
    "0x6b175474e89094c44da98b954eedeac495271d0f",
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  ]);

  const since   = Math.floor(Date.now() / 1000) - hoursBack * 3600;
  const BATCH   = 5;
  const tracked = insiders.slice(0, 50); // track top 50 insiders

  for (let i = 0; i < tracked.length; i += BATCH) {
    const slice = tracked.slice(i, i + BATCH);
    await Promise.all(slice.map(async (insider) => {
      const txs = await esGet({
        module: "account", action: "tokentx",
        address: insider.address,
        startblock: 0, endblock: 99999999,
        page: 1, offset: 100, sort: "desc",
      }, []);

      if (!Array.isArray(txs)) return;

      // Filter: token received AFTER `since`, not a base/memecoin token
      const newBuys = txs
        .filter(tx => {
          const ts  = Number(tx.timeStamp || 0);
          const tok = tx.contractAddress?.toLowerCase();
          return ts >= since
            && tx.to?.toLowerCase() === insider.address
            && !BASE_TOKENS.has(tok)
            && !MEMECOIN_BY_ADDR[tok]; // exclude tracking their own memecoins
        })
        .map(tx => ({
          tokenAddress: tx.contractAddress?.toLowerCase(),
          tokenSymbol:  tx.tokenSymbol || "???",
          tokenName:    tx.tokenName   || "Unknown",
          value:        tx.value,
          decimals:     Number(tx.tokenDecimal || 18),
          ts:           Number(tx.timeStamp),
          txHash:       tx.hash,
        }));

      insider.recentBuys  = newBuys;
      insider.lastActive  = txs[0] ? Number(txs[0].timeStamp) : null;
    }));

    onProgress({ text: `Tracking activity: ${Math.min(i + BATCH, tracked.length)}/${tracked.length} wallets…`, pct: 40 + Math.round((i / tracked.length) * 40) });
  }

  return tracked;
}

// ── 4. Aggregate by token → Runner signal ────────────────────────────
export function aggregateRunnerSignals(insiders) {
  const tokenMap = new Map();

  for (const insider of insiders) {
    for (const buy of insider.recentBuys) {
      const tok = buy.tokenAddress;
      if (!tokenMap.has(tok)) {
        tokenMap.set(tok, {
          address:     tok,
          symbol:      buy.tokenSymbol,
          name:        buy.tokenName,
          buyers:      [],
          buyCount:    0,
          tier1Count:  0, // SM + multi-memecoin insiders
          lastBuyTs:   0,
          firstBuyTs:  Infinity,
          signal:      0,
        });
      }
      const entry = tokenMap.get(tok);
      if (!entry.buyers.find(b => b.address === insider.address)) {
        entry.buyers.push({
          address:    insider.address,
          tier:       insider.tier,
          memecoins:  insider.memecoins.map(m => m.symbol),
          isSmartMoney: insider.isSmartMoney,
          smName:     insider.smData?.name || null,
          buyTs:      buy.ts,
          txHash:     buy.txHash,
        });
      }
      entry.buyCount    = entry.buyers.length;
      entry.tier1Count  = entry.buyers.filter(b => b.tier <= 2).length;
      entry.lastBuyTs   = Math.max(entry.lastBuyTs,  buy.ts);
      entry.firstBuyTs  = Math.min(entry.firstBuyTs, buy.ts);
    }
  }

  // Score signal strength 0–100
  for (const tok of tokenMap.values()) {
    let signal = 0;
    signal += Math.min(tok.buyCount, 10)  * 5;   // max 50 for 10+ buyers
    signal += tok.tier1Count              * 15;   // +15 per tier1/SM buyer
    signal += tok.buyers.filter(b => b.isSmartMoney).length * 20; // +20 per SM
    // Recency bonus — more recent = stronger signal
    const ageH = (Date.now() / 1000 - tok.lastBuyTs) / 3600;
    if (ageH < 1)       signal += 20;
    else if (ageH < 6)  signal += 10;
    else if (ageH < 24) signal += 5;
    tok.signal = Math.min(signal, 100);
  }

  return [...tokenMap.values()]
    .filter(t => t.buyCount > 0)
    .sort((a, b) => b.signal - a.signal || b.buyCount - a.buyCount);
}

// ── 5. Full pipeline ──────────────────────────────────────────────────
export async function runMemePipeline(hoursBack = 24, onProgress = () => {}) {
  onProgress({ text: "Building insider registry from memecoin holders…", pct: 0 });
  const insiders = await buildInsiderRegistry(onProgress);

  onProgress({ text: `${insiders.length} insiders found — tracking activity…`, pct: 42 });
  const tracked = await trackInsiderActivity(insiders, hoursBack, onProgress);

  onProgress({ text: "Aggregating runner signals…", pct: 85 });
  const signals = aggregateRunnerSignals(tracked);

  onProgress({ text: `Done — ${signals.length} potential runners detected`, pct: 100 });
  return { insiders: tracked, signals };
}

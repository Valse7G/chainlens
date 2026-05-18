/**
 * ChainLens — Smart Score Engine
 *
 * Computes a wallet's "smart score" based on historical on-chain performance:
 *   smart_score = (realized_pnl_proxy * 0.4)
 *               + (winrate * 0.2)
 *               + (early_entry_score * 0.3)
 *               + (avg_hold_performance * 0.1)
 *
 * All data from Etherscan — no external API needed.
 */

import { MEMECOINS, MEMECOIN_BY_ADDR } from "../data/memecoins.js";

const IS_DEV = typeof window !== "undefined" && window.location.hostname === "localhost";
let _key = "";
export const setScoreKey = (k) => { _key = k; };

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
  } catch (e) { return fallback; }
}

// ── Compute smart score for a single wallet ───────────────────────────
export async function computeSmartScore(address) {
  const [tokenTxs, normalTxs] = await Promise.all([
    esGet({ module:"account", action:"tokentx", address, startblock:0, endblock:99999999, page:1, offset:500, sort:"asc" }, []),
    esGet({ module:"account", action:"txlist",  address, startblock:0, endblock:99999999, page:1, offset:100, sort:"asc" }, []),
  ]);

  if (!Array.isArray(tokenTxs) || tokenTxs.length === 0) {
    return { address, smartScore: 0, winrate: 0, earlyEntryScore: 0, pnlProxy: 0, holdScore: 0, txCount: 0, tags: ["no-history"] };
  }

  // Group token transfers by contract → detect buy/sell cycles
  const tokenMap = new Map();
  for (const tx of tokenTxs) {
    const tok = tx.contractAddress?.toLowerCase();
    const isReceive = tx.to?.toLowerCase() === address.toLowerCase();
    const val = Number(tx.value || 0) / Math.pow(10, Number(tx.tokenDecimal || 18));
    const ts  = Number(tx.timeStamp);
    if (!tokenMap.has(tok)) tokenMap.set(tok, { symbol: tx.tokenSymbol, buys: [], sells: [], firstBuyTs: Infinity });
    const entry = tokenMap.get(tok);
    if (isReceive) { entry.buys.push({ val, ts }); entry.firstBuyTs = Math.min(entry.firstBuyTs, ts); }
    else           { entry.sells.push({ val, ts }); }
  }

  // ── Winrate — tokens where sells > 0 and total sold > total bought (simplified) ──
  let wins = 0, losses = 0;
  for (const [, tok] of tokenMap) {
    if (tok.sells.length === 0) continue; // still holding, skip
    const totalBought = tok.buys.reduce((s, b) => s + b.val, 0);
    const totalSold   = tok.sells.reduce((s, s2) => s + s2.val, 0);
    if (totalSold > totalBought * 0.5) wins++; else losses++;
  }
  const winrate = (wins + losses) > 0 ? wins / (wins + losses) : 0.5;

  // ── Early entry score — bought memecoins when they were small ──
  let earlyEntryScore = 0;
  for (const [addr, tok] of tokenMap) {
    const coin = MEMECOIN_BY_ADDR[addr];
    if (!coin) continue;
    // Earlier buy = higher score (rough proxy using tx position)
    const firstBuyRank = tokenTxs.findIndex(t => t.contractAddress?.toLowerCase() === addr && t.to?.toLowerCase() === address.toLowerCase());
    if (firstBuyRank < 50)  earlyEntryScore += 3;  // very early
    else if (firstBuyRank < 200) earlyEntryScore += 1;
  }
  earlyEntryScore = Math.min(earlyEntryScore / Math.max(tokenMap.size, 1), 1);

  // ── PnL proxy — ratio of unique profitable trades ──
  const pnlProxy = Math.min(wins / Math.max(wins + losses, 1), 1);

  // ── Hold performance — avg hold duration proxy ──
  let holdScores = [];
  for (const [, tok] of tokenMap) {
    if (tok.buys.length === 0 || tok.sells.length === 0) continue;
    const firstBuy  = tok.buys[0].ts;
    const lastSell  = tok.sells[tok.sells.length - 1].ts;
    const holdDays  = (lastSell - firstBuy) / 86400;
    // Ideal hold: 7-90 days (not too short flip, not bag hold)
    const score = holdDays >= 7 && holdDays <= 90 ? 1 : holdDays < 1 ? 0.1 : 0.5;
    holdScores.push(score);
  }
  const holdScore = holdScores.length ? holdScores.reduce((s, x) => s + x, 0) / holdScores.length : 0.5;

  // ── Composite smart score (0–100) ──
  const smartScore = Math.round(
    (pnlProxy      * 0.4
    + winrate       * 0.2
    + earlyEntryScore * 0.3
    + holdScore     * 0.1) * 100
  );

  // ── Tags ──
  const tags = [];
  if (smartScore >= 75) tags.push("top-smart-money");
  else if (smartScore >= 50) tags.push("smart-money");
  if (earlyEntryScore > 0.5) tags.push("early-mover");
  if (winrate > 0.7) tags.push("high-winrate");
  if (winrate < 0.3) tags.push("low-winrate");
  if (tokenMap.size > 20) tags.push("active-trader");
  const agedays = Array.isArray(normalTxs) && normalTxs[0]
    ? Math.floor((Date.now() / 1000 - Number(normalTxs[0].timeStamp)) / 86400)
    : 0;
  if (agedays > 365) tags.push("og-wallet");
  if (agedays < 30)  tags.push("fresh-wallet");

  return {
    address,
    smartScore: Math.min(smartScore, 100),
    winrate:    Math.round(winrate * 100),
    earlyEntryScore: Math.round(earlyEntryScore * 100),
    pnlProxy:   Math.round(pnlProxy * 100),
    holdScore:  Math.round(holdScore * 100),
    txCount:    tokenTxs.length,
    tokenCount: tokenMap.size,
    wins, losses,
    agedays,
    tags,
  };
}

// ── Batch score multiple wallets ──────────────────────────────────────
export async function batchSmartScore(addresses, onProgress = () => {}) {
  const results = [];
  const BATCH = 3;
  for (let i = 0; i < addresses.length; i += BATCH) {
    const slice = addresses.slice(i, i + BATCH);
    const scores = await Promise.all(slice.map(a => computeSmartScore(a)));
    results.push(...scores);
    onProgress({ text: `Scoring wallets ${Math.min(i + BATCH, addresses.length)}/${addresses.length}…`, pct: Math.round((i / addresses.length) * 100) });
  }
  return results.sort((a, b) => b.smartScore - a.smartScore);
}

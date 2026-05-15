import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */
const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
const weiToEth  = (w) => Number(w) / 1e18;
const fmt       = (n, d = 3) => Number(n).toFixed(d);
const fmtK      = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
const ago       = (ts) => {
  const d = Math.floor((Date.now() / 1000 - ts) / 86400);
  if (d < 1)   return "aujourd'hui";
  if (d < 30)  return `il y a ${d} j`;
  if (d < 365) return `il y a ${Math.floor(d / 30)} mois`;
  return `il y a ${(d / 365).toFixed(1)} ans`;
};

/* ── Known entity labels ── */
const KNOWN = {
  "0xd8da6bf26964af9d7eed9e03e53415d37aa96045": "Vitalik Buterin",
  "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be": "Binance Hot 1",
  "0x28c6c06298d514db089934071355e5743bf21d60": "Binance 14",
  "0x21a31ee1afc51d94c2efccaa2092ad1028285549": "Binance 15",
  "0xbe0eb53f46cd790cd13851d5eff43d12404d33e8": "Binance Cold",
  "0x00000000219ab540356cbb839cbe05303d7705fa": "ETH2 Deposit",
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "WETH",
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": "Uniswap V2 Router",
  "0xe592427a0aece92de3edee1f18e0157c05861564": "Uniswap V3 Router",
  "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": "Uniswap V3 Router2",
  "0x1111111254fb6c44bac0bed2854e76f90643097d": "1inch Router",
  "0xdef1c0ded9bec7f1a1670819833240f027b25eff": "0x Exchange",
  "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f": "SushiSwap Router",
  "0x881d40237659c251811cec9c364ef91dc08d300c": "MetaMask Router",
  "0xba12222222228d8ba445958a75a0704d566bf2c8": "Balancer Vault",
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDC",
  "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",
  "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",
  "0x722122df12d4e14e13ac3b6895a86e84145b6967": "⚠ Tornado Cash",
  "0xdd4c48c0b24039969fc16d1cdf626eab821d3384": "⚠ Tornado Cash",
  "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b": "⚠ Tornado Cash",
};
const MIXERS = new Set([
  "0x722122df12d4e14e13ac3b6895a86e84145b6967",
  "0xdd4c48c0b24039969fc16d1cdf626eab821d3384",
  "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b",
]);
const BLACKLIST = new Set([
  "0x8576acc5c05d6ce88f4e49bf65bdf0c62f91353c",
  "0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b",
]);
const getLabel = (a) => KNOWN[a?.toLowerCase()] ?? null;

/* ═══════════════════════════════════════════════════════════════════════════
   ETHERSCAN FETCHERS
═══════════════════════════════════════════════════════════════════════════ */
// ── Proxy Netlify Function — aucune clé exposée côté client
// En dev local : appels directs Etherscan (pas de proxy)
const IS_DEV = typeof window !== "undefined" && window.location.hostname === "localhost";

function esProxy(params) {
  if (IS_DEV) {
    // Dev local : appel direct (nécessite clé dans champ API KEY)
    const key = (() => { try { return import.meta.env.VITE_ETHERSCAN_KEY || _devKey; } catch { return _devKey; } })();
    return `https://api.etherscan.io/api?${params}&apikey=${key}`;
  }
  // Production Netlify : proxy serverless (clé côté serveur)
  return `/api/etherscan?${params}`;
}

let _devKey = ""; // clé locale pour dev uniquement

async function safeJson(url, fallback = null) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (j.status === "0") {
      const msg = ((j.message || "") + " " + (j.result || "")).toLowerCase();
      console.warn("[Etherscan]", j.message, j.result);
      if (msg.includes("no transactions") || msg.includes("no records")) return [];
      return fallback;
    }
    return j.status === "1" ? j.result : fallback;
  } catch (e) {
    console.warn("[safeJson]", e.message);
    return fallback;
  }
}

const esParams = (mod, action, addr, extra = "") =>
  `module=${mod}&action=${action}&address=${addr}${extra}`;

const fetchBalance    = (a) => safeJson(esProxy(esParams("account","balance",a,"&tag=latest")), "0").then(r => r ? weiToEth(r) : 0);
const fetchTxList     = (a) => safeJson(esProxy(esParams("account","txlist",a,"&startblock=0&endblock=99999999&page=1&offset=500&sort=desc")), []).then(r => Array.isArray(r) ? r : []);
const fetchTokenTx    = (a) => safeJson(esProxy(esParams("account","tokentx",a,"&startblock=0&endblock=99999999&page=1&offset=200&sort=desc")), []).then(r => Array.isArray(r) ? r : []);
const fetchNFTTx      = (a) => safeJson(esProxy(esParams("account","tokennfttx",a,"&startblock=0&endblock=99999999&page=1&offset=100&sort=desc")), []).then(r => Array.isArray(r) ? r : []);
const fetchIsContract = (a) => safeJson(esProxy(esParams("contract","getabi",a)), null).then(r => !!r);
const fetchEthPrice   = ()  => safeJson(esProxy("module=stats&action=ethprice"), null).then(r => r ? Number(r.ethusd) : 0);

/* ═══════════════════════════════════════════════════════════════════════════
   GRAPH BUILDER
═══════════════════════════════════════════════════════════════════════════ */
function buildGraph(center, txList) {
  const ca = center.toLowerCase();
  const nodes = new Map();
  const links = new Map();

  const node = (addr) => {
    const a = addr.toLowerCase();
    if (!nodes.has(a)) nodes.set(a, { id:a, txCount:0, volume:0, sent:0, received:0,
      label:getLabel(a), isMixer:MIXERS.has(a), isBlacklisted:BLACKLIST.has(a) });
    return nodes.get(a);
  };

  node(ca);

  for (const tx of txList) {
    const from = tx.from?.toLowerCase();
    const to   = tx.to?.toLowerCase();
    if (!from || !to) continue;
    const val = weiToEth(tx.value || 0);

    node(from); node(to);
    const other = from === ca ? to : from;
    const n = nodes.get(other);
    n.txCount++;
    n.volume += val;
    if (from === ca) n.sent += val; else n.received += val;

    const key = [from, to].sort().join("|");
    if (!links.has(key)) links.set(key, { source:from, target:to, count:0, volume:0 });
    links.get(key).count++;
    links.get(key).volume += val;
  }

  const sorted = [...nodes.values()].filter(n => n.id !== ca).sort((a,b) => b.txCount - a.txCount);
  const keep = new Set([ca, ...sorted.slice(0, 70).map(n => n.id)]);

  return {
    nodes: [...nodes.values()].filter(n => keep.has(n.id)),
    links: [...links.values()].filter(l => {
      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;
      return keep.has(s) && keep.has(t);
    }),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   ██  AUTONOMOUS ANALYSIS ENGINE  ██
   Each agent outputs findings grounded in real computed metrics.
   No output is static — every string embeds actual values.
═══════════════════════════════════════════════════════════════════════════ */

/* ── 1. Compute raw metrics from on-chain data ── */
function computeMetrics(addr, txList, tokenTx, nftTx, balance, isContract) {
  const ca = addr.toLowerCase();

  // Timestamps
  const timestamps = txList.map(t => Number(t.timeStamp)).filter(Boolean).sort((a,b) => a-b);
  const firstTs    = timestamps[0]   ?? Math.floor(Date.now()/1000);
  const lastTs     = timestamps[timestamps.length-1] ?? Math.floor(Date.now()/1000);
  const agedays    = Math.max(1, (lastTs - firstTs) / 86400);
  const daysSinceLast = (Date.now()/1000 - lastTs) / 86400;

  // Volume
  const outTx  = txList.filter(t => t.from?.toLowerCase() === ca);
  const inTx   = txList.filter(t => t.to?.toLowerCase()   === ca);
  const totalSent     = outTx.reduce((s,t) => s + weiToEth(t.value||0), 0);
  const totalReceived = inTx.reduce((s,t)  => s + weiToEth(t.value||0), 0);
  const totalVolume   = totalSent + totalReceived;

  // Counterparties
  const counterparts  = new Set(txList.flatMap(t => [t.from?.toLowerCase(), t.to?.toLowerCase()]).filter(a => a && a !== ca));
  const uniqueCount   = counterparts.size;

  // Gas
  const gasTotal = txList.reduce((s,t) => s + (Number(t.gasUsed||0) * Number(t.gasPrice||0))/1e18, 0);
  const avgGasPrice = txList.length ? txList.reduce((s,t) => s + Number(t.gasPrice||0), 0) / txList.length / 1e9 : 0;

  // Tx values
  const values       = txList.map(t => weiToEth(t.value||0)).filter(v => v > 0);
  const avgTxValue   = values.length ? values.reduce((s,v) => s+v, 0)/values.length : 0;
  const maxTxValue   = values.length ? Math.max(...values) : 0;
  const medianTxValue = values.length ? [...values].sort((a,b)=>a-b)[Math.floor(values.length/2)] : 0;

  // Errors
  const errorCount   = txList.filter(t => t.isError === "1").length;
  const errorRate    = txList.length ? errorCount / txList.length : 0;

  // Hour distribution (UTC)
  const hourDist = new Array(24).fill(0);
  for (const tx of txList) hourDist[new Date(Number(tx.timeStamp)*1000).getUTCHours()]++;
  const nightShare  = hourDist.slice(0,6).reduce((a,b)=>a+b,0) / Math.max(txList.length,1);
  const peakHour    = hourDist.indexOf(Math.max(...hourDist));

  // Inter-tx gap analysis (detect bursts)
  const outTimestamps = outTx.map(t => Number(t.timeStamp)).sort((a,b)=>a-b);
  const gaps = outTimestamps.slice(1).map((t,i) => t - outTimestamps[i]);
  const minGap = gaps.length ? Math.min(...gaps) : Infinity;
  const avgGap = gaps.length ? gaps.reduce((s,g)=>s+g,0)/gaps.length : Infinity;
  const burstCount = gaps.filter(g => g < 60).length;

  // Round-number ratio
  const roundRatio = values.length
    ? values.filter(v => v >= 0.01 && Math.abs(v - Math.round(v*10)/10) < 0.001).length / values.length
    : 0;

  // Token / NFT diversity
  const tokenSymbols  = [...new Set(tokenTx.map(t => t.tokenSymbol).filter(Boolean))];
  const nftCollections= [...new Set(nftTx.map(t => t.tokenName).filter(Boolean))];
  const dexContracts  = new Set(["0x7a250d5630b4cf539739df2c5dacb4c659f2488d","0xe592427a0aece92de3edee1f18e0157c05861564","0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45","0x1111111254fb6c44bac0bed2854e76f90643097d","0xdef1c0ded9bec7f1a1670819833240f027b25eff","0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f"]);
  const dexTxCount    = txList.filter(t => dexContracts.has(t.to?.toLowerCase())).length;

  // Mixer interactions
  const mixerTxCount  = txList.filter(t => MIXERS.has(t.to?.toLowerCase()) || MIXERS.has(t.from?.toLowerCase())).length;
  const blacklistHits = txList.filter(t => BLACKLIST.has(t.to?.toLowerCase()) || BLACKLIST.has(t.from?.toLowerCase())).length;

  // Dust attacks received
  const dustReceived  = inTx.filter(t => { const v = weiToEth(t.value||0); return v > 0 && v < 0.0001; }).length;

  // Frequency
  const txPerDay = txList.length / agedays;

  return {
    // identity
    address: ca, isContract, balance,
    // time
    firstTs, lastTs, agedays, daysSinceLast,
    firstDate: new Date(firstTs*1000).toLocaleDateString("fr-FR"),
    lastDate:  new Date(lastTs*1000).toLocaleDateString("fr-FR"),
    // volume
    txCount: txList.length, outCount: outTx.length, inCount: inTx.length,
    totalSent, totalReceived, totalVolume,
    avgTxValue, maxTxValue, medianTxValue,
    // counterparties
    uniqueCount,
    // gas
    gasTotal, avgGasPrice,
    // quality
    errorCount, errorRate,
    // timing
    hourDist, nightShare, peakHour, txPerDay,
    // bursts
    minGap, avgGap, burstCount,
    // patterns
    roundRatio,
    // defi
    tokenSymbols, tokenCount: tokenSymbols.length,
    nftCollections, nftCount: nftCollections.length,
    dexTxCount,
    // risk signals
    mixerTxCount, blacklistHits, dustReceived,
  };
}

/* ── 2. ProfilerAgent — real classification based on computed metrics ── */
function ProfilerAgent(m) {
  // Each flag is a boolean based on actual metric values
  const flags = {};

  flags.IS_CONTRACT    = m.isContract;
  flags.IS_WHALE       = !m.isContract && (m.balance > 500 || m.totalVolume > 10000);
  flags.IS_MINI_WHALE  = !m.isContract && !flags.IS_WHALE && (m.balance > 50 || m.totalVolume > 1000);
  flags.IS_EXCHANGE_LIKE = !m.isContract && m.uniqueCount > 150 && m.txCount > 300;
  flags.IS_DEFI_HEAVY  = !m.isContract && m.dexTxCount > 20 && m.tokenCount > 10;
  flags.IS_NFT_TRADER  = !m.isContract && m.nftCount > 5;
  flags.IS_HOT_WALLET  = !m.isContract && m.txPerDay > 8;
  flags.IS_BOT_LIKE    = !m.isContract && (m.burstCount > 5 || (m.nightShare > 0.4 && m.txPerDay > 3));
  flags.IS_HODLER      = !m.isContract && m.balance > 1 && m.txPerDay < 0.1 && m.outCount < 10;
  flags.IS_DORMANT     = !m.isContract && m.daysSinceLast > 365;
  flags.IS_FRESH       = !m.isContract && m.agedays < 30;
  flags.IS_RETAIL      = !m.isContract && m.balance < 0.5 && m.txCount < 30;

  // Primary profile — ordered by priority
  let profile = "Standard User";
  if (flags.IS_CONTRACT)     profile = "Smart Contract";
  else if (flags.IS_BOT_LIKE && flags.IS_HOT_WALLET) profile = "Bot / Automatisé";
  else if (flags.IS_WHALE)   profile = "Whale";
  else if (flags.IS_EXCHANGE_LIKE) profile = "Exchange / Market Maker";
  else if (flags.IS_DEFI_HEAVY && flags.IS_NFT_TRADER) profile = "DeFi & NFT Power User";
  else if (flags.IS_DEFI_HEAVY) profile = "DeFi Power User";
  else if (flags.IS_NFT_TRADER) profile = "NFT Trader";
  else if (flags.IS_MINI_WHALE) profile = "Mid-size Holder";
  else if (flags.IS_HODLER)  profile = "Long-term HODLer";
  else if (flags.IS_HOT_WALLET) profile = "Active Trader";
  else if (flags.IS_DORMANT) profile = "Wallet Dormant";
  else if (flags.IS_FRESH)   profile = "Wallet Récent";
  else if (flags.IS_RETAIL)  profile = "Utilisateur Retail";

  return { profile, flags };
}

/* ── 3. BehaviorAgent — every insight references real measured values ── */
function BehaviorAgent(m) {
  const insights = [];

  // Activity level
  if (m.txPerDay > 20) {
    insights.push({ icon:"⚡", cat:"Activité", text:`Activité extrêmement élevée : ${m.txPerDay.toFixed(1)} tx/jour en moyenne sur ${Math.round(m.agedays)} jours. Ce niveau suggère un bot ou un système automatisé.` });
  } else if (m.txPerDay > 5) {
    insights.push({ icon:"🔄", cat:"Activité", text:`Fréquence élevée : ${m.txPerDay.toFixed(1)} tx/jour — profil de trader actif ou d'arbitragiste.` });
  } else if (m.txPerDay > 1) {
    insights.push({ icon:"📊", cat:"Activité", text:`Fréquence modérée : ${m.txPerDay.toFixed(1)} tx/jour — usage régulier de l'écosystème Ethereum.` });
  } else if (m.txPerDay < 0.05) {
    insights.push({ icon:"😴", cat:"Activité", text:`Fréquence très basse : ${m.txPerDay.toFixed(3)} tx/jour — wallet peu actif ou utilisé ponctuellement.` });
  } else {
    insights.push({ icon:"📅", cat:"Activité", text:`Fréquence basse : ${m.txPerDay.toFixed(2)} tx/jour — usage occasionnel.` });
  }

  // Temporal pattern
  const peakLabel = `${m.peakHour}h-${m.peakHour+1}h UTC`;
  if (m.nightShare > 0.45) {
    insights.push({ icon:"🌙", cat:"Timing", text:`${(m.nightShare*100).toFixed(0)}% des transactions ont lieu entre 0h et 6h UTC (pic à ${peakLabel}). Forte probabilité d'automatisation ou de timezone Asie-Pacifique.` });
  } else if (m.nightShare > 0.25) {
    insights.push({ icon:"🕐", cat:"Timing", text:`Activité nocturne notable : ${(m.nightShare*100).toFixed(0)}% des tx entre 0h-6h UTC. Pic d'activité à ${peakLabel}.` });
  } else {
    insights.push({ icon:"☀️", cat:"Timing", text:`Activité principalement diurne. Pic d'activité à ${peakLabel} UTC — profil timezone Europe/Amériques probable.` });
  }

  // Burst patterns
  if (m.burstCount > 10) {
    insights.push({ icon:"💥", cat:"Comportement", text:`${m.burstCount} rafales détectées (transactions espacées de <60s). Intervalle minimum mesuré : ${m.minGap}s. Signature typique d'un script automatisé ou bot MEV.` });
  } else if (m.burstCount > 2) {
    insights.push({ icon:"⚡", cat:"Comportement", text:`${m.burstCount} micro-rafales détectées (<60s entre tx). Peut indiquer des sessions DeFi intensives ou un bot partiel.` });
  }

  // Flow direction
  const ratio = m.totalSent / Math.max(m.totalReceived, 0.0001);
  if (ratio > 10) {
    insights.push({ icon:"📤", cat:"Flux", text:`Émetteur net très fort : ${fmt(m.totalSent)} ETH envoyés vs ${fmt(m.totalReceived)} ETH reçus (ratio ${ratio.toFixed(1)}x). Rôle distributeur — potentiellement un hot wallet ou exchange.` });
  } else if (ratio > 3) {
    insights.push({ icon:"📤", cat:"Flux", text:`Émetteur dominant : ${fmt(m.totalSent)} ETH envoyés vs ${fmt(m.totalReceived)} ETH reçus.` });
  } else if (ratio < 0.1) {
    insights.push({ icon:"📥", cat:"Flux", text:`Accumulateur net : ${fmt(m.totalReceived)} ETH reçus vs ${fmt(m.totalSent)} ETH envoyés (ratio ${(1/ratio).toFixed(1)}x). Comportement d'accumulation ou wallet de réception.` });
  } else if (ratio < 0.5) {
    insights.push({ icon:"📥", cat:"Flux", text:`Récepteur dominant : flux entrant significativement supérieur au flux sortant (${fmt(m.totalReceived)} ETH in vs ${fmt(m.totalSent)} ETH out).` });
  } else {
    insights.push({ icon:"↔️", cat:"Flux", text:`Flux équilibré : ${fmt(m.totalSent)} ETH envoyés / ${fmt(m.totalReceived)} ETH reçus. Ratio in/out : ${ratio.toFixed(2)}.` });
  }

  // Transaction value profile
  if (m.avgTxValue > 50) {
    insights.push({ icon:"💰", cat:"Taille", text:`Transactions de très grande taille : moyenne ${fmt(m.avgTxValue)} ETH, médiane ${fmt(m.medianTxValue)} ETH, maximum ${fmt(m.maxTxValue)} ETH.` });
  } else if (m.avgTxValue > 5) {
    insights.push({ icon:"💎", cat:"Taille", text:`Transactions de taille significative : moyenne ${fmt(m.avgTxValue)} ETH/tx, max ${fmt(m.maxTxValue)} ETH.` });
  } else if (m.avgTxValue < 0.005 && m.avgTxValue > 0) {
    insights.push({ icon:"🪙", cat:"Taille", text:`Micro-transactions dominantes : moyenne ${fmt(m.avgTxValue,5)} ETH/tx. Souvent associé à des interactions de contrats DeFi ou des bots d'arbitrage.` });
  } else if (m.avgTxValue > 0) {
    insights.push({ icon:"📦", cat:"Taille", text:`Taille de transaction standard : moyenne ${fmt(m.avgTxValue)} ETH/tx, médiane ${fmt(m.medianTxValue)} ETH.` });
  }

  // Round number pattern
  if (m.roundRatio > 0.5) {
    insights.push({ icon:"🎯", cat:"Pattern", text:`${(m.roundRatio*100).toFixed(0)}% des transactions ont des montants arrondis (ex: 0.1, 0.5, 1.0 ETH). Peut indiquer des paiements OTC, des dépôts programmés ou du wash trading.` });
  }

  // Error rate
  if (m.errorRate > 0.15) {
    insights.push({ icon:"❌", cat:"Qualité", text:`Taux d'échec élevé : ${(m.errorRate*100).toFixed(1)}% des transactions ont échoué (${m.errorCount}/${m.txCount}). Peut indiquer des conditions de marché difficiles, des contrats mal gérés, ou des tentatives de front-running échouées.` });
  } else if (m.errorRate === 0 && m.txCount > 50) {
    insights.push({ icon:"🤖", cat:"Qualité", text:`Taux d'échec nul sur ${m.txCount} transactions. Précision atypique pour un humain — signature possible d'un bot avec simulation pre-tx.` });
  } else if (m.txCount > 0) {
    insights.push({ icon:"✅", cat:"Qualité", text:`Taux d'échec normal : ${(m.errorRate*100).toFixed(1)}% (${m.errorCount} erreur(s) sur ${m.txCount} tx).` });
  }

  // DeFi usage
  if (m.dexTxCount > 50) {
    insights.push({ icon:"🦄", cat:"DeFi", text:`Usage DeFi intensif : ${m.dexTxCount} interactions avec des DEX (Uniswap, 1inch, SushiSwap…) sur ${m.txCount} tx totales (${(m.dexTxCount/m.txCount*100).toFixed(0)}%).` });
  } else if (m.dexTxCount > 10) {
    insights.push({ icon:"🔁", cat:"DeFi", text:`Usage DeFi régulier : ${m.dexTxCount} interactions DEX détectées.` });
  } else if (m.dexTxCount > 0) {
    insights.push({ icon:"🌱", cat:"DeFi", text:`Usage DeFi occasionnel : ${m.dexTxCount} interactions DEX.` });
  }

  // Counterparty breadth
  if (m.uniqueCount > 500) {
    insights.push({ icon:"🌐", cat:"Réseau", text:`Réseau de contreparties très large : ${m.uniqueCount} adresses uniques. Profil service/exchange ou très actif en DeFi.` });
  } else if (m.uniqueCount > 100) {
    insights.push({ icon:"🕸️", cat:"Réseau", text:`Large réseau : ${m.uniqueCount} contreparties uniques sur la période analysée.` });
  } else if (m.uniqueCount < 5 && m.txCount > 20) {
    insights.push({ icon:"🔒", cat:"Réseau", text:`Réseau très restreint : seulement ${m.uniqueCount} contreparties uniques pour ${m.txCount} transactions. Pattern de cycling entre adresses contrôlées possible.` });
  } else {
    insights.push({ icon:"👥", cat:"Réseau", text:`${m.uniqueCount} contreparties uniques identifiées.` });
  }

  // Gas behavior
  if (m.avgGasPrice > 100) {
    insights.push({ icon:"⛽", cat:"Gas", text:`Gas price moyen très élevé : ${m.avgGasPrice.toFixed(0)} Gwei. Indique une priorité de confirmation élevée, typique des bots MEV ou arbitragistes.` });
  } else if (m.avgGasPrice > 30) {
    insights.push({ icon:"⛽", cat:"Gas", text:`Gas price modéré : ${m.avgGasPrice.toFixed(0)} Gwei en moyenne. Gas total consommé : ${fmt(m.gasTotal,4)} ETH.` });
  } else if (m.avgGasPrice > 0) {
    insights.push({ icon:"💚", cat:"Gas", text:`Gas price économe : ${m.avgGasPrice.toFixed(1)} Gwei en moyenne. Gas total : ${fmt(m.gasTotal,4)} ETH.` });
  }

  return insights;
}

/* ── 4. RiskAgent — each risk is quantified and specific ── */
function RiskAgent(m) {
  const risks = [];
  let riskScore = 0;

  // Mixer contact
  if (m.mixerTxCount > 0) {
    const severity = m.mixerTxCount > 5 ? "CRITICAL" : "HIGH";
    risks.push({ level: severity, msg: `${m.mixerTxCount} transaction(s) avec Tornado Cash ou protocoles de mixing identifiés.` });
    riskScore += m.mixerTxCount > 5 ? 45 : 30;
  }

  // Blacklist
  if (m.blacklistHits > 0) {
    risks.push({ level: "CRITICAL", msg: `Contact avec ${m.blacklistHits} adresse(s) blacklistée(s) (sanctions OFAC / scam connu).` });
    riskScore += 40;
  }

  // Fresh wallet high volume
  if (m.agedays < 14 && m.totalVolume > 10) {
    risks.push({ level: "HIGH", msg: `Wallet créé il y a seulement ${Math.round(m.agedays)} jours mais volume déjà élevé : ${fmt(m.totalVolume)} ETH. Signal d'alerte fréquent dans les schémas de fraude.` });
    riskScore += 25;
  } else if (m.agedays < 30 && m.totalVolume > 50) {
    risks.push({ level: "MEDIUM", msg: `Wallet jeune (${Math.round(m.agedays)} jours) avec volume important (${fmt(m.totalVolume)} ETH).` });
    riskScore += 15;
  }

  // Cycling pattern
  if (m.txCount > 30 && m.uniqueCount <= 3) {
    risks.push({ level: "HIGH", msg: `Pattern de cycling détecté : ${m.txCount} transactions entre seulement ${m.uniqueCount} adresses. Schéma possible de wash trading ou self-dealing.` });
    riskScore += 30;
  } else if (m.txCount > 20 && m.uniqueCount <= 5) {
    risks.push({ level: "MEDIUM", msg: `Peu de contreparties uniques (${m.uniqueCount}) pour ${m.txCount} transactions — cycling partiel possible.` });
    riskScore += 15;
  }

  // Dust attacks
  if (m.dustReceived >= 5) {
    risks.push({ level: "MEDIUM", msg: `${m.dustReceived} dust transactions reçues (<0.0001 ETH). Ce wallet est ciblé par des attaques de tracking ou de poisoning.` });
    riskScore += 12;
  } else if (m.dustReceived > 0) {
    risks.push({ level: "LOW", msg: `${m.dustReceived} dust transaction(s) reçue(s) — tentative de tracking possible.` });
    riskScore += 5;
  }

  // Bot-like with zero errors
  if (m.errorRate === 0 && m.txCount > 100 && m.burstCount > 10) {
    risks.push({ level: "MEDIUM", msg: `Combinaison anormale : 0% d'erreur sur ${m.txCount} tx + ${m.burstCount} bursts détectés. Signature probable d'un bot avec simulation pre-transaction.` });
    riskScore += 10;
  }

  // Very high gas — MEV suspicion
  if (m.avgGasPrice > 200 && m.txPerDay > 10) {
    risks.push({ level: "LOW", msg: `Gas price très élevé (${m.avgGasPrice.toFixed(0)} Gwei moy.) combiné à haute fréquence — possible activité MEV (frontrunning/sandwich).` });
    riskScore += 8;
  }

  // Very high error rate
  if (m.errorRate > 0.3 && m.txCount > 10) {
    risks.push({ level: "LOW", msg: `Taux d'échec élevé : ${(m.errorRate*100).toFixed(0)}% des transactions ont échoué — interactions risquées avec des contrats non-audités possible.` });
    riskScore += 6;
  }

  if (risks.length === 0) {
    risks.push({ level: "SAFE", msg: "Aucun signal de risque majeur détecté sur la période analysée." });
  }

  return { risks, riskScore: Math.min(riskScore, 100) };
}

/* ── 5. ScoreEngine — weighted combination of all signals ── */
function ScoreEngine(m, pFlags, riskScore) {
  let score = 50;

  // Age bonus
  if (m.agedays > 1460) score += 18;
  else if (m.agedays > 730)  score += 12;
  else if (m.agedays > 180)  score += 6;
  else if (m.agedays < 14)   score -= 18;
  else if (m.agedays < 30)   score -= 10;

  // Activity
  if (m.txCount > 500) score += 10;
  else if (m.txCount > 100) score += 6;
  else if (m.txCount > 20)  score += 3;
  else if (m.txCount < 3)   score -= 8;

  // Ecosystem participation
  if (m.tokenCount > 15) score += 8;
  else if (m.tokenCount > 5) score += 4;
  if (m.dexTxCount > 20) score += 6;
  if (m.uniqueCount > 100) score += 8;
  else if (m.uniqueCount > 20) score += 4;

  // Balance
  if (m.balance > 100) score += 10;
  else if (m.balance > 10) score += 6;
  else if (m.balance > 1)  score += 3;
  else if (m.balance < 0.001) score -= 5;

  // Profile-specific
  if (pFlags.IS_DEFI_HEAVY) score += 6;
  if (pFlags.IS_WHALE || pFlags.IS_MINI_WHALE) score += 5;
  if (pFlags.IS_BOT_LIKE) score -= 8;
  if (pFlags.IS_DORMANT)  score -= 6;
  if (pFlags.IS_FRESH)    score -= 10;

  // Risk deduction
  score -= riskScore * 0.65;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/* ── 6. NarrativeGenerator — fully data-driven summary ── */
function NarrativeGenerator(m, profile, riskResult, trustScore) {
  const riskLabel  = riskResult.riskScore > 60 ? "élevé 🔴" : riskResult.riskScore > 30 ? "modéré 🟡" : "faible 🟢";
  const activeStr  = m.agedays > 1 ? `depuis le ${m.firstDate} (${Math.round(m.agedays)} jours)` : "depuis très récemment";
  const lastStr    = `dernière activité : ${ago(m.lastTs)}`;
  const volStr     = m.totalVolume > 0 ? `Volume on-chain total : ${fmt(m.totalVolume)} ETH (${fmt(m.totalSent)} envoyés / ${fmt(m.totalReceived)} reçus).` : "Aucun volume ETH détecté (interactions contractuelles uniquement ou wallet vide).";
  const diversStr  = m.tokenCount > 0 || m.nftCount > 0
    ? `Le wallet a interagi avec ${m.tokenCount} token(s) ERC-20 et ${m.nftCount} collection(s) NFT distincte(s).`
    : "Aucune interaction ERC-20 ni NFT détectée.";
  const gasStr     = m.gasTotal > 0 ? `Gas total consommé : ${fmt(m.gasTotal, 4)} ETH.` : "";

  return `Profil identifié : ${profile}. Ce wallet est actif ${activeStr} (${lastStr}). ` +
    `Il totalise ${fmtK(m.txCount)} transaction(s) avec ${m.uniqueCount} contrepartie(s) unique(s). ` +
    `${volStr} ${diversStr} ${gasStr} ` +
    `Risque global : ${riskLabel} (score ${riskResult.riskScore}/100). Score de confiance : ${trustScore}/100.`;
}

/* ── Orchestrateur ── */
async function runAnalysis(addr, txList, tokenTx, nftTx, balance, isContract, graphData) {
  const m         = computeMetrics(addr, txList, tokenTx, nftTx, balance, isContract);
  const { profile, flags } = ProfilerAgent(m);
  const behaviors = BehaviorAgent(m);
  const riskResult= RiskAgent(m);
  const trustScore= ScoreEngine(m, flags, riskResult.riskScore);
  const narrative = NarrativeGenerator(m, profile, riskResult, trustScore);
  return { m, profile, flags, behaviors, riskResult, trustScore, narrative };
}

/* ═══════════════════════════════════════════════════════════════════════════
   D3 FORCE GRAPH
═══════════════════════════════════════════════════════════════════════════ */
function nodeColor(d, ca) {
  if (d.id === ca)        return "#00ffe0";
  if (d.isMixer)          return "#ef4444";
  if (d.isBlacklisted)    return "#f97316";
  if (d.label?.startsWith("⚠")) return "#ef4444";
  if (d.label)            return "#fbbf24";
  if (d.volume > 50)      return "#fb923c";
  if (d.txCount > 20)     return "#a78bfa";
  return "#60a5fa";
}
const nodeR = (d, ca) => d.id === ca ? 22 : Math.max(6, Math.min(16, 5 + Math.log2(d.txCount + 2) * 3));

function ForceGraph({ graphData, centerAddr, onNodeClick }) {
  const svgRef = useRef(null);
  const simRef = useRef(null);
  const ca = centerAddr.toLowerCase();

  useEffect(() => {
    if (!graphData?.nodes?.length || !svgRef.current) return;
    const el = svgRef.current;
    const W = el.clientWidth || 860, H = el.clientHeight || 520;
    d3.select(el).selectAll("*").remove();

    const svg = d3.select(el).attr("viewBox", `0 0 ${W} ${H}`)
      .call(d3.zoom().scaleExtent([0.15, 6]).on("zoom", e => g.attr("transform", e.transform)));

    const defs = svg.append("defs");
    const flt = defs.append("filter").attr("id","glow");
    flt.append("feGaussianBlur").attr("stdDeviation","3.5").attr("result","blur");
    const fm = flt.append("feMerge");
    fm.append("feMergeNode").attr("in","blur");
    fm.append("feMergeNode").attr("in","SourceGraphic");

    const g = svg.append("g");

    const link = g.append("g").selectAll("line").data(graphData.links).join("line")
      .attr("stroke","#162840").attr("stroke-opacity",0.8)
      .attr("stroke-width", d => Math.max(0.5, Math.log(d.count+1)*1.6));

    const node = g.append("g").selectAll("g").data(graphData.nodes).join("g")
      .attr("cursor","pointer").on("click",(_,d)=>onNodeClick(d))
      .call(d3.drag()
        .on("start",(e,d)=>{if(!e.active)simRef.current.alphaTarget(0.3).restart();d.fx=d.x;d.fy=d.y;})
        .on("drag",(e,d)=>{d.fx=e.x;d.fy=e.y;})
        .on("end",(e,d)=>{if(!e.active)simRef.current.alphaTarget(0);d.fx=null;d.fy=null;}));

    // center halo
    node.filter(d=>d.id===ca).append("circle")
      .attr("r",34).attr("fill","none").attr("stroke","#00ffe0").attr("stroke-opacity",0.18).attr("stroke-width",1.5)
      .style("animation","halo 2.5s ease-in-out infinite");

    node.append("circle")
      .attr("r", d=>nodeR(d,ca))
      .attr("fill", d=>`${nodeColor(d,ca)}20`)
      .attr("stroke", d=>nodeColor(d,ca))
      .attr("stroke-width", d=>d.id===ca?2.5:1.5)
      .attr("filter","url(#glow)");

    node.append("text").attr("text-anchor","middle").attr("dy","0.35em")
      .attr("fill","#94a3b8").attr("font-size",d=>d.id===ca?"9.5px":"7px")
      .attr("font-family","'Space Mono',monospace").attr("pointer-events","none")
      .text(d => d.label || shortAddr(d.id));

    simRef.current = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links).id(d=>d.id).distance(85).strength(0.35))
      .force("charge", d3.forceManyBody().strength(-240))
      .force("center", d3.forceCenter(W/2, H/2))
      .force("collision", d3.forceCollide(d=>nodeR(d,ca)+9))
      .on("tick",()=>{
        link.attr("x1",d=>d.source.x).attr("y1",d=>d.source.y)
            .attr("x2",d=>d.target.x).attr("y2",d=>d.target.y);
        node.attr("transform",d=>`translate(${d.x||0},${d.y||0})`);
      });

    return ()=>simRef.current?.stop();
  }, [graphData, ca]);

  return (
    <svg ref={svgRef} style={{width:"100%",height:"100%"}}>
      <style>{`@keyframes halo{0%,100%{r:34;opacity:0.18}50%{r:42;opacity:0.07}}`}</style>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   UI PRIMITIVES
═══════════════════════════════════════════════════════════════════════════ */
const RC = { CRITICAL:"#ef4444", HIGH:"#f97316", MEDIUM:"#eab308", LOW:"#84cc16", SAFE:"#22c55e" };
const RB = { CRITICAL:"#ef444412", HIGH:"#f9731612", MEDIUM:"#eab30812", LOW:"#84cc1612", SAFE:"#22c55e12" };

const Pill = ({ text, color="#00ffe0" }) => (
  <span style={{ display:"inline-block", padding:"2px 9px", borderRadius:99,
    border:`1px solid ${color}50`, background:`${color}14`,
    color, fontSize:10, fontFamily:"'Space Mono',monospace", whiteSpace:"nowrap" }}>
    {text}
  </span>
);

const StatCard = ({ label, value, sub, accent="#00ffe0" }) => (
  <div style={{ background:"rgba(5,11,22,0.9)", border:`1px solid ${accent}18`, borderRadius:10, padding:"12px 15px" }}>
    <div style={{ color:"#2a4060", fontSize:9, textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:5 }}>{label}</div>
    <div style={{ color:accent, fontSize:18, fontWeight:700, fontFamily:"'Space Mono',monospace", lineHeight:1 }}>{value}</div>
    {sub && <div style={{ color:"#1e3a5f", fontSize:10, marginTop:4 }}>{sub}</div>}
  </div>
);

const ScoreRing = ({ score }) => {
  const r=42, c=2*Math.PI*r, col=score>70?"#22c55e":score>40?"#eab308":"#ef4444";
  return (
    <div style={{ position:"relative", width:116, height:116 }}>
      <svg width={116} height={116} viewBox="0 0 116 116">
        <circle cx={58} cy={58} r={r} fill="none" stroke="#0c1e38" strokeWidth={9}/>
        <circle cx={58} cy={58} r={r} fill="none" stroke={col} strokeWidth={9}
          strokeDasharray={`${c*score/100} ${c}`} strokeLinecap="round"
          transform="rotate(-90 58 58)"/>
      </svg>
      <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
        <span style={{ color:col,fontSize:28,fontWeight:700,fontFamily:"'Space Mono',monospace" }}>{score}</span>
        <span style={{ color:"#2a4060",fontSize:9 }}>/ 100</span>
      </div>
    </div>
  );
};

const NodePanel = ({ node, onClose }) => {
  if (!node) return null;
  return (
    <div style={{ position:"absolute",top:10,right:10,width:255,background:"rgba(3,8,18,0.98)",
      border:"1px solid #00ffe025",borderRadius:12,padding:16,backdropFilter:"blur(20px)",zIndex:20 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
        <span style={{ color:"#00ffe0",fontSize:9,letterSpacing:"0.14em",fontFamily:"'Space Mono',monospace" }}>NODE</span>
        <button onClick={onClose} style={{ background:"none",border:"none",color:"#334155",cursor:"pointer",fontSize:18,lineHeight:1 }}>×</button>
      </div>
      {node.label && <div style={{ color:"#fbbf24",fontSize:13,fontWeight:600,marginBottom:6 }}>{node.label}</div>}
      {(node.isMixer||node.isBlacklisted) && (
        <div style={{ background:"#ef444412",border:"1px solid #ef444435",borderRadius:6,padding:"6px 10px",color:"#ef4444",fontSize:11,marginBottom:8 }}>
          {node.isMixer?"🌀 Protocole de mixing":"⛔ Adresse blacklistée"}
        </div>
      )}
      <div style={{ color:"#1e3a5f",fontSize:10,fontFamily:"'Space Mono',monospace",wordBreak:"break-all",marginBottom:12 }}>{node.id}</div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
        {[["Tx","txCount","#60a5fa"],["Volume",`${fmt(node.volume)} ETH`,"#e2e8f0"],["Envoyé",`${fmt(node.sent)} ETH`,"#fb923c"],["Reçu",`${fmt(node.received)} ETH`,"#34d399"]].map(([l,v,c])=>(
          <div key={l}><div style={{ color:"#2a4060",fontSize:9 }}>{l}</div>
          <div style={{ color:c,fontFamily:"'Space Mono',monospace",fontSize:12 }}>{typeof v==="string"?v:node[v]}</div></div>
        ))}
      </div>
      <a href={`https://etherscan.io/address/${node.id}`} target="_blank" rel="noreferrer"
        style={{ display:"block",marginTop:14,textAlign:"center",color:"#3b6eaa",fontSize:11,textDecoration:"none",border:"1px solid #1e3a5f",borderRadius:7,padding:"7px 0" }}>
        Etherscan ↗
      </a>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════════════════ */
const TABS = ["Graphe","Métriques","Analyse IA","Tokens / NFT"];

export default function App() {
  const [addr,      setAddr]      = useState("");
  const [apiKey,    setApiKey]    = useState(""); // utilisé uniquement en dev local
  const [loading,   setLoading]   = useState(false);
  const [step,      setStep]      = useState("");
  const [error,     setError]     = useState("");
  const [result,    setResult]    = useState(null);
  const [graph,     setGraph]     = useState(null);
  const [ethPrice,  setEthPrice]  = useState(0);
  const [tab,       setTab]       = useState("Graphe");
  const [selNode,   setSelNode]   = useState(null);
  const [showKey,   setShowKey]   = useState(false);

  const analyze = useCallback(async () => {
    const address = addr.trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) { setError("Adresse Ethereum invalide."); return; }
    // En dev local, la clé du champ est utilisée directement
    _devKey = apiKey.trim();
    setError(""); setLoading(true); setResult(null); setGraph(null); setSelNode(null);
    try {
      setStep("Solde & prix ETH…");
      const [balance, price] = await Promise.all([fetchBalance(address), fetchEthPrice()]);
      setEthPrice(price);

      setStep("Transactions (max 500)…");
      const txList = await fetchTxList(address);

      setStep("Tokens ERC-20…");
      const tokenTx = await fetchTokenTx(address);

      setStep("NFTs…");
      const nftTx = await fetchNFTTx(address);

      setStep("Type de compte…");
      const isContract = await fetchIsContract(address);

      setStep("Graphe de relations…");
      const g = buildGraph(address, txList);
      setGraph(g);

      // Debug log — visible dans la console du navigateur (F12)
      console.info("[ChainLens] Données reçues:", {
        balance: balance.toFixed(4) + " ETH",
        txCount: txList.length,
        tokenTx: tokenTx.length,
        nftTx: nftTx.length,
        isContract,
        graphNodes: g.nodes.length,
      });

      console.info("[ChainLens] Données reçues:", {
        balance, txCount: txList.length, tokenTx: tokenTx.length, nftTx: nftTx.length, isContract
      });

      if (txList.length === 0 && balance === 0 && tokenTx.length === 0) {
        setError("⚠ Aucune donnée reçue. Causes possibles : (1) La variable ETHERSCAN_KEY n'est pas définie dans Netlify > Environment variables — vérifiez le nom exact. (2) Wallet réellement vide. Ouvrez F12 > Console pour voir les logs détaillés.");
        setLoading(false); setStep(""); return;
      }

      setStep("Analyse des agents…");
      const r = await runAnalysis(address, txList, tokenTx, nftTx, balance, isContract, g);
      setResult(r);
      setTab("Graphe");
    } catch(e) {
      console.error("[ChainLens] Erreur analyze:", e);
      setError("Erreur : " + e.message);
    } finally { setLoading(false); setStep(""); }
  }, [addr, apiKey]);

  const m = result?.m;
  const usd = m && ethPrice ? `≈ $${(m.balance * ethPrice).toLocaleString("fr-FR", {maximumFractionDigits:0})}` : null;

  return (
    <div style={{ minHeight:"100vh", background:"#030912", color:"#e2e8f0", fontFamily:"'Syne',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;background:#030912}
        ::-webkit-scrollbar-thumb{background:#1a3050;border-radius:2px}
        input,button,a{font-family:inherit}input{outline:none}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes appear{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      `}</style>

      {/* bg grid */}
      <div style={{ position:"fixed",inset:0,backgroundImage:"linear-gradient(#08203a 1px,transparent 1px),linear-gradient(90deg,#08203a 1px,transparent 1px)",backgroundSize:"60px 60px",opacity:0.22,pointerEvents:"none" }}/>

      {/* Header */}
      <header style={{ position:"sticky",top:0,zIndex:50,background:"rgba(3,9,18,0.97)",backdropFilter:"blur(16px)",borderBottom:"1px solid #0c2040",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:36,height:36,borderRadius:8,background:"linear-gradient(135deg,#00ffe0,#0055ff)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:18,color:"#030912",fontFamily:"'Space Mono',monospace" }}>⬡</div>
          <div>
            <div style={{ fontWeight:800,fontSize:18,letterSpacing:"-0.02em" }}>CHAIN<span style={{ color:"#00ffe0" }}>LENS</span></div>
            <div style={{ color:"#0c2040",fontSize:9,letterSpacing:"0.2em",marginTop:1 }}>ON-CHAIN INTELLIGENCE · AUTONOMOUS ENGINE</div>
          </div>
        </div>
        <button onClick={()=>setShowKey(v=>!v)} style={{ background:"transparent",border:"1px solid #1a3050",borderRadius:8,color:"#2a4060",padding:"6px 14px",cursor:"pointer",fontSize:11,letterSpacing:"0.05em" }}>
          ⚙ API KEY
        </button>
      </header>

      {showKey && (
        <div style={{ background:"#05101f",borderBottom:"1px solid #0c2040",padding:"12px 24px",display:"flex",gap:12,alignItems:"center" }}>
          <span style={{ color:"#2a4060",fontSize:10,whiteSpace:"nowrap" }}>
            {typeof window !== "undefined" && window.location.hostname === "localhost" ? "Clé Etherscan (dev local)" : "Clé gérée côté serveur (Netlify)"}
          </span>
          {typeof window !== "undefined" && window.location.hostname === "localhost"
            ? <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)}
                style={{ flex:1,background:"#030912",border:"1px solid #1a3050",borderRadius:7,padding:"7px 12px",color:"#00ffe0",fontSize:11,fontFamily:"'Space Mono',monospace" }}
                placeholder="Clé Etherscan pour dev local…"/>
            : <span style={{ color:"#22c55e",fontSize:11,fontFamily:"'Space Mono',monospace" }}>✓ ETHERSCAN_KEY injectée via variable d'environnement Netlify</span>
          }
          <a href="https://etherscan.io/apis" target="_blank" rel="noreferrer" style={{ color:"#1a3050",fontSize:10,textDecoration:"none",whiteSpace:"nowrap" }}>Clé gratuite ↗</a>
        </div>
      )}

      {/* Search */}
      <div style={{ padding:"24px 24px 14px",maxWidth:960,margin:"0 auto" }}>
        <div style={{ display:"flex",gap:10 }}>
          <div style={{ flex:1,position:"relative" }}>
            <span style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#1a3050",pointerEvents:"none" }}>⬡</span>
            <input value={addr} onChange={e=>setAddr(e.target.value)} onKeyDown={e=>e.key==="Enter"&&analyze()}
              placeholder="Adresse Ethereum — 0x…"
              style={{ width:"100%",background:"rgba(5,11,22,0.95)",border:"1px solid #1a3050",borderRadius:10,padding:"13px 14px 13px 40px",color:"#e2e8f0",fontSize:14,fontFamily:"'Space Mono',monospace",letterSpacing:"0.02em" }}/>
          </div>
          <button onClick={analyze} disabled={loading}
            style={{ padding:"13px 28px",background:loading?"#0c2040":"linear-gradient(135deg,#00ffe0,#0066ff)",border:"none",borderRadius:10,color:loading?"#2a4060":"#030912",fontWeight:800,fontSize:13,cursor:loading?"not-allowed":"pointer",letterSpacing:"0.05em",whiteSpace:"nowrap",transition:"all 0.2s" }}>
            {loading?"ANALYSE…":"ANALYSER →"}
          </button>
        </div>
        {loading && (
          <div style={{ marginTop:12,display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:13,height:13,border:"2px solid #00ffe0",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",flexShrink:0 }}/>
            <span style={{ color:"#2a4060",fontSize:11 }}>{step}</span>
          </div>
        )}
        {error && <div style={{ marginTop:10,color:"#ef4444",fontSize:12,padding:"9px 14px",background:"#ef444410",border:"1px solid #ef444425",borderRadius:8 }}>{error}</div>}
        {/* Indicateur statut proxy */}
        {!loading && !result && (
          <div style={{ marginTop:10,display:"flex",alignItems:"center",gap:8,fontSize:10,fontFamily:"'Space Mono',monospace" }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:"#22c55e",flexShrink:0 }}/>
            <span style={{ color:"#22c55e" }}>Proxy Netlify actif — clé sécurisée côté serveur</span>
          </div>
        )}
      </div>

      {/* Results */}
      {result && graph && (
        <div style={{ padding:"0 24px 48px",maxWidth:1440,margin:"0 auto",animation:"appear 0.35s ease" }}>

          {/* Profile header */}
          <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap" }}>
            <code style={{ color:"#00ffe0",fontFamily:"'Space Mono',monospace",fontSize:12 }}>{addr}</code>
            <Pill text={result.profile} color="#00ffe0"/>
            {m.isContract && <Pill text="Smart Contract" color="#a78bfa"/>}
            {result.flags.IS_BOT_LIKE && <Pill text="BOT PROBABLE" color="#f97316"/>}
            {result.flags.IS_WHALE && <Pill text="WHALE" color="#fbbf24"/>}
            {result.flags.IS_DEFI_HEAVY && <Pill text="DeFi Heavy" color="#34d399"/>}
            {result.flags.IS_NFT_TRADER && <Pill text="NFT Trader" color="#e879f9"/>}
            {result.riskResult.riskScore > 30 && <Pill text={`RISK ${result.riskResult.riskScore}/100`} color="#ef4444"/>}
            <a href={`https://etherscan.io/address/${addr}`} target="_blank" rel="noreferrer"
              style={{ color:"#2a4060",fontSize:11,textDecoration:"none" }}>↗ Etherscan</a>
          </div>

          {/* Stats */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(145px,1fr))",gap:8,marginBottom:16 }}>
            <StatCard label="Solde ETH"     value={fmt(m.balance,3)}         sub={usd}                         accent="#00ffe0"/>
            <StatCard label="Transactions"  value={fmtK(m.txCount)}           sub={`~${m.txPerDay.toFixed(1)}/jour`} accent="#60a5fa"/>
            <StatCard label="Contreparties" value={m.uniqueCount}             sub="adresses uniques"            accent="#a78bfa"/>
            <StatCard label="Total envoyé"  value={`${fmt(m.totalSent,2)}`}   sub="ETH"                        accent="#fb923c"/>
            <StatCard label="Total reçu"    value={`${fmt(m.totalReceived,2)}`} sub="ETH"                      accent="#34d399"/>
            <StatCard label="Gas consommé"  value={fmt(m.gasTotal,4)}         sub={`~${m.avgGasPrice.toFixed(0)} Gwei moy.`} accent="#f59e0b"/>
            <StatCard label="Tokens ERC-20" value={m.tokenCount}              sub="distincts"                   accent="#e879f9"/>
            <StatCard label="NFT Coll."     value={m.nftCount}                sub="collections"                 accent="#38bdf8"/>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex",borderBottom:"1px solid #0c2040",marginBottom:14 }}>
            {TABS.map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                style={{ padding:"9px 18px",background:"none",border:"none",borderBottom:tab===t?"2px solid #00ffe0":"2px solid transparent",color:tab===t?"#00ffe0":"#2a4060",cursor:"pointer",fontSize:11,fontFamily:"'Space Mono',monospace",letterSpacing:"0.08em" }}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          {/* ─── TAB GRAPHE ─── */}
          {tab==="Graphe" && (
            <div style={{ position:"relative",background:"rgba(4,10,22,0.96)",border:"1px solid #0c2040",borderRadius:14,height:540,overflow:"hidden" }}>
              <ForceGraph graphData={graph} centerAddr={addr} onNodeClick={setSelNode}/>
              <NodePanel node={selNode} onClose={()=>setSelNode(null)}/>
              <div style={{ position:"absolute",bottom:12,left:14,display:"flex",gap:14,flexWrap:"wrap" }}>
                {[["#00ffe0","Wallet analysé"],["#60a5fa","EOA"],["#a78bfa","Fréquent"],["#fbbf24","Entité connue"],["#fb923c","Haut volume"],["#ef4444","Mixer / Blacklist"]].map(([c,l])=>(
                  <div key={l} style={{ display:"flex",alignItems:"center",gap:5,fontSize:9,color:"#2a4060" }}>
                    <div style={{ width:7,height:7,borderRadius:"50%",background:c }}/>
                    {l}
                  </div>
                ))}
              </div>
              <div style={{ position:"absolute",top:12,left:14,color:"#0c2040",fontSize:9,fontFamily:"'Space Mono',monospace" }}>
                {graph.nodes.length} nœuds · {graph.links.length} liens · scroll=zoom · drag=déplacer · clic=détail
              </div>
            </div>
          )}

          {/* ─── TAB MÉTRIQUES ─── */}
          {tab==="Métriques" && (
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
              {[
                { title:"TOP CONTREPARTIES — VOLUME ETH",     nodes:[...graph.nodes].filter(n=>n.id!==addr.toLowerCase()).sort((a,b)=>b.volume-a.volume).slice(0,8),   vk:"volume",   vf:v=>`${fmt(v,2)} ETH`, ac:"#00ffe0" },
                { title:"TOP CONTREPARTIES — FRÉQUENCE TX",   nodes:[...graph.nodes].filter(n=>n.id!==addr.toLowerCase()).sort((a,b)=>b.txCount-a.txCount).slice(0,8), vk:"txCount",  vf:v=>`${v} tx`,          ac:"#60a5fa" },
              ].map(({title,nodes,vk,vf,ac})=>(
                <div key={title} style={{ background:"rgba(4,10,22,0.96)",border:"1px solid #0c2040",borderRadius:12,padding:20 }}>
                  <div style={{ color:"#2a4060",fontSize:9,letterSpacing:"0.14em",marginBottom:16 }}>{title}</div>
                  {nodes.length===0 && <div style={{ color:"#1a3050",fontSize:12 }}>Aucune donnée</div>}
                  {nodes.map((n,i)=>{
                    const max=nodes.reduce((mx,x)=>Math.max(mx,x[vk]),0.001);
                    return (
                      <div key={n.id} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
                        <span style={{ color:"#1a3050",fontSize:9,fontFamily:"'Space Mono',monospace",width:14,flexShrink:0 }}>{i+1}</span>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ color:"#94a3b8",fontSize:10,fontFamily:"'Space Mono',monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{n.label||shortAddr(n.id)}</div>
                          <div style={{ height:2,background:"#0c2040",borderRadius:1,marginTop:4 }}>
                            <div style={{ height:"100%",background:ac,borderRadius:1,width:`${Math.min(100,(n[vk]/max)*100)}%`,transition:"width 0.6s ease" }}/>
                          </div>
                        </div>
                        <span style={{ color:ac,fontFamily:"'Space Mono',monospace",fontSize:10,whiteSpace:"nowrap",flexShrink:0 }}>{vf(n[vk])}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ─── TAB ANALYSE IA ─── */}
          {tab==="Analyse IA" && (
            <div style={{ display:"grid",gridTemplateColumns:"auto 1fr",gap:14,alignItems:"start" }}>
              {/* Score + flags */}
              <div style={{ background:"rgba(4,10,22,0.96)",border:"1px solid #0c2040",borderRadius:12,padding:22,display:"flex",flexDirection:"column",alignItems:"center",gap:14,minWidth:170 }}>
                <div style={{ color:"#2a4060",fontSize:9,letterSpacing:"0.16em" }}>TRUST SCORE</div>
                <ScoreRing score={result.trustScore}/>
                <div style={{ color:"#0c2040",fontSize:9,textAlign:"center",lineHeight:1.7 }}>Scoring algorithmique<br/>100% autonome<br/>zéro API IA externe</div>
                <div style={{ width:"100%",borderTop:"1px solid #0c2040",paddingTop:12 }}>
                  <div style={{ color:"#2a4060",fontSize:9,marginBottom:8,letterSpacing:"0.1em" }}>PROFIL FLAGS</div>
                  <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
                    {Object.entries(result.flags).filter(([,v])=>v).map(([k])=><Pill key={k} text={k.replace("IS_","")} color="#fbbf24"/>)}
                  </div>
                </div>
              </div>

              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                {/* Narrative */}
                <div style={{ background:"rgba(4,10,22,0.96)",border:"1px solid #0c2040",borderRadius:12,padding:20 }}>
                  <div style={{ color:"#00ffe0",fontSize:9,letterSpacing:"0.14em",marginBottom:10 }}>■ PROFILER AGENT · RÉSUMÉ</div>
                  <p style={{ color:"#94a3b8",fontSize:13,lineHeight:1.8 }}>{result.narrative}</p>
                </div>

                {/* Behaviour */}
                <div style={{ background:"rgba(4,10,22,0.96)",border:"1px solid #0c2040",borderRadius:12,padding:20 }}>
                  <div style={{ color:"#60a5fa",fontSize:9,letterSpacing:"0.14em",marginBottom:12 }}>■ BEHAVIOUR AGENT · {result.behaviors.length} INSIGHTS DÉTECTÉS</div>
                  <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
                    {result.behaviors.map((b,i)=>(
                      <div key={i} style={{ display:"flex",gap:10,padding:"8px 14px",background:"#05101f",borderRadius:8,borderLeft:"2px solid #1a3a60" }}>
                        <span style={{ fontSize:15,flexShrink:0 }}>{b.icon}</span>
                        <div>
                          <div style={{ color:"#3b6eaa",fontSize:9,letterSpacing:"0.1em",marginBottom:3 }}>{b.cat.toUpperCase()}</div>
                          <div style={{ color:"#94a3b8",fontSize:12,lineHeight:1.65 }}>{b.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risks */}
                <div style={{ background:"rgba(4,10,22,0.96)",border:"1px solid #0c2040",borderRadius:12,padding:20 }}>
                  <div style={{ color:"#f97316",fontSize:9,letterSpacing:"0.14em",marginBottom:12 }}>■ RISK AGENT · SCORE {result.riskResult.riskScore}/100</div>
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    {result.riskResult.risks.map((r,i)=>(
                      <div key={i} style={{ padding:"9px 14px",background:RB[r.level],border:`1px solid ${RC[r.level]}28`,borderRadius:8,display:"flex",alignItems:"flex-start",gap:12 }}>
                        <span style={{ color:RC[r.level],fontSize:9,fontFamily:"'Space Mono',monospace",letterSpacing:"0.06em",whiteSpace:"nowrap",flexShrink:0,marginTop:2 }}>{r.level}</span>
                        <span style={{ color:"#94a3b8",fontSize:12,lineHeight:1.6 }}>{r.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB TOKENS/NFT ─── */}
          {tab==="Tokens / NFT" && (
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
              {[
                { title:"TOKENS ERC-20", items:m.tokenSymbols, count:m.tokenCount, color:"#e879f9", empty:"Aucun token ERC-20 détecté" },
                { title:"NFT COLLECTIONS", items:m.nftCollections, count:m.nftCount, color:"#38bdf8", empty:"Aucune collection NFT détectée" },
              ].map(({title,items,count,color,empty})=>(
                <div key={title} style={{ background:"rgba(4,10,22,0.96)",border:"1px solid #0c2040",borderRadius:12,padding:20 }}>
                  <div style={{ color,fontSize:9,letterSpacing:"0.14em",marginBottom:14 }}>{title} ({count})</div>
                  {items.slice(0,20).map(t=>(
                    <div key={t} style={{ padding:"7px 12px",background:"#05101f",borderRadius:6,marginBottom:6,color:"#e2e8f0",fontSize:12,fontFamily:"'Space Mono',monospace" }}>{t}</div>
                  ))}
                  {items.length===0 && <div style={{ color:"#1a3050",fontSize:12 }}>{empty}</div>}
                  {items.length>20 && <div style={{ color:"#2a4060",fontSize:11,marginTop:6 }}>+ {items.length-20} autres…</div>}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop:18,color:"#0c2040",fontSize:9,fontFamily:"'Space Mono',monospace",textAlign:"center",letterSpacing:"0.1em" }}>
            CHAINLENS · AUTONOMOUS RULE-BASED ENGINE · NO EXTERNAL AI API · ETHERSCAN DATA · {new Date().toLocaleString("fr-FR")}
          </div>
        </div>
      )}

      {!result&&!loading&&(
        <div style={{ textAlign:"center",padding:"90px 24px",color:"#0c2040",position:"relative",zIndex:1 }}>
          <div style={{ fontSize:64,marginBottom:18,opacity:0.3 }}>⬡</div>
          <div style={{ fontSize:19,fontWeight:700,color:"#1a3050",marginBottom:10 }}>Entrez une adresse Ethereum</div>
          <div style={{ fontSize:12,color:"#0c2040",lineHeight:1.8,maxWidth:500,margin:"0 auto" }}>
            Profiler Agent · Behaviour Agent · Risk Agent · Score Engine<br/>
            <span style={{ color:"#1a3050" }}>100% client-side · 0 API IA externe · Etherscan gratuit</span>
          </div>
        </div>
      )}
    </div>
  );
}

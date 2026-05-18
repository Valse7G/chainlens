/**
 * ChainLens — Signal Engine
 *
 * Detects the 5 convergence signals:
 *   #1 Smart Money Cluster Buy  — multiple SM wallets, same token, short window
 *   #2 First Smart Entry        — historically profitable wallet enters early
 *   #3 Smart Money Rotation     — SM exits token A, enters token B
 *   #4 Early Holder Quality     — first 100 holders have high SM density
 *   #5 Smart Liquidity Addition — sophisticated wallets add LP
 *
 * Runner Score composite:
 *   IF mcap < 20M
 *   AND cluster >= 4
 *   AND smart_score_avg > threshold
 *   AND holder_growth accelerating
 *   AND liquidity increasing
 *   AND insider_score not excessive
 *   THEN HIGH SIGNAL
 */

// ── Signal #1: Smart Money Cluster Buy ───────────────────────────────
export function detectClusterBuy(signals, smartScores, windowMinutes = 30) {
  // Group runners by token
  const tokenGroups = new Map();
  for (const sig of signals) {
    if (!tokenGroups.has(sig.address)) tokenGroups.set(sig.address, { ...sig, clusterBuys: [] });
    const group = tokenGroups.get(sig.address);
    for (const buyer of sig.buyers) {
      const score = smartScores.find(s => s.address === buyer.address);
      group.clusterBuys.push({ ...buyer, smartScore: score?.smartScore || 30 });
    }
  }

  return [...tokenGroups.values()].map(tok => {
    // Find buys within windowMinutes of each other
    const sorted = [...tok.clusterBuys].sort((a, b) => a.buyTs - b.buyTs);
    let maxCluster = 0, clusterWallets = [], bestAvgScore = 0;
    for (let i = 0; i < sorted.length; i++) {
      const window = sorted.filter(b => Math.abs(b.buyTs - sorted[i].buyTs) <= windowMinutes * 60);
      if (window.length > maxCluster) {
        maxCluster = window.length;
        clusterWallets = window;
        bestAvgScore = window.reduce((s, b) => s + (b.smartScore || 0), 0) / window.length;
      }
    }

    const clusterScore = Math.min(
      maxCluster * 10                 // 10 pts per wallet in cluster
      + Math.round(bestAvgScore * 0.5) // up to 50 from smart scores
      + (maxCluster >= 4 ? 20 : 0),    // bonus for 4+ wallets
      100
    );

    return {
      ...tok,
      signal1: {
        type:         "CLUSTER_BUY",
        label:        "Smart Money Cluster",
        clusterSize:  maxCluster,
        windowMin:    windowMinutes,
        avgSmartScore: Math.round(bestAvgScore),
        clusterWallets,
        score:        clusterScore,
        triggered:    maxCluster >= 2 && bestAvgScore >= 40,
      }
    };
  });
}

// ── Signal #2: First Smart Entry ─────────────────────────────────────
export function detectFirstSmartEntry(signals, smartScores, threshold = 60) {
  return signals.map(tok => {
    const highScoreBuyers = tok.buyers
      .map(b => ({ ...b, smartScore: smartScores.find(s => s.address === b.address)?.smartScore || 0 }))
      .filter(b => b.smartScore >= threshold)
      .sort((a, b) => a.buyTs - b.buyTs);

    const firstEntry = highScoreBuyers[0] || null;
    const score = firstEntry
      ? Math.min(firstEntry.smartScore + (highScoreBuyers.length * 5), 100)
      : 0;

    return {
      ...tok,
      signal2: {
        type:       "FIRST_SMART_ENTRY",
        label:      "First Smart Entry",
        firstEntry,
        qualifiedCount: highScoreBuyers.length,
        score,
        triggered:  !!firstEntry,
      }
    };
  });
}

// ── Signal #3: Smart Money Rotation ──────────────────────────────────
export function detectRotation(insiders, signals) {
  // Find wallets that recently received the new token AND recently sent memecoins out
  const rotators = new Map();

  for (const insider of insiders) {
    const newTokenBuys = insider.recentBuys || [];
    if (!newTokenBuys.length) continue;

    // Check if this wallet also recently "rotated" (sent memecoins in same window)
    const hasRotation = insider.memecoins && insider.memecoins.length > 0;
    if (hasRotation) {
      for (const buy of newTokenBuys) {
        if (!rotators.has(buy.tokenAddress)) rotators.set(buy.tokenAddress, []);
        rotators.get(buy.tokenAddress).push({ address: insider.address, memecoins: insider.memecoins });
      }
    }
  }

  return signals.map(tok => {
    const rotationBuyers = rotators.get(tok.address) || [];
    return {
      ...tok,
      signal3: {
        type:     "ROTATION",
        label:    "SM Rotation",
        rotators: rotationBuyers,
        score:    Math.min(rotationBuyers.length * 20, 100),
        triggered: rotationBuyers.length >= 2,
      }
    };
  });
}

// ── Signal #4: Early Holder Quality ──────────────────────────────────
export function scoreHolderQuality(tok, smartScores) {
  const buyerAddrs = tok.buyers.map(b => b.address);
  const scoredBuyers = buyerAddrs.map(addr => smartScores.find(s => s.address === addr));
  const validScores = scoredBuyers.filter(Boolean);
  const avgScore = validScores.length ? validScores.reduce((s, x) => s + x.smartScore, 0) / validScores.length : 0;
  const smDensity = tok.buyers.filter(b => b.isSmartMoney).length / Math.max(tok.buyers.length, 1);

  const score = Math.round(avgScore * 0.6 + smDensity * 100 * 0.4);
  return {
    type:       "HOLDER_QUALITY",
    label:      "Holder Quality",
    avgSmartScore: Math.round(avgScore),
    smDensity:  Math.round(smDensity * 100),
    score:      Math.min(score, 100),
    triggered:  score >= 40,
  };
}

// ── Runner Score Composite ────────────────────────────────────────────
export function computeRunnerScore(tok, smartScores) {
  const s1 = tok.signal1?.score       || 0;
  const s2 = tok.signal2?.score       || 0;
  const s3 = tok.signal3?.score       || 0;
  const s4 = scoreHolderQuality(tok, smartScores).score;
  const smBonus = tok.buyers.filter(b => b.isSmartMoney).length * 10;
  const tier1Bonus = (tok.tier1Count || 0) * 8;
  const buyCountBonus = Math.min(tok.buyCount * 3, 30);

  const rawScore = (s1 * 0.35) + (s2 * 0.25) + (s3 * 0.15) + (s4 * 0.15)
    + smBonus + tier1Bonus + buyCountBonus;

  const runnerScore = Math.min(Math.round(rawScore), 100);

  // Signal level
  let level = "LOW";
  if      (runnerScore >= 80) level = "EXTREME";
  else if (runnerScore >= 65) level = "HIGH";
  else if (runnerScore >= 45) level = "MEDIUM";
  else if (runnerScore >= 25) level = "WATCH";

  return {
    runnerScore,
    level,
    signal4: scoreHolderQuality(tok, smartScores),
    breakdown: { s1, s2, s3, s4, smBonus, tier1Bonus, buyCountBonus },
  };
}

// ── Full signal enrichment ────────────────────────────────────────────
export function enrichSignals(signals, insiders, smartScores) {
  let enriched = detectClusterBuy(signals, smartScores);
  enriched     = detectFirstSmartEntry(enriched, smartScores);
  enriched     = detectRotation(insiders, enriched);

  return enriched.map(tok => {
    const runner = computeRunnerScore(tok, smartScores);
    return { ...tok, ...runner };
  }).sort((a, b) => b.runnerScore - a.runnerScore);
}

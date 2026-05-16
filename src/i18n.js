/**
 * ChainLens i18n — Bilingual EN/FR
 * Default: English
 * Usage: t("key") — returns string for current locale
 */

export const LOCALES = ["en", "fr"];
export const LOCALE_LABELS = { en: "EN", fr: "FR" };

const translations = {
  en: {
    // Nav
    nav_analyze:     "ANALYZE",
    nav_leaderboard: "LEADERBOARD",
    nav_whales:      "WHALES & OGs",
    nav_api:         "⚙ API",

    // Header
    eth_price:       "ETH",
    dev_key_label:   "DEV KEY",
    dev_key_hint:    "Etherscan API key (local dev)",
    proxy_active:    "✓ Netlify proxy active — key stored server-side",
    free_key:        "Get free key ↗",

    // Analyze page
    analyze_placeholder: "Ethereum address — 0x…",
    analyze_btn:         "ANALYZE",
    analyze_scanning:    "SCANNING…",
    analyze_step_balance:"Balance & ETH price…",
    analyze_step_tx:     "Transactions (500)…",
    analyze_step_tokens: "ERC-20 tokens…",
    analyze_step_nft:    "NFTs…",
    analyze_step_type:   "Account type…",
    analyze_step_graph:  "Building graph…",
    analyze_step_agents: "Running agents…",
    analyze_err_invalid: "Invalid Ethereum address.",
    analyze_err_nodata:  "No data received. Check your API key or try another address (F12 > Console for logs).",
    analyze_empty_title: "Enter an Ethereum address",
    analyze_empty_sub:   "Profiler · Behaviour · Risk · Score Engine\n100% client-side · No AI API · Etherscan V2",

    // Tabs
    tab_graph:    "GRAPH",
    tab_metrics:  "METRICS",
    tab_analysis: "ANALYSIS",
    tab_tokens:   "TOKENS",

    // Metrics
    metric_balance:  "ETH Balance",
    metric_txcount:  "Transactions",
    metric_peers:    "Counterparties",
    metric_sent:     "Total Sent",
    metric_received: "Total Received",
    metric_gas:      "Gas Spent",
    metric_erc20:    "ERC-20 Tokens",
    metric_nft:      "NFT Collections",
    metric_day:      "/day",
    metric_eth:      "ETH",
    metric_unique:   "unique addresses",
    metric_tokens:   "tokens",
    metric_colls:    "collections",
    metric_gwei:     "Gwei avg.",

    // Graph
    graph_nodes:   "nodes",
    graph_links:   "links",
    graph_tip:     "scroll=zoom · drag=move · click=detail",
    graph_wallet:  "Wallet",
    graph_eoa:     "EOA",
    graph_known:   "Known entity",
    graph_highvol: "High volume",
    graph_mixer:   "Mixer",

    // Node panel
    node_title:   "NODE DETAIL",
    node_tx:      "Tx",
    node_vol:     "Volume",
    node_out:     "Sent",
    node_in:      "Received",
    node_mixer:   "🌀 Mixer / Tornado Cash",
    node_etherscan: "Etherscan ↗",

    // Analysis
    profiler_title:   "■ PROFILER · SUMMARY",
    behaviour_title:  "■ BEHAVIOUR ·",
    behaviour_insights: "INSIGHTS",
    risk_title:       "■ RISK ·",
    trust_score:      "TRUST SCORE",
    flags_label:      "FLAGS",
    risk_safe:        "No major risk signals detected.",

    // Metrics tab
    top_volume: "TOP COUNTERPARTIES — VOLUME ETH",
    top_freq:   "TOP COUNTERPARTIES — TX FREQUENCY",

    // Tokens tab
    no_erc20:  "No ERC-20 token detected",
    no_nft:    "No NFT collection detected",

    // Leaderboard
    lb_title:       "TOP TRADERS",
    lb_subtitle:    "UNISWAP V3",
    lb_load:        "LOAD",
    lb_loading:     "SCAN…",
    lb_period:      "D",
    lb_filter:      "Filter by address or token…",
    lb_sort_vol:    "VOLUME",
    lb_sort_swaps:  "SWAPS",
    lb_sort_avg:    "AVG TXN",
    lb_traders:     "traders",
    lb_col_addr:    "ADDRESS",
    lb_col_vol:     "USD VOLUME",
    lb_col_swaps:   "SWAPS",
    lb_col_avg:     "AVG TXN",
    lb_col_pairs:   "TOP PAIRS",
    lb_col_action:  "ACTION",
    lb_analyze:     "ANALYZE →",
    lb_empty_title: "LEADERBOARD",
    lb_empty_sub:   "Select a period and click LOAD\nto fetch top Uniswap V3 traders",
    lb_subgraph_note:"Data from The Graph — Uniswap V3 Subgraph",

    // Insider analysis
    insider_hot:     "🔥 HOT TOKENS — BOUGHT BY TOP TRADERS",
    insider_cluster: "🕵 POTENTIAL INSIDER CLUSTERS (co-buyers)",

    // Whales page
    wh_title:    "ETHEREUM",
    wh_ogs:      "OGs",
    wh_and:      "&",
    wh_whales:   "WHALES",
    wh_subtitle: "entities referenced · Verified static data",
    wh_search:   "Search…",
    wh_analyze:  "ANALYZE →",
    wh_since:    "since",
    wh_all:      "ALL",

    // Footer
    footer: "CHAINLENS v2.0.0 · AUTONOMOUS ENGINE · ETHERSCAN V2 · UNISWAP V3 SUBGRAPH",

    // Profiles
    profile_contract:   "Smart Contract",
    profile_bot:        "Bot / Automated",
    profile_whale:      "Whale",
    profile_exchange:   "Exchange / Market Maker",
    profile_defi_nft:   "DeFi & NFT Power User",
    profile_defi:       "DeFi Power User",
    profile_nft:        "NFT Trader",
    profile_midwhale:   "Mid-size Holder",
    profile_hodler:     "Long-term HODLer",
    profile_active:     "Active Trader",
    profile_dormant:    "Dormant Wallet",
    profile_fresh:      "Recent Wallet",
    profile_retail:     "Retail User",
    profile_standard:   "Standard User",

    // Behaviour agent
    beh_very_high:   "Extremely high activity: {0} tx/day avg over {1} days — likely bot or automated system.",
    beh_high:        "High frequency: {0} tx/day — active trader profile.",
    beh_low_freq:    "Very low frequency: {0} tx/day — rarely active wallet.",
    beh_moderate:    "Moderate frequency: {0} tx/day.",
    beh_night_high:  "{0}% of transactions between 0h–6h UTC (peak {1}) — automation likely.",
    beh_day:         "Mostly daytime activity. Peak at {0} UTC.",
    beh_burst:       "{0} bursts detected (<60s). Min interval: {1}s — automated script or MEV bot.",
    beh_emitter:     "Strong net emitter: {0} ETH sent vs {1} received (ratio {2}x).",
    beh_accumulator: "Net accumulator: {0} ETH received vs {1} sent.",
    beh_balanced:    "Balanced flow: {0} ETH out / {1} ETH in.",
    beh_big_txn:     "Large transactions: avg {0} ETH, max {1} ETH.",
    beh_small_txn:   "Standard transaction size: avg {0} ETH/tx.",
    beh_high_error:  "High failure rate: {0}% ({1}/{2}).",
    beh_zero_error:  "Zero failures over {0} tx — typical bot precision.",
    beh_normal_error:"Normal failure rate: {0}%.",
    beh_defi_heavy:  "Intensive DeFi: {0} DEX interactions ({1}% of tx).",
    beh_defi_some:   "{0} DEX interactions detected.",
    beh_gas_high:    "Very high gas price: {0} Gwei — MEV or arbitrage likely.",
    beh_gas_low:     "Economical gas: {0} Gwei avg — total {1} ETH.",

    // Risk agent
    risk_mixer:      "{0} tx with Tornado Cash or mixing protocol.",
    risk_fresh_high: "Wallet created {0} days ago but already {1} ETH volume.",
    risk_cycling:    "Cycling pattern: {0} tx between only {1} addresses.",
    risk_dust:       "{0} dust attacks received — wallet is being tracked.",
    risk_bot_precise:"0% failure + {0} bursts — pre-tx simulation bot.",
    risk_mev:        "High gas ({0} Gwei) + high frequency — possible MEV activity.",

    // Narrative
    nar_profile:    "Profile:",
    nar_active:     "Active since",
    nar_days:       "days, last activity:",
    nar_txs:        "transactions ·",
    nar_peers:      "unique counterparties.",
    nar_vol:        "On-chain volume: {0} ETH ({1} sent / {2} received).",
    nar_no_vol:     "No ETH volume detected.",
    nar_diversity:  "Interactions: {0} ERC-20 token(s) and {1} NFT collection(s).",
    nar_no_div:     "No ERC-20/NFT interaction detected.",
    nar_gas:        "Gas spent: {0} ETH.",
    nar_risk:       "Risk:",
    nar_high_risk:  "high 🔴",
    nar_med_risk:   "moderate 🟡",
    nar_low_risk:   "low 🟢",
    nar_risk_score: "Risk score:",
    nar_trust:      "Trust score:",
  },

  fr: {
    // Nav
    nav_analyze:     "ANALYSER",
    nav_leaderboard: "CLASSEMENT",
    nav_whales:      "BALEINES & OGs",
    nav_api:         "⚙ API",

    // Header
    eth_price:       "ETH",
    dev_key_label:   "CLÉ DEV",
    dev_key_hint:    "Clé API Etherscan (dev local)",
    proxy_active:    "✓ Proxy Netlify actif — clé côté serveur",
    free_key:        "Clé gratuite ↗",

    // Analyze page
    analyze_placeholder: "Adresse Ethereum — 0x…",
    analyze_btn:         "ANALYSER",
    analyze_scanning:    "ANALYSE…",
    analyze_step_balance:"Solde & prix ETH…",
    analyze_step_tx:     "Transactions (500)…",
    analyze_step_tokens: "Tokens ERC-20…",
    analyze_step_nft:    "NFTs…",
    analyze_step_type:   "Type de compte…",
    analyze_step_graph:  "Construction du graphe…",
    analyze_step_agents: "Agents en cours…",
    analyze_err_invalid: "Adresse Ethereum invalide.",
    analyze_err_nodata:  "Aucune donnée reçue. Vérifiez la clé API ou testez une autre adresse (F12 > Console pour les logs).",
    analyze_empty_title: "Entrez une adresse Ethereum",
    analyze_empty_sub:   "Profiler · Behaviour · Risk · Score Engine\n100% client-side · Zéro API IA · Etherscan V2",

    // Tabs
    tab_graph:    "GRAPHE",
    tab_metrics:  "MÉTRIQUES",
    tab_analysis: "ANALYSE",
    tab_tokens:   "TOKENS",

    // Metrics
    metric_balance:  "Solde ETH",
    metric_txcount:  "Transactions",
    metric_peers:    "Contreparties",
    metric_sent:     "Total Envoyé",
    metric_received: "Total Reçu",
    metric_gas:      "Gas Dépensé",
    metric_erc20:    "Tokens ERC-20",
    metric_nft:      "Collections NFT",
    metric_day:      "/jour",
    metric_eth:      "ETH",
    metric_unique:   "adresses uniques",
    metric_tokens:   "tokens",
    metric_colls:    "collections",
    metric_gwei:     "Gwei moy.",

    // Graph
    graph_nodes:   "nœuds",
    graph_links:   "liens",
    graph_tip:     "scroll=zoom · drag=déplacer · clic=détail",
    graph_wallet:  "Wallet",
    graph_eoa:     "EOA",
    graph_known:   "Entité connue",
    graph_highvol: "Haut volume",
    graph_mixer:   "Mixer",

    // Node panel
    node_title:   "DÉTAIL NŒUD",
    node_tx:      "Tx",
    node_vol:     "Volume",
    node_out:     "Envoyé",
    node_in:      "Reçu",
    node_mixer:   "🌀 Mixer / Tornado Cash",
    node_etherscan: "Etherscan ↗",

    // Analysis
    profiler_title:    "■ PROFILER · RÉSUMÉ",
    behaviour_title:   "■ COMPORTEMENT ·",
    behaviour_insights:"INSIGHTS",
    risk_title:        "■ RISQUE ·",
    trust_score:       "SCORE DE CONFIANCE",
    flags_label:       "FLAGS",
    risk_safe:         "Aucun signal de risque majeur détecté.",

    // Metrics tab
    top_volume: "TOP CONTREPARTIES — VOLUME ETH",
    top_freq:   "TOP CONTREPARTIES — FRÉQUENCE TX",

    // Tokens tab
    no_erc20:  "Aucun token ERC-20 détecté",
    no_nft:    "Aucune collection NFT détectée",

    // Leaderboard
    lb_title:       "TOP TRADERS",
    lb_subtitle:    "UNISWAP V3",
    lb_load:        "CHARGER",
    lb_loading:     "SCAN…",
    lb_period:      "J",
    lb_filter:      "Filtrer par adresse ou token…",
    lb_sort_vol:    "VOLUME",
    lb_sort_swaps:  "SWAPS",
    lb_sort_avg:    "TX MOY",
    lb_traders:     "traders",
    lb_col_addr:    "ADRESSE",
    lb_col_vol:     "VOLUME USD",
    lb_col_swaps:   "SWAPS",
    lb_col_avg:     "TX MOY",
    lb_col_pairs:   "TOP PAIRES",
    lb_col_action:  "ACTION",
    lb_analyze:     "ANALYSER →",
    lb_empty_title: "CLASSEMENT",
    lb_empty_sub:   "Sélectionnez une période et cliquez CHARGER\npour récupérer les top traders Uniswap V3",
    lb_subgraph_note:"Données via The Graph — Uniswap V3 Subgraph",

    // Insider analysis
    insider_hot:     "🔥 TOKENS CHAUDS — ACHETÉS PAR LES TOP TRADERS",
    insider_cluster: "🕵 CLUSTERS INSIDERS POTENTIELS (co-acheteurs)",

    // Whales page
    wh_title:    "ETHEREUM",
    wh_ogs:      "OGs",
    wh_and:      "&",
    wh_whales:   "BALEINES",
    wh_subtitle: "entités référencées · Données vérifiées",
    wh_search:   "Rechercher…",
    wh_analyze:  "ANALYSER →",
    wh_since:    "depuis",
    wh_all:      "TOUS",

    // Footer
    footer: "CHAINLENS v2.0.0 · MOTEUR AUTONOME · ETHERSCAN V2 · UNISWAP V3 SUBGRAPH",

    // Profiles
    profile_contract:   "Smart Contract",
    profile_bot:        "Bot / Automatisé",
    profile_whale:      "Whale",
    profile_exchange:   "Exchange / Market Maker",
    profile_defi_nft:   "DeFi & NFT Power User",
    profile_defi:       "DeFi Power User",
    profile_nft:        "NFT Trader",
    profile_midwhale:   "Détenteur Intermédiaire",
    profile_hodler:     "HODLer Long Terme",
    profile_active:     "Trader Actif",
    profile_dormant:    "Wallet Dormant",
    profile_fresh:      "Wallet Récent",
    profile_retail:     "Utilisateur Retail",
    profile_standard:   "Utilisateur Standard",

    // Behaviour agent
    beh_very_high:   "Activité extrêmement élevée : {0} tx/jour sur {1} jours — bot probable.",
    beh_high:        "Fréquence élevée : {0} tx/jour — profil trader actif.",
    beh_low_freq:    "Fréquence très basse : {0} tx/jour — wallet peu actif.",
    beh_moderate:    "Fréquence modérée : {0} tx/jour.",
    beh_night_high:  "{0}% des transactions entre 0h–6h UTC (pic {1}) — automatisation probable.",
    beh_day:         "Activité principalement diurne. Pic à {0} UTC.",
    beh_burst:       "{0} rafales détectées (<60s). Intervalle min : {1}s — script automatisé ou bot MEV.",
    beh_emitter:     "Émetteur net très fort : {0} ETH envoyés vs {1} reçus (ratio {2}x).",
    beh_accumulator: "Accumulateur net : {0} ETH reçus vs {1} envoyés.",
    beh_balanced:    "Flux équilibré : {0} ETH sortant / {1} ETH entrant.",
    beh_big_txn:     "Grandes transactions : moyenne {0} ETH, max {1} ETH.",
    beh_small_txn:   "Taille standard : moyenne {0} ETH/tx.",
    beh_high_error:  "Taux d'échec élevé : {0}% ({1}/{2}).",
    beh_zero_error:  "Aucun échec sur {0} tx — précision typique d'un bot.",
    beh_normal_error:"Taux d'échec normal : {0}%.",
    beh_defi_heavy:  "DeFi intensif : {0} interactions DEX ({1}% des tx).",
    beh_defi_some:   "{0} interactions DEX détectées.",
    beh_gas_high:    "Gas très élevé : {0} Gwei — MEV ou arbitrage probable.",
    beh_gas_low:     "Gas économe : {0} Gwei moy. — total {1} ETH.",

    // Risk agent
    risk_mixer:      "{0} tx avec Tornado Cash ou protocole de mixing.",
    risk_fresh_high: "Wallet créé il y a {0} jours avec déjà {1} ETH de volume.",
    risk_cycling:    "Pattern de cycling : {0} tx entre seulement {1} adresses.",
    risk_dust:       "{0} dust attacks reçues — wallet ciblé.",
    risk_bot_precise:"0% d'échec + {0} bursts — bot avec simulation pre-tx.",
    risk_mev:        "Gas élevé ({0} Gwei) + haute fréquence — activité MEV possible.",

    // Narrative
    nar_profile:    "Profil :",
    nar_active:     "Actif depuis",
    nar_days:       "jours, dernière activité :",
    nar_txs:        "transactions ·",
    nar_peers:      "contreparties uniques.",
    nar_vol:        "Volume total : {0} ETH ({1} envoyés / {2} reçus).",
    nar_no_vol:     "Aucun volume ETH détecté.",
    nar_diversity:  "Interactions : {0} token(s) ERC-20 et {1} collection(s) NFT.",
    nar_no_div:     "Aucune interaction ERC-20/NFT détectée.",
    nar_gas:        "Gas consommé : {0} ETH.",
    nar_risk:       "Risque :",
    nar_high_risk:  "élevé 🔴",
    nar_med_risk:   "modéré 🟡",
    nar_low_risk:   "faible 🟢",
    nar_risk_score: "Score risque :",
    nar_trust:      "Score de confiance :",
  },
};

/** Simple interpolation: t("key", val1, val2) replaces {0}, {1}… */
export function createT(locale) {
  const dict = translations[locale] || translations.en;
  return (key, ...args) => {
    let s = dict[key] ?? translations.en[key] ?? key;
    args.forEach((v, i) => { s = s.replace(`{${i}}`, v); });
    return s;
  };
}

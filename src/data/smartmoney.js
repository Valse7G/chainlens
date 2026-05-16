/**
 * ChainLens — Smart Money Registry
 * Curated list of on-chain alpha wallets tracked for new token buys.
 * Sources: public ENS, on-chain reputation, community-verified.
 */

export const SMART_MONEY = [
  // ── Tier 1: Alpha Traders (highest signal) ──────────────────────────
  { address:"0x9bf4001d307dfd62b26a2f1307ee0c0307632d59", name:"Tetranode",       tier:1, tags:["DeFi","CRV Wars"] },
  { address:"0x176f3dab24a159341c0509bb36b833e7fdd0a132", name:"0xSifu",           tier:1, tags:["DeFi","Macro"] },
  { address:"0x66b870ddf78c975af5cd8edc6de25eca81791de1", name:"Andrew Kang",      tier:1, tags:["Macro","Alt-L1"] },
  { address:"0x5e349eca2dc61abcd9dd99ce94d04136151a09ee", name:"Loomdart",          tier:1, tags:["DeFi","Yield"] },
  { address:"0xd7029bdea1c17493893ae900b9882f7ed87c8b65", name:"DCF God",           tier:1, tags:["Macro","Options"] },
  { address:"0x4862733b5fddfd35f35ea8ccf08f5045e57388b3", name:"The DeFi Edge",    tier:1, tags:["DeFi","Meme"] },
  { address:"0x7d29a64504629172a429e64183d6673b9dacbfce", name:"DCinvestor",        tier:1, tags:["ETH OG","NFT"] },
  { address:"0x000000000000000000000000000000000000dead", name:"placeholder1",      tier:1, tags:["DeFi"] }, // slot

  // ── Tier 2: Smart Money Funds ────────────────────────────────────────
  { address:"0x4dfc2adeb4f92f5a0604e3b2cb35eb3b4ecd4b74", name:"a16z Crypto",      tier:2, tags:["VC","Blue-chip"] },
  { address:"0xf584f8728b874a6a5c7a8d4d387c9aae9172d621", name:"Paradigm",          tier:2, tags:["VC","DeFi"] },
  { address:"0x0716a17fbaee714f1e6ab0f9d59edbc5f09815c0", name:"Jump Trading",      tier:2, tags:["MM","Arb"] },
  { address:"0x878e29b1a8e0aa2a67d6c30fd40e9b0b2e756ac4", name:"Multicoin Capital", tier:2, tags:["VC","Alt-L1"] },
  { address:"0xa090e606e30bd747d4e6245a1517ebe430f0057e", name:"Wintermute",         tier:2, tags:["MM","DeFi"] },
  { address:"0x8103683202aa8da10536036edef04cdd865c225e", name:"EF Multisig",        tier:2, tags:["Protocol","ETH"] },

  // ── Tier 3: Known On-chain Alphas ────────────────────────────────────
  { address:"0x1b3cb81e51011b549d78bf720b0d924ac763a7c2", name:"Polychain",         tier:3, tags:["VC","L1"] },
  { address:"0x756d64dc5edb56740fc617628dc832a4d501b7f8", name:"Alameda Remnant",   tier:3, tags:["Trading","Arb"] },
  { address:"0x6cc5f688a315f3dc28a7781717a9a798a59fda7b", name:"OKX Hot",           tier:3, tags:["CEX","Flow"] },
  { address:"0x28c6c06298d514db089934071355e5743bf21d60", name:"Binance 14",         tier:3, tags:["CEX","Flow"] },
  { address:"0x9b0f99d5e9a48b6e7a5c0e3e35e1d3f9a8c0b4e2", name:"Dragonfly Capital", tier:3, tags:["VC","DeFi"] },
  { address:"0xab5801a7d398351b8be11c439e05c5b3259aec9b", name:"Vitalik Genesis",    tier:3, tags:["OG","ETH"] },
  { address:"0xd8da6bf26964af9d7eed9e03e53415d37aa96045", name:"Vitalik Buterin",   tier:3, tags:["OG","ETH"] },
  { address:"0xa478c2975ab1ea89e8196811f51a7b7ade33eb11", name:"Paradigm LP",        tier:3, tags:["DeFi","LP"] },

  // ── Tier 4: Meme / Degen Alphas ─────────────────────────────────────
  { address:"0x54be3a794282c030b15e43ae2bb182e14c191539", name:"Pranksy",           tier:4, tags:["NFT","Degen"] },
  { address:"0x1db3439a222c519ab44bb1144fc28167b4fa6ee6", name:"Justin Sun",        tier:4, tags:["Whale","DeFi"] },
  { address:"0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be", name:"Binance Hot 1",     tier:4, tags:["CEX","Flow"] },
];

export const TIER_META = {
  1: { label:"Alpha",  color:"#ff3366", icon:"⚡" },
  2: { label:"Fund",   color:"#ffb700", icon:"💼" },
  3: { label:"Known",  color:"#60a5fa", icon:"👁" },
  4: { label:"Degen",  color:"#a78bfa", icon:"🎲" },
};

export const SM_ADDRESSES = new Set(SMART_MONEY.map(w => w.address.toLowerCase()));
export const SM_BY_ADDR   = Object.fromEntries(SMART_MONEY.map(w => [w.address.toLowerCase(), w]));

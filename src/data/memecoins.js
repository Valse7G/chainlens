/**
 * ChainLens — Memecoin Reference Registry
 * Top Ethereum memecoins used for whale/insider detection.
 * Holders of these tokens are tracked as "memecoin insiders".
 */

export const MEMECOINS = [
  {
    address: "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
    symbol:  "SHIB",
    name:    "Shiba Inu",
    icon:    "🐕",
    tier:    1,
    notes:   "Largest ETH memecoin by mcap — whale holders = high-signal insiders",
    coingecko: "shiba-inu",
  },
  {
    address: "0x6982508145454ce325ddbe47a25d4ec3d2311933",
    symbol:  "PEPE",
    name:    "Pepe",
    icon:    "🐸",
    tier:    1,
    notes:   "2023 mega-runner — PEPE whales historically rotate into new memes early",
    coingecko: "pepe",
  },
  {
    address: "0xe0f63a424a4439cbe457d80e4f4b51ad25b2c56c",
    symbol:  "SPX6900",
    name:    "SPX6900",
    icon:    "📈",
    tier:    1,
    notes:   "2024 cult memecoin — small tight-knit whale community, high coordination",
    coingecko: "spx6900",
  },
  {
    address: "0xcf0c122c6b73ff809c693db761e7baebe62b6a2e",
    symbol:  "FLOKI",
    name:    "Floki",
    icon:    "⚡",
    tier:    1,
    notes:   "Established meme with active community — whales often front-run launches",
    coingecko: "floki",
  },
  {
    address: "0xa35923162c49cf95e6bf26623385eb431ad920d4",
    symbol:  "TURBO",
    name:    "Turbo",
    icon:    "🚀",
    tier:    2,
    notes:   "AI-generated memecoin — early holders are high-conviction degen insiders",
    coingecko: "turbo",
  },
  {
    address: "0xaaee1a9723aadb7afa2810263653a34ba2c21c7a",
    symbol:  "MOG",
    name:    "Mog Coin",
    icon:    "😎",
    tier:    2,
    notes:   "2024 community darling — whale wallets highly active in new launches",
    coingecko: "mog-coin",
  },
  {
    address: "0x5026f006b85729a8b14553fae6af249ad16c9aaa",
    symbol:  "WOJAK",
    name:    "Wojak",
    icon:    "😢",
    tier:    2,
    notes:   "OG 2023 meme cycle — holder base overlaps with PEPE/SHIB insiders",
    coingecko: "wojak",
  },
  {
    address: "0xd5525d397898e5502075ea5e910d50d42000904c",
    symbol:  "MEME",
    name:    "Memeland",
    icon:    "🎭",
    tier:    2,
    notes:   "9GAG-backed meme token — institutional + retail whale crossover",
    coingecko: "memeland",
  },
  {
    address: "0x4d224452801aced8b2f0aebe155379bb5d594381",
    symbol:  "APE",
    name:    "ApeCoin",
    icon:    "🦍",
    tier:    2,
    notes:   "BAYC ecosystem — APE whales frequently early on NFT-adjacent memes",
    coingecko: "apecoin",
  },
];

export const MEMECOIN_BY_ADDR = Object.fromEntries(
  MEMECOINS.map(m => [m.address.toLowerCase(), m])
);

export const MEMECOIN_ADDRS = new Set(MEMECOINS.map(m => m.address.toLowerCase()));

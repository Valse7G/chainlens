/**
 * ChainLens — Smart Money Intelligence Engine v2.0.3
 * Detects new Uniswap V3 pools + tracks SM wallet buys on those pools.
 */
import { SM_ADDRESSES, SM_BY_ADDR } from "../data/smartmoney.js";

const BASE_TOKENS = new Set([
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "0xdac17f958d2ee523a2206206994597c13d831ec7",
  "0x6b175474e89094c44da98b954eedeac495271d0f",
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
]);
const BASE_NAMES = {
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2":"WETH",
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48":"USDC",
  "0xdac17f958d2ee523a2206206994597c13d831ec7":"USDT",
  "0x6b175474e89094c44da98b954eedeac495271d0f":"DAI",
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599":"WBTC",
};
const UNISWAP_V3_FACTORY = "0x1f98431c8ad98523631ae4a59f267346ea31f984";
const TORNADO = "0x722122df12d4e14e13ac3b6895a86e84145b6967";
const POOL_CREATED_TOPIC = "0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118";

const IS_DEV = typeof window !== "undefined" && window.location.hostname === "localhost";
let _key = "";
export const setEngineKey = (k) => { _key = k; };

function buildUrl(fields) {
  const p = new URLSearchParams();
  for (const [k,v] of Object.entries(fields)) if (v!=null && v!=="") p.set(k,String(v));
  if (IS_DEV) { p.set("apikey",_key); return "https://api.etherscan.io/v2/api?"+p; }
  return "/api/etherscan?"+p;
}

async function esGet(fields, fallback=null) {
  try {
    const r = await fetch(buildUrl(fields));
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (j.status==="0") {
      const m=((j.message||"")+" "+(j.result||"")).toLowerCase();
      if (m.includes("no transaction")||m.includes("no record")||m.includes("no log")) return [];
      return fallback;
    }
    return j.status==="1" ? j.result : fallback;
  } catch(e) { console.warn("[Engine]",e.message); return fallback; }
}

async function getBlockFromTs(ts) {
  const r = await esGet({module:"block",action:"getblocknobytime",timestamp:ts,closest:"before"},null);
  return r ? String(r) : "0";
}

export async function fetchNewPools(hoursBack=24) {
  const fromTs = Math.floor(Date.now()/1000) - hoursBack*3600;
  const fromBlock = await getBlockFromTs(fromTs);
  const logs = await esGet({
    module:"logs", action:"getLogs",
    address: UNISWAP_V3_FACTORY,
    topic0: POOL_CREATED_TOPIC,
    fromBlock, toBlock:"latest",
    page:1, offset:200,
  },[]);
  if (!Array.isArray(logs)||!logs.length) return [];
  return logs.map(log=>{
    const t0 = "0x"+log.topics[1].slice(-40).toLowerCase();
    const t1 = "0x"+log.topics[2].slice(-40).toLowerCase();
    const fee = parseInt(log.topics[3]||"0",16);
    const poolData = log.data||"";
    const pool = "0x"+poolData.slice(-40).toLowerCase();
    const ts = parseInt(log.timeStamp||"0",16)||Math.floor(Date.now()/1000);
    const blk = parseInt(log.blockNumber||"0",16);
    const newToken  = !BASE_TOKENS.has(t0)?t0:!BASE_TOKENS.has(t1)?t1:null;
    const baseToken = newToken===t0?t1:t0;
    return { pool, t0, t1, newToken, baseToken, fee, createdAt:ts, blockNumber:blk, txHash:log.transactionHash };
  }).filter(p=>p.newToken);
}

export async function detectSMBuysOnPool(pool, newToken, fromBlock) {
  const transfers = await esGet({
    module:"account", action:"tokentx",
    address:pool,
    startblock:fromBlock, endblock:"latest",
    page:1, offset:300, sort:"asc",
  },[]);
  if (!Array.isArray(transfers)) return [];
  const buyers = new Map();
  for (const tx of transfers) {
    if (tx.contractAddress?.toLowerCase()!==newToken) continue;
    const to = tx.to?.toLowerCase();
    if (SM_ADDRESSES.has(to)) {
      if (!buyers.has(to)) buyers.set(to,{wallet:SM_BY_ADDR[to],txHash:tx.hash,ts:Number(tx.timeStamp),value:tx.value,gasPrice:tx.gasPrice});
    }
  }
  return [...buyers.values()];
}

export async function getTokenMeta(address) {
  const [txList, tokenTx] = await Promise.all([
    esGet({module:"account",action:"txlist",address,startblock:0,endblock:99999999,page:1,offset:20,sort:"asc"},[]),
    esGet({module:"account",action:"tokentx",address,startblock:0,endblock:99999999,page:1,offset:100,sort:"desc"},[]),
  ]);
  const isArr = Array.isArray;
  const deployer = isArr(txList)&&txList[0]?.from ? txList[0].from.toLowerCase() : null;
  const deployTs = isArr(txList)&&txList[0]?.timeStamp ? Number(txList[0].timeStamp) : null;
  const symbol   = isArr(tokenTx)&&tokenTx[0]?.tokenSymbol || "???";
  const name     = isArr(tokenTx)&&tokenTx[0]?.tokenName   || "Unknown Token";
  const holders  = isArr(tokenTx) ? new Set(tokenTx.map(t=>t.to?.toLowerCase())).size : 0;
  const totalTxs = isArr(tokenTx) ? tokenTx.length : 0;
  return { address, deployer, deployTs, symbol, name, holders, totalTxs };
}

export function calcTokenRisk(meta, fee) {
  let score=0; const flags=[];
  if (meta.deployTs) {
    const h=(Date.now()/1000-meta.deployTs)/3600;
    if (h<1){score+=35;flags.push("< 1h old");}
    else if(h<6){score+=20;flags.push("< 6h old");}
    else if(h<24){score+=10;flags.push("< 24h old");}
    else if(h<72){score+=5;flags.push("< 3d old");}
  }
  if (meta.holders<5){score+=25;flags.push("< 5 holders");}
  else if(meta.holders<15){score+=12;flags.push("< 15 holders");}
  if (fee>=10000){score+=20;flags.push("1% fee pool");}
  else if(fee>=3000){score+=5;}
  if (meta.totalTxs<10){score+=10;flags.push("< 10 txs");}
  score+=10; flags.push("unverified");
  return {score:Math.min(score,100),flags};
}

export async function calcDevRisk(devAddr) {
  if (!devAddr) return {score:60,flags:["unknown deployer"],label:"Unknown",agedays:0,txCount:0};
  const txs = await esGet({module:"account",action:"txlist",address:devAddr,startblock:0,endblock:99999999,page:1,offset:100,sort:"asc"},[]);
  if (!Array.isArray(txs)||!txs.length) return {score:70,flags:["no tx history"],label:"Ghost",agedays:0,txCount:0};
  let score=0; const flags=[];
  const firstTs=Number(txs[0].timeStamp||0);
  const agedays=Math.round((Date.now()/1000-firstTs)/86400);
  const txCount=txs.length;
  const deploys=txs.filter(t=>!t.to&&t.contractAddress).length;
  const funder=txs[0].from?.toLowerCase();
  if(agedays<7){score+=35;flags.push(`wallet ${agedays}d old`);}
  else if(agedays<30){score+=20;flags.push(`wallet ${agedays}d old`);}
  if(deploys>10){score+=15;flags.push(`${deploys} contracts deployed`);}
  if(txCount<5){score+=15;flags.push(`only ${txCount} txs`);}
  if(funder===TORNADO){score+=50;flags.push("funded via Tornado Cash");}
  const label=score>=70?"High Risk":score>=40?"Caution":score>=15?"Normal":"Clean";
  return {score:Math.min(score,100),flags,label,agedays,txCount};
}

export async function runPipeline(hoursBack=24, onProgress=()=>{}) {
  onProgress({phase:"pools",text:"Scanning new Uniswap V3 pools…",pct:5});
  const pools = await fetchNewPools(hoursBack);
  onProgress({phase:"pools",text:`${pools.length} new pools found — detecting SM buys…`,pct:15});
  if (!pools.length) return [];

  const tokenMap = new Map();
  const BATCH=4;
  for (let i=0;i<pools.length;i+=BATCH) {
    const slice=pools.slice(i,i+BATCH);
    await Promise.all(slice.map(async p=>{
      const buyers=await detectSMBuysOnPool(p.pool,p.newToken,p.blockNumber);
      if (!buyers.length) return;
      if (!tokenMap.has(p.newToken)) tokenMap.set(p.newToken,{
        address:p.newToken, pool:p.pool, baseToken:p.baseToken,
        baseName:BASE_NAMES[p.baseToken]||shortHex(p.baseToken),
        fee:p.fee, createdAt:p.createdAt, poolAge:Math.floor((Date.now()/1000-p.createdAt)/60),
        txHash:p.txHash, smBuyers:[],
        smCount:0,tier1Count:0,
        symbol:"?",name:"?",holders:0,
        tokenRisk:null,devRisk:null,deployer:null,
      });
      const e=tokenMap.get(p.newToken);
      for (const b of buyers) if (!e.smBuyers.find(x=>x.wallet.address===b.wallet.address)) e.smBuyers.push(b);
    }));
    const pct=15+Math.round((i/pools.length)*50);
    onProgress({phase:"scan",text:`Scanned ${Math.min(i+BATCH,pools.length)}/${pools.length} pools — ${tokenMap.size} tokens with SM buys`,pct});
  }

  const tokens=[...tokenMap.values()].sort((a,b)=>b.smBuyers.length-a.smBuyers.length);
  onProgress({phase:"enrich",text:`Enriching ${tokens.length} token(s) with metadata…`,pct:70});

  for (const tok of tokens.slice(0,15)) {
    const meta=await getTokenMeta(tok.address);
    tok.symbol=meta.symbol; tok.name=meta.name;
    tok.holders=meta.holders; tok.deployer=meta.deployer;
    tok.tokenRisk=calcTokenRisk(meta,tok.fee);
    tok.smCount=tok.smBuyers.length;
    tok.tier1Count=tok.smBuyers.filter(b=>b.wallet.tier===1).length;
    if (meta.deployer) tok.devRisk=await calcDevRisk(meta.deployer);
    else tok.devRisk={score:50,flags:["unknown"],label:"?",agedays:0,txCount:0};
  }
  for (const tok of tokens.slice(15)) {
    tok.smCount=tok.smBuyers.length;
    tok.tier1Count=tok.smBuyers.filter(b=>b.wallet.tier===1).length;
    tok.tokenRisk={score:50,flags:["not enriched"]};
    tok.devRisk={score:50,flags:[],label:"?"};
  }

  onProgress({phase:"done",text:`Done — ${tokens.length} token(s) tracked`,pct:100});
  return tokens;
}

const shortHex = (h) => h?`${h.slice(0,6)}…${h.slice(-4)}`:"?";

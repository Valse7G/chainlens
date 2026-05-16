/**
 * ChainLens — Smart Money Intelligence Page
 * Live feed of new tokens being bought by tracked SM wallets.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { SMART_MONEY, TIER_META } from "../data/smartmoney.js";
import { runPipeline, setEngineKey } from "../engine/smartMoneyEngine.js";

const T = {
  bg:"#060a14", bg1:"#0a1020", bg2:"#0f1830",
  border:"#162040", border2:"#1e3a6a",
  cyan:"#00f5d4", red:"#ff4466", amber:"#ffc200",
  purple:"#b39dfa", green:"#3ddba0", blue:"#70b5ff", pink:"#f080f8",
  text:"#f0f4ff", sub:"#a0b4cc", muted:"#6a8aaa", dim:"#2a4060",
};

const shortAddr = (a) => a ? `${a.slice(0,6)}…${a.slice(-4)}` : "?";
const fmt = (n,d=2) => Number(n).toFixed(d);
const timeAgo = (ts) => {
  const m = Math.floor((Date.now()/1000 - ts) / 60);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m/60)}h ${m%60}m ago`;
};
const feeLabel = (f) => f>=10000?"1%":f>=3000?"0.3%":f>=500?"0.05%":"0.01%";

// Risk badge
function RiskBadge({score, label, size=10}) {
  const col = score>=70?T.red:score>=40?T.amber:score>=15?T.green:"#4ade80";
  const bg  = col+"18";
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:4,
      border:`1px solid ${col}50`,background:bg,fontSize:size,fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:col,flexShrink:0}}/>
      <span style={{color:col}}>{label||"?"}</span>
      <span style={{color:T.muted}}>{score}/100</span>
    </span>
  );
}

// Tier badge
function TierBadge({tier}) {
  const m = TIER_META[tier]||{color:T.muted,icon:"·",label:"?"};
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"1px 6px",borderRadius:3,
      border:`1px solid ${m.color}50`,background:m.color+"15",fontSize:9,
      fontFamily:"'IBM Plex Mono',monospace",color:m.color,whiteSpace:"nowrap"}}>
      {m.icon} {m.label}
    </span>
  );
}

// SM Wallet pills
function SMWallets({buyers}) {
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
      {buyers.map(b=>{
        const m=TIER_META[b.wallet.tier]||{color:T.muted};
        return (
          <span key={b.wallet.address} title={b.wallet.name}
            style={{padding:"2px 8px",borderRadius:3,background:m.color+"18",border:`1px solid ${m.color}40`,
              fontSize:9,color:m.color,fontFamily:"'IBM Plex Mono',monospace",cursor:"default",whiteSpace:"nowrap"}}>
            {b.wallet.name||shortAddr(b.wallet.address)}
          </span>
        );
      })}
    </div>
  );
}

// Token card
function TokenCard({tok, rank, onAnalyze, t}) {
  const [expanded, setExpanded] = useState(false);
  const isHot  = tok.tier1Count > 0;
  const glow   = isHot ? `0 0 20px ${T.red}30` : tok.smCount>=3 ? `0 0 14px ${T.amber}20` : "none";
  const border = isHot ? T.red : tok.smCount>=3 ? T.amber : tok.smCount>=2 ? T.purple : T.border;

  return (
    <div style={{background:T.bg1,border:`1px solid ${border}`,borderRadius:12,
      overflow:"hidden",boxShadow:glow,transition:"box-shadow 0.3s"}}>
      {/* Header row */}
      <div style={{padding:"14px 16px",display:"grid",
        gridTemplateColumns:"36px 1fr auto auto",gap:12,alignItems:"center",cursor:"pointer"}}
        onClick={()=>setExpanded(v=>!v)}>
        {/* Rank */}
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:rank<=3?T.amber:T.dim,lineHeight:1,textAlign:"center"}}>
          {rank<=3?"★":rank}
        </div>
        {/* Token identity */}
        <div style={{minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
            <span style={{fontWeight:700,fontSize:14,color:T.text}}>{tok.symbol}</span>
            <span style={{color:T.muted,fontSize:11}}>{tok.name!=="Unknown Token"?tok.name:""}</span>
            {isHot&&<span style={{fontSize:10,color:T.red,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.1em"}}>⚡ ALPHA SIGNAL</span>}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:9,color:T.muted,fontFamily:"'IBM Plex Mono',monospace"}}>{shortAddr(tok.address)}</span>
            <span style={{fontSize:9,color:T.dim}}>·</span>
            <span style={{fontSize:9,color:T.sub,fontFamily:"'IBM Plex Mono',monospace"}}>
              paired {tok.baseName}
            </span>
            <span style={{fontSize:9,color:T.dim}}>·</span>
            <span style={{fontSize:9,color:T.muted,fontFamily:"'IBM Plex Mono',monospace"}}>
              {feeLabel(tok.fee)} fee
            </span>
            <span style={{fontSize:9,color:T.dim}}>·</span>
            <span style={{fontSize:9,color:T.muted,fontFamily:"'IBM Plex Mono',monospace"}}>
              pool {timeAgo(tok.createdAt)}
            </span>
          </div>
        </div>
        {/* SM count */}
        <div style={{textAlign:"center",flexShrink:0}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,
            color:isHot?T.red:tok.smCount>=3?T.amber:T.purple,lineHeight:1}}>{tok.smCount}</div>
          <div style={{fontSize:8,color:T.muted,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.1em"}}>SM WALLETS</div>
        </div>
        {/* Expand arrow */}
        <div style={{color:T.dim,fontSize:16,transform:expanded?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</div>
      </div>

      {/* Risk strip */}
      <div style={{padding:"8px 16px",background:T.bg2,borderTop:`1px solid ${T.border}`,
        display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:9,color:T.muted,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.1em",marginRight:4}}>TOKEN RISK</span>
        {tok.tokenRisk && <RiskBadge score={tok.tokenRisk.score} label={tok.tokenRisk.score>=70?"High Risk":tok.tokenRisk.score>=40?"Caution":"Low"}/>}
        {tok.tokenRisk?.flags?.slice(0,3).map(f=>(
          <span key={f} style={{fontSize:8,color:T.dim,fontFamily:"'IBM Plex Mono',monospace",padding:"1px 5px",background:T.bg,borderRadius:3,border:`1px solid ${T.border}`}}>{f}</span>
        ))}
        <span style={{flex:1}}/>
        <span style={{fontSize:9,color:T.muted,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.1em",marginRight:4}}>DEV WALLET</span>
        {tok.devRisk && <RiskBadge score={tok.devRisk.score} label={tok.devRisk.label}/>}
      </div>

      {/* SM buyers strip */}
      <div style={{padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
        <div style={{fontSize:9,color:T.muted,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.1em",marginBottom:6}}>SMART MONEY BUYERS</div>
        <SMWallets buyers={tok.smBuyers}/>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{padding:"12px 16px",borderTop:`1px solid ${T.border}`,background:"rgba(0,0,0,0.2)"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10,marginBottom:12}}>
            {[
              ["Holders",tok.holders||"?",T.cyan],
              ["Pool Age",`${tok.poolAge}m`,T.blue],
              ["Fee Tier",feeLabel(tok.fee),T.purple],
              ["Tier 1 Buyers",tok.tier1Count,T.red],
              ["Dev Age",tok.devRisk?.agedays?`${tok.devRisk.agedays}d`:"?",T.amber],
              ["Dev Txs",tok.devRisk?.txCount||"?",T.green],
            ].map(([label,val,col])=>(
              <div key={label} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:7,padding:"10px 12px",borderTop:`2px solid ${col}`}}>
                <div style={{fontSize:8,color:T.muted,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.14em",marginBottom:4}}>{label}</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:col,lineHeight:1}}>{val}</div>
              </div>
            ))}
          </div>
          {/* Risk flags */}
          {tok.tokenRisk?.flags?.length>0 && (
            <div style={{marginBottom:8}}>
              <div style={{fontSize:8,color:T.muted,fontFamily:"'IBM Plex Mono',monospace",marginBottom:5}}>TOKEN RISK FLAGS</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {tok.tokenRisk.flags.map(f=>(
                  <span key={f} style={{fontSize:9,color:T.amber,fontFamily:"'IBM Plex Mono',monospace",
                    padding:"2px 7px",background:T.amber+"12",border:`1px solid ${T.amber}30`,borderRadius:3}}>{f}</span>
                ))}
              </div>
            </div>
          )}
          {tok.devRisk?.flags?.length>0 && (
            <div style={{marginBottom:12}}>
              <div style={{fontSize:8,color:T.muted,fontFamily:"'IBM Plex Mono',monospace",marginBottom:5}}>DEV WALLET FLAGS</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {tok.devRisk.flags.map(f=>(
                  <span key={f} style={{fontSize:9,color:T.red,fontFamily:"'IBM Plex Mono',monospace",
                    padding:"2px 7px",background:T.red+"12",border:`1px solid ${T.red}30`,borderRadius:3}}>{f}</span>
                ))}
              </div>
            </div>
          )}
          {/* Actions */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>onAnalyze(tok.address)}
              style={{padding:"7px 16px",background:T.cyan+"18",border:`1px solid ${T.cyan}40`,borderRadius:5,
                color:T.cyan,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",cursor:"pointer"}}>
              Analyze Token →
            </button>
            {tok.deployer&&<button onClick={()=>onAnalyze(tok.deployer)}
              style={{padding:"7px 16px",background:T.red+"12",border:`1px solid ${T.red}30`,borderRadius:5,
                color:T.red,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",cursor:"pointer"}}>
              Analyze Dev Wallet →
            </button>}
            <a href={`https://etherscan.io/address/${tok.address}`} target="_blank" rel="noreferrer"
              style={{padding:"7px 16px",background:"transparent",border:`1px solid ${T.border2}`,borderRadius:5,
                color:T.muted,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",textDecoration:"none"}}>
              Etherscan ↗
            </a>
            <a href={`https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=${tok.address}`} target="_blank" rel="noreferrer"
              style={{padding:"7px 16px",background:T.pink+"10",border:`1px solid ${T.pink}30`,borderRadius:5,
                color:T.pink,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",textDecoration:"none"}}>
              Trade on Uniswap ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Live activity ticker ───────────────────────────────────────────────
function LiveTicker({events}) {
  if (!events.length) return null;
  return (
    <div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,
      padding:"8px 14px",marginBottom:16,overflow:"hidden",position:"relative"}}>
      <div style={{display:"flex",gap:0,overflowX:"auto",scrollbarWidth:"none"}}>
        {events.slice(-12).map((ev,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"0 16px",borderRight:`1px solid ${T.border}`,flexShrink:0}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:TIER_META[ev.tier]?.color||T.cyan,flexShrink:0,animation:"pulse 1.5s ease-in-out infinite"}}/>
            <span style={{color:TIER_META[ev.tier]?.color||T.cyan,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>
              {ev.name}
            </span>
            <span style={{color:T.muted,fontSize:10,fontFamily:"'IBM Plex Mono',monospace"}}>bought</span>
            <span style={{color:T.amber,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600}}>{ev.symbol}</span>
            <span style={{color:T.dim,fontSize:9}}>{timeAgo(ev.ts)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
const AUTO_REFRESH_SEC = 120;

export default function PageSmartMoney({onAnalyze, devKey, t}) {
  const [tokens,    setTokens]    = useState([]);
  const [events,    setEvents]    = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [progress,  setProgress]  = useState({text:"", pct:0});
  const [hours,     setHours]     = useState(24);
  const [lastUpdate,setLastUpdate]= useState(null);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SEC);
  const [autoRefresh,setAutoRefresh]=useState(false);
  const [sortBy,    setSortBy]    = useState("smCount");
  const [filterTier,setFilterTier]= useState(0); // 0=all
  const timerRef = useRef(null);
  const cdRef    = useRef(null);

  const run = useCallback(async() => {
    setLoading(true);
    setEngineKey(devKey||"");
    try {
      const result = await runPipeline(hours, (p)=>setProgress(p));
      setTokens(result);
      // Build live events from SM buys
      const evts = result.flatMap(tok =>
        tok.smBuyers.map(b=>({
          name: b.wallet.name, tier: b.wallet.tier,
          symbol: tok.symbol, ts: b.ts,
        }))
      ).sort((a,b)=>b.ts-a.ts);
      setEvents(prev=>[...prev.slice(-50),...evts.filter(e=>!prev.find(p=>p.name===e.name&&p.symbol===e.symbol))]);
      setLastUpdate(Date.now());
    } catch(e) { console.error("[SM Page]",e); }
    finally { setLoading(false); setProgress({text:"",pct:0}); }
  },[hours,devKey]);

  // Auto-refresh countdown
  useEffect(()=>{
    if (!autoRefresh) { clearInterval(timerRef.current); clearInterval(cdRef.current); return; }
    setCountdown(AUTO_REFRESH_SEC);
    cdRef.current = setInterval(()=>setCountdown(c=>Math.max(0,c-1)),1000);
    timerRef.current = setInterval(run, AUTO_REFRESH_SEC*1000);
    return ()=>{ clearInterval(timerRef.current); clearInterval(cdRef.current); };
  },[autoRefresh,run]);

  useEffect(()=>{ if(autoRefresh&&countdown===0) setCountdown(AUTO_REFRESH_SEC); },[countdown,autoRefresh]);

  const sorted = [...tokens]
    .filter(tok=>filterTier===0||tok.smBuyers.some(b=>b.wallet.tier===filterTier))
    .sort((a,b)=>sortBy==="smCount"?b.smCount-a.smCount:sortBy==="tokenRisk"?b.tokenRisk?.score-a.tokenRisk?.score:b.tier1Count-a.tier1Count);

  // Summary stats
  const totalSM     = new Set(tokens.flatMap(tok=>tok.smBuyers.map(b=>b.wallet.address))).size;
  const tier1Tokens = tokens.filter(t=>t.tier1Count>0).length;
  const highRisk    = tokens.filter(t=>t.tokenRisk?.score>=70).length;

  return (
    <div className="page-wrap">
      {/* ── Header ── */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,lineHeight:1,marginBottom:4}}>
              SMART MONEY <span style={{color:T.cyan}}>INTELLIGENCE</span>
            </div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:T.muted}}>
              New token buys by tracked wallets · Uniswap V3 · Live from Etherscan
            </div>
          </div>
          {lastUpdate&&(
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:T.dim,textAlign:"right"}}>
              <div>Last scan: {new Date(lastUpdate).toLocaleTimeString()}</div>
              {autoRefresh&&<div style={{color:T.cyan}}>Auto-refresh in {countdown}s</div>}
            </div>
          )}
        </div>
      </div>

      {/* ── Live ticker ── */}
      <LiveTicker events={events}/>

      {/* ── Controls ── */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        {/* Period */}
        {[6,12,24,48].map(h=>(
          <button key={h} onClick={()=>setHours(h)} style={{
            padding:"6px 14px",background:hours===h?T.cyan+"20":"transparent",
            border:`1px solid ${hours===h?T.cyan:T.border2}`,borderRadius:5,
            color:hours===h?T.cyan:T.muted,cursor:"pointer",fontSize:10,
            fontFamily:"'IBM Plex Mono',monospace"}}>
            {h}H
          </button>
        ))}
        <div style={{width:1,height:20,background:T.border,margin:"0 4px"}}/>
        {/* Sort */}
        {[["smCount","SM COUNT"],["tier1Count","TIER 1"],["tokenRisk","RISK"]].map(([k,l])=>(
          <button key={k} onClick={()=>setSortBy(k)} style={{
            padding:"6px 12px",background:sortBy===k?T.purple+"20":"transparent",
            border:`1px solid ${sortBy===k?T.purple:T.border}`,borderRadius:5,
            color:sortBy===k?T.purple:T.muted,cursor:"pointer",fontSize:9,
            fontFamily:"'IBM Plex Mono',monospace"}}>
            {l}
          </button>
        ))}
        <div style={{width:1,height:20,background:T.border,margin:"0 4px"}}/>
        {/* Tier filter */}
        {[[0,"ALL"],[1,"⚡ ALPHA"],[2,"💼 FUND"],[3,"👁 KNOWN"]].map(([tier,label])=>(
          <button key={tier} onClick={()=>setFilterTier(tier)} style={{
            padding:"5px 10px",background:filterTier===tier?(TIER_META[tier]?.color||T.cyan)+"20":"transparent",
            border:`1px solid ${filterTier===tier?(TIER_META[tier]?.color||T.cyan):T.border}`,borderRadius:5,
            color:filterTier===tier?(TIER_META[tier]?.color||T.cyan):T.muted,
            cursor:"pointer",fontSize:9,fontFamily:"'IBM Plex Mono',monospace"}}>
            {label}
          </button>
        ))}
        <div style={{flex:1}}/>
        {/* Auto-refresh */}
        <button onClick={()=>setAutoRefresh(v=>!v)} style={{
          padding:"6px 14px",background:autoRefresh?T.green+"20":"transparent",
          border:`1px solid ${autoRefresh?T.green:T.border2}`,borderRadius:5,
          color:autoRefresh?T.green:T.muted,cursor:"pointer",fontSize:10,
          fontFamily:"'IBM Plex Mono',monospace",display:"flex",alignItems:"center",gap:6}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:autoRefresh?T.green:T.muted,
            animation:autoRefresh?"pulse 1s ease-in-out infinite":"none"}}/>
          {autoRefresh?"LIVE ON":"LIVE OFF"}
        </button>
        {/* Scan button */}
        <button onClick={run} disabled={loading} style={{
          padding:"8px 22px",background:loading?T.bg2:`linear-gradient(135deg,${T.cyan},#0066ff)`,
          border:"none",borderRadius:6,color:loading?T.muted:T.bg,
          fontWeight:700,cursor:loading?"not-allowed":"pointer",
          fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:"0.1em",
          display:"flex",alignItems:"center",gap:8}}>
          {loading?"SCANNING…":"SCAN NOW"}
        </button>
      </div>

      {/* ── Progress bar ── */}
      {loading&&(
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:11,color:T.muted,fontFamily:"'IBM Plex Mono',monospace"}}>{progress.text}</span>
            <span style={{fontSize:11,color:T.cyan,fontFamily:"'IBM Plex Mono',monospace"}}>{progress.pct||0}%</span>
          </div>
          <div style={{height:3,background:T.bg2,borderRadius:2}}>
            <div style={{height:"100%",background:`linear-gradient(90deg,${T.cyan},${T.blue})`,
              borderRadius:2,width:`${progress.pct||0}%`,transition:"width 0.4s ease"}}/>
          </div>
        </div>
      )}

      {/* ── Summary stats ── */}
      {tokens.length>0&&!loading&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,marginBottom:16}}>
          {[
            ["Tokens Detected",tokens.length,T.cyan],
            ["SM Wallets Active",totalSM,T.green],
            ["⚡ Alpha Signals",tier1Tokens,T.red],
            ["High Risk Tokens",highRisk,T.amber],
          ].map(([label,val,col])=>(
            <div key={label} style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,
              padding:"12px 14px",borderTop:`2px solid ${col}`}}>
              <div style={{fontSize:8,color:T.sub,fontFamily:"'IBM Plex Mono',monospace",
                textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:6}}>{label}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:col,lineHeight:1}}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Token cards ── */}
      {sorted.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {sorted.map((tok,i)=>(
            <TokenCard key={tok.address} tok={tok} rank={i+1} onAnalyze={onAnalyze} t={t}/>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading&&tokens.length===0&&(
        <div style={{textAlign:"center",padding:"80px 0",borderRadius:12,
          border:`1px dashed ${T.border}`,background:T.bg1}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:52,color:T.dim,marginBottom:12}}>
            SMART MONEY FEED
          </div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:T.muted,lineHeight:2,marginBottom:20}}>
            Tracks new Uniswap V3 pools + SM wallet buys in real-time<br/>
            Select a window (6H / 12H / 24H / 48H) and click SCAN NOW
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
            {SMART_MONEY.slice(0,8).map(w=>(
              <span key={w.address} style={{padding:"4px 10px",background:TIER_META[w.tier]?.color+"15",
                border:`1px solid ${TIER_META[w.tier]?.color}35`,borderRadius:4,
                fontSize:9,color:TIER_META[w.tier]?.color,fontFamily:"'IBM Plex Mono',monospace"}}>
                {TIER_META[w.tier]?.icon} {w.name}
              </span>
            ))}
            <span style={{fontSize:9,color:T.dim,fontFamily:"'IBM Plex Mono',monospace",padding:"4px 10px"}}>
              + {SMART_MONEY.length-8} more wallets tracked
            </span>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

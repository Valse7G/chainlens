/**
 * ChainLens — Smart Money Intelligence Page v2.1.1
 * Receives pre-computed state from App root (timers persist across navigation).
 */
import { useState, useMemo } from "react";
import { SMART_MONEY, TIER_META } from "../data/smartmoney.js";

const T = {
  bg:"#060a14", bg1:"#0c1224", bg2:"#111a30",
  border:"#1e3050", border2:"#2a4878",
  cyan:"#00f5d4", red:"#ff4466", amber:"#ffc200",
  purple:"#b39dfa", green:"#3ddba0", blue:"#70b5ff", pink:"#f080f8",
  text:"#ffffff", sub:"#c8d8f0", muted:"#8aaccc", dim:"#3a5878",
};

const shortAddr = (a) => a ? `${a.slice(0,6)}…${a.slice(-4)}` : "?";
const feeLabel  = (f) => f>=10000?"1%":f>=3000?"0.3%":f>=500?"0.05%":"0.01%";
const timeAgo   = (ts) => {
  const m=Math.floor((Date.now()/1000-ts)/60);
  if(m<1)return"just now"; if(m<60)return`${m}m ago`;
  return`${Math.floor(m/60)}h ${m%60}m ago`;
};

function RiskBadge({score,label}) {
  const col=score>=70?T.red:score>=40?T.amber:score>=15?T.green:"#4ade80";
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:4,
      border:`1px solid ${col}55`,background:col+"18",fontSize:10,
      fontFamily:"'IBM Plex Mono',monospace",whiteSpace:"nowrap"}}>
      <span style={{width:5,height:5,borderRadius:"50%",background:col,flexShrink:0}}/>
      <span style={{color:col,fontWeight:600}}>{label||"?"}</span>
      <span style={{color:T.muted}}>{score}/100</span>
    </span>
  );
}

function SMWallets({buyers}) {
  return(
    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
      {buyers.map(b=>{
        const m=TIER_META[b.wallet.tier]||{color:T.muted};
        return(
          <span key={b.wallet.address} title={b.wallet.address}
            style={{padding:"3px 9px",borderRadius:4,background:m.color+"20",
              border:`1px solid ${m.color}50`,fontSize:9,color:m.color,
              fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,whiteSpace:"nowrap"}}>
            {m.icon} {b.wallet.name||shortAddr(b.wallet.address)}
          </span>
        );
      })}
    </div>
  );
}

function TokenCard({tok,rank,onAnalyze}) {
  const [expanded,setExpanded]=useState(false);
  const isHot  = tok.tier1Count>0;
  const border = isHot?T.red:tok.smCount>=3?T.amber:tok.smCount>=2?T.purple:T.border2;
  const glow   = isHot?`0 0 20px ${T.red}30`:tok.smCount>=3?`0 0 14px ${T.amber}20`:"none";

  return(
    <div style={{background:T.bg1,border:`1px solid ${border}`,borderRadius:12,
      overflow:"hidden",boxShadow:glow,marginBottom:0}}>
      {/* Main row */}
      <div style={{padding:"14px 16px",display:"grid",
        gridTemplateColumns:"40px 1fr auto 24px",gap:12,alignItems:"center",cursor:"pointer"}}
        onClick={()=>setExpanded(v=>!v)}>
        {/* Rank */}
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,
          color:rank<=3?T.amber:T.dim,lineHeight:1,textAlign:"center"}}>
          {rank<=3?"★":rank}
        </div>
        {/* Token info */}
        <div style={{minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
            <span style={{fontWeight:700,fontSize:15,color:T.text}}>{tok.symbol||"???"}</span>
            {tok.name&&tok.name!=="Unknown Token"&&<span style={{color:T.sub,fontSize:11}}>{tok.name}</span>}
            {isHot&&<span style={{fontSize:9,color:T.red,fontFamily:"'IBM Plex Mono',monospace",
              letterSpacing:"0.1em",background:T.red+"15",padding:"1px 6px",borderRadius:3}}>⚡ ALPHA</span>}
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <span className="mono" style={{fontSize:9,color:T.muted}}>{shortAddr(tok.address)}</span>
            <span style={{color:T.dim}}>·</span>
            <span className="mono" style={{fontSize:9,color:T.sub}}>/{tok.baseName}</span>
            <span style={{color:T.dim}}>·</span>
            <span className="mono" style={{fontSize:9,color:T.muted}}>{feeLabel(tok.fee)}</span>
            <span style={{color:T.dim}}>·</span>
            <span className="mono" style={{fontSize:9,color:T.muted}}>{timeAgo(tok.createdAt)}</span>
          </div>
        </div>
        {/* SM count */}
        <div style={{textAlign:"center",flexShrink:0}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:34,lineHeight:1,
            color:isHot?T.red:tok.smCount>=3?T.amber:T.purple}}>{tok.smCount}</div>
          <div className="mono" style={{fontSize:8,color:T.muted,letterSpacing:"0.1em"}}>SM</div>
        </div>
        <div style={{color:T.dim,fontSize:14,transform:expanded?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</div>
      </div>

      {/* Risk strip */}
      <div style={{padding:"8px 16px",background:T.bg2,borderTop:`1px solid ${T.border}`,
        display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <span className="mono" style={{fontSize:8,color:T.muted,letterSpacing:"0.12em"}}>TOKEN</span>
        {tok.tokenRisk&&<RiskBadge score={tok.tokenRisk.score}
          label={tok.tokenRisk.score>=70?"High":tok.tokenRisk.score>=40?"Med":"Low"}/>}
        {tok.tokenRisk?.flags?.slice(0,2).map(f=>(
          <span key={f} className="mono" style={{fontSize:8,color:T.dim,padding:"1px 6px",
            background:T.bg,borderRadius:3,border:`1px solid ${T.border}`}}>{f}</span>
        ))}
        <span style={{flex:1}}/>
        <span className="mono" style={{fontSize:8,color:T.muted,letterSpacing:"0.12em"}}>DEV</span>
        {tok.devRisk&&<RiskBadge score={tok.devRisk.score} label={tok.devRisk.label}/>}
      </div>

      {/* SM buyers */}
      <div style={{padding:"10px 16px",borderTop:`1px solid ${T.border}`}}>
        <div className="mono" style={{fontSize:8,color:T.muted,letterSpacing:"0.12em",marginBottom:6}}>SMART MONEY BUYERS</div>
        <SMWallets buyers={tok.smBuyers}/>
      </div>

      {/* Expanded detail */}
      {expanded&&(
        <div style={{padding:"14px 16px",borderTop:`1px solid ${T.border}`,background:"rgba(0,0,0,0.25)"}}>
          {/* Stats grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8,marginBottom:14}}>
            {[
              ["Holders",tok.holders||"?",T.cyan],
              ["Pool Age",`${tok.poolAge}m`,T.blue],
              ["Fee Tier",feeLabel(tok.fee),T.purple],
              ["Tier 1 Alpha",tok.tier1Count,T.red],
              ["Dev Wallet Age",tok.devRisk?.agedays?`${tok.devRisk.agedays}d`:"?",T.amber],
              ["Dev Tx Count",tok.devRisk?.txCount||"?",T.green],
            ].map(([label,val,col])=>(
              <div key={label} style={{background:T.bg,border:`1px solid ${T.border}`,
                borderRadius:7,padding:"10px 12px",borderTop:`2px solid ${col}`}}>
                <div className="mono" style={{fontSize:8,color:T.muted,letterSpacing:"0.12em",marginBottom:4}}>{label}</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:col,lineHeight:1}}>{val}</div>
              </div>
            ))}
          </div>
          {/* Risk flags */}
          {(tok.tokenRisk?.flags?.length>0||tok.devRisk?.flags?.length>0)&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <div>
                <div className="mono" style={{fontSize:8,color:T.muted,marginBottom:5}}>TOKEN FLAGS</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {tok.tokenRisk?.flags?.map(f=>(
                    <span key={f} className="mono" style={{fontSize:9,color:T.amber,padding:"2px 7px",
                      background:T.amber+"12",border:`1px solid ${T.amber}30`,borderRadius:3}}>{f}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="mono" style={{fontSize:8,color:T.muted,marginBottom:5}}>DEV FLAGS</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {tok.devRisk?.flags?.map(f=>(
                    <span key={f} className="mono" style={{fontSize:9,color:T.red,padding:"2px 7px",
                      background:T.red+"12",border:`1px solid ${T.red}30`,borderRadius:3}}>{f}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* Action buttons */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>onAnalyze(tok.address)}
              style={{padding:"7px 14px",background:T.cyan+"18",border:`1px solid ${T.cyan}50`,
                borderRadius:5,color:T.cyan,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",cursor:"pointer",fontWeight:600}}>
              Analyze Token →
            </button>
            {tok.deployer&&(
              <button onClick={()=>onAnalyze(tok.deployer)}
                style={{padding:"7px 14px",background:T.red+"12",border:`1px solid ${T.red}35`,
                  borderRadius:5,color:T.red,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",cursor:"pointer"}}>
                Analyze Dev →
              </button>
            )}
            <a href={`https://etherscan.io/address/${tok.address}`} target="_blank" rel="noreferrer"
              style={{padding:"7px 14px",background:"transparent",border:`1px solid ${T.border2}`,
                borderRadius:5,color:T.muted,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",textDecoration:"none"}}>
              Etherscan ↗
            </a>
            <a href={`https://app.uniswap.org/#/swap?outputCurrency=${tok.address}`} target="_blank" rel="noreferrer"
              style={{padding:"7px 14px",background:T.pink+"10",border:`1px solid ${T.pink}30`,
                borderRadius:5,color:T.pink,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",textDecoration:"none"}}>
              Trade ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function LiveTicker({events}) {
  if(!events.length) return null;
  return(
    <div style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,
      padding:"8px 14px",marginBottom:16,overflowX:"auto",scrollbarWidth:"none"}}>
      <div style={{display:"flex",gap:0,minWidth:"max-content"}}>
        {events.slice(-12).map((ev,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"0 14px",
            borderRight:`1px solid ${T.border}`,flexShrink:0}}>
            <span style={{width:6,height:6,borderRadius:"50%",
              background:TIER_META[ev.tier]?.color||T.cyan,
              animation:"pulse 1.5s ease-in-out infinite",flexShrink:0}}/>
            <span className="mono" style={{color:TIER_META[ev.tier]?.color||T.cyan,fontSize:10,fontWeight:600}}>{ev.name}</span>
            <span className="mono" style={{color:T.muted,fontSize:10}}>bought</span>
            <span className="mono" style={{color:T.amber,fontSize:10,fontWeight:700}}>{ev.symbol}</span>
            <span className="mono" style={{color:T.dim,fontSize:9}}>{timeAgo(ev.ts)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PageSmartMoney({cache,loading,progress,tfId,countdown,timeframes,onTfChange,onScan,onAnalyze,t}) {
  const [sortBy,    setSortBy]    = useState("smCount");
  const [filterTier,setFilterTier]= useState(0);

  const cacheEntry = cache[tfId];
  const tokens     = cacheEntry?.tokens || [];
  const events     = cacheEntry?.events || [];
  const lastUpdate = cacheEntry?.ts     || null;

  const sorted = useMemo(()=>[...tokens]
    .filter(tok=>filterTier===0||tok.smBuyers.some(b=>b.wallet.tier===filterTier))
    .sort((a,b)=>sortBy==="smCount"?b.smCount-a.smCount:sortBy==="tokenRisk"?b.tokenRisk?.score-a.tokenRisk?.score:b.tier1Count-a.tier1Count)
  ,[tokens,sortBy,filterTier]);

  const totalSM     = new Set(tokens.flatMap(tok=>tok.smBuyers.map(b=>b.wallet.address))).size;
  const tier1Tokens = tokens.filter(t=>t.tier1Count>0).length;
  const highRisk    = tokens.filter(t=>t.tokenRisk?.score>=70).length;
  const fmtCd = (s)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  return(
    <div className="page-wrap">
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:16}}>
        <div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,lineHeight:1,marginBottom:4,color:T.text}}>
            SMART MONEY <span style={{color:T.cyan}}>INTELLIGENCE</span>
          </div>
          <div className="mono" style={{fontSize:10,color:T.muted}}>
            New token buys by tracked wallets · Uniswap V3 · Etherscan live
          </div>
        </div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:T.muted,textAlign:"right"}}>
          {lastUpdate&&<div style={{color:T.sub,marginBottom:2}}>Last scan ({tfId}): {new Date(lastUpdate).toLocaleTimeString()}</div>}
          <div style={{color:T.dim}}>Auto-scan every 3 min · {SMART_MONEY.length} wallets tracked</div>
        </div>
      </div>

      <LiveTicker events={events}/>

      {/* Controls */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        {/* TF tabs */}
        {timeframes.map(tf=>{
          const hasData=!!cache[tf.id];
          return(
            <button key={tf.id} onClick={()=>onTfChange(tf.id)}
              className="mono"
              style={{padding:"6px 14px",background:tfId===tf.id?T.cyan+"22":"transparent",
                border:`1px solid ${tfId===tf.id?T.cyan:hasData?T.border2:T.border}`,
                borderRadius:5,color:tfId===tf.id?T.cyan:hasData?T.sub:T.muted,
                cursor:"pointer",fontSize:10,position:"relative"}}>
              {tf.label}
              {hasData&&<span style={{position:"absolute",top:-3,right:-3,width:6,height:6,
                borderRadius:"50%",background:T.green,border:`2px solid ${T.bg}`}}/>}
            </button>
          );
        })}

        <div style={{width:1,height:20,background:T.border}}/>

        {/* Sort */}
        {[["smCount","SM COUNT"],["tier1Count","TIER 1"],["tokenRisk","RISK"]].map(([k,l])=>(
          <button key={k} onClick={()=>setSortBy(k)} className="mono"
            style={{padding:"5px 10px",background:sortBy===k?T.purple+"22":"transparent",
              border:`1px solid ${sortBy===k?T.purple:T.border}`,borderRadius:5,
              color:sortBy===k?T.purple:T.muted,cursor:"pointer",fontSize:9}}>
            {l}
          </button>
        ))}

        <div style={{width:1,height:20,background:T.border}}/>

        {/* Tier filter */}
        {[[0,"ALL"],[1,"⚡ ALPHA"],[2,"💼 FUND"],[3,"👁 KNOWN"]].map(([tier,label])=>(
          <button key={tier} onClick={()=>setFilterTier(tier)} className="mono"
            style={{padding:"5px 10px",background:filterTier===tier?(TIER_META[tier]?.color||T.cyan)+"22":"transparent",
              border:`1px solid ${filterTier===tier?(TIER_META[tier]?.color||T.cyan):T.border}`,
              borderRadius:5,color:filterTier===tier?(TIER_META[tier]?.color||T.cyan):T.muted,
              cursor:"pointer",fontSize:9}}>
            {label}
          </button>
        ))}

        <div style={{flex:1}}/>

        {/* Countdown */}
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",
          background:T.bg1,border:`1px solid ${T.border2}`,borderRadius:5}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:T.green,
            animation:"pulse 1s ease-in-out infinite",flexShrink:0}}/>
          <span className="mono" style={{fontSize:9,color:T.green,whiteSpace:"nowrap"}}>
            LIVE · {fmtCd(countdown)}
          </span>
        </div>

        <button onClick={onScan} disabled={loading}
          style={{padding:"7px 18px",background:loading?T.bg2:`linear-gradient(135deg,${T.cyan},#0066ff)`,
            border:"none",borderRadius:6,color:loading?T.muted:"#060a14",fontWeight:700,
            cursor:loading?"not-allowed":"pointer",fontFamily:"'Bebas Neue',sans-serif",
            fontSize:14,letterSpacing:"0.1em"}}>
          {loading?"SCANNING…":"SCAN NOW"}
        </button>
      </div>

      {/* Progress */}
      {loading&&(
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span className="mono" style={{fontSize:11,color:T.muted}}>{progress.text}</span>
            <span className="mono" style={{fontSize:11,color:T.cyan}}>{progress.pct||0}%</span>
          </div>
          <div style={{height:3,background:T.bg2,borderRadius:2}}>
            <div style={{height:"100%",background:`linear-gradient(90deg,${T.cyan},${T.blue})`,
              borderRadius:2,width:`${progress.pct||0}%`,transition:"width 0.4s ease"}}/>
          </div>
        </div>
      )}

      {/* Summary stats */}
      {tokens.length>0&&!loading&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8,marginBottom:16}}>
          {[["Tokens",tokens.length,T.cyan],["SM Active",totalSM,T.green],["⚡ Alpha",tier1Tokens,T.red],["High Risk",highRisk,T.amber]].map(([label,val,col])=>(
            <div key={label} style={{background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,
              padding:"12px 14px",borderTop:`2px solid ${col}`}}>
              <div className="mono" style={{fontSize:8,color:T.sub,textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:6}}>{label}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:col,lineHeight:1}}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Token cards */}
      {sorted.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {sorted.map((tok,i)=>(
            <TokenCard key={tok.address} tok={tok} rank={i+1} onAnalyze={onAnalyze}/>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading&&tokens.length===0&&(
        <div style={{textAlign:"center",padding:"60px 0",borderRadius:12,
          border:`1px dashed ${T.border}`,background:T.bg1}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:T.dim,marginBottom:12}}>SMART MONEY FEED</div>
          <div className="mono" style={{fontSize:11,color:T.muted,lineHeight:2,marginBottom:16}}>
            Auto-scanning Uniswap V3 new pools every 3 minutes<br/>
            Tracking {SMART_MONEY.length} smart money wallets
          </div>
          <div style={{display:"flex",justifyContent:"center",gap:6,flexWrap:"wrap"}}>
            {SMART_MONEY.slice(0,8).map(w=>(
              <span key={w.address} className="mono"
                style={{padding:"4px 10px",background:(TIER_META[w.tier]?.color||T.cyan)+"18",
                  border:`1px solid ${(TIER_META[w.tier]?.color||T.cyan)+"40"}`,borderRadius:4,
                  fontSize:9,color:TIER_META[w.tier]?.color||T.cyan,fontWeight:600}}>
                {TIER_META[w.tier]?.icon} {w.name}
              </span>
            ))}
            <span className="mono" style={{fontSize:9,color:T.dim,padding:"4px 8px"}}>
              +{SMART_MONEY.length-8} more
            </span>
          </div>
        </div>
      )}

      <style>{\`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}\`}</style>
    </div>
  );
}

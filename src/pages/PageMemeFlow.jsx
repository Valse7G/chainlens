/**
 * ChainLens — Smart Meme Flow Terminal
 * Bloomberg Terminal for Meme Smart Money.
 * Tracks insider/whale activity on memecoins → runner detection.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MEMECOINS }     from "../data/memecoins.js";
import { SMART_MONEY, TIER_META } from "../data/smartmoney.js";

const T = {
  bg:"#060a14", bg1:"#0c1224", bg2:"#111a30",
  border:"#1e3050", border2:"#2a4878",
  cyan:"#00f5d4", red:"#ff4466", amber:"#ffc200",
  purple:"#b39dfa", green:"#3ddba0", blue:"#70b5ff", pink:"#f080f8",
  text:"#ffffff", sub:"#c8d8f0", muted:"#8aaccc", dim:"#3a5878",
};

const LEVEL_COLOR  = { EXTREME:"#ff4466", HIGH:"#ffc200", MEDIUM:"#b39dfa", WATCH:"#70b5ff", LOW:"#3a5878" };
const LEVEL_BG     = { EXTREME:"#ff446618", HIGH:"#ffc20018", MEDIUM:"#b39dfa18", WATCH:"#70b5ff18", LOW:"#3a587818" };

const shortAddr = (a) => a ? `${a.slice(0,6)}…${a.slice(-4)}` : "?";
const timeAgo   = (ts) => {
  const m = Math.floor((Date.now()/1000 - ts) / 60);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m/60)}h ${m%60}m ago`;
};

// ── Signal badge ──────────────────────────────────────────────────────
function SignalBadge({ label, score, triggered, color }) {
  const col = triggered ? color : T.dim;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 8px",
      background: triggered ? color+"15" : T.bg2,
      border:`1px solid ${triggered ? color+"50" : T.border}`, borderRadius:5 }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:col, flexShrink:0,
        animation: triggered ? "pulse 1.5s ease-in-out infinite" : "none" }}/>
      <span className="mono" style={{ fontSize:8, color:col, letterSpacing:"0.08em" }}>{label}</span>
      {score > 0 && <span className="mono" style={{ fontSize:8, color:triggered ? col : T.dim }}>{score}</span>}
    </div>
  );
}

// ── Runner card ───────────────────────────────────────────────────────
function RunnerCard({ tok, rank, onAnalyze }) {
  const [expanded, setExpanded] = useState(false);
  const col   = LEVEL_COLOR[tok.level] || T.dim;
  const bg    = LEVEL_BG[tok.level]    || T.bg1;
  const isHot = tok.level === "EXTREME" || tok.level === "HIGH";

  return (
    <div style={{ background:T.bg1, border:`1px solid ${col}`, borderRadius:12,
      overflow:"hidden", boxShadow: isHot ? `0 0 24px ${col}25` : "none",
      animation: isHot ? "none" : "none" }}>

      {/* Rank + header */}
      <div style={{ padding:"14px 16px", display:"grid",
        gridTemplateColumns:"44px 1fr auto 120px 28px", gap:10, alignItems:"center",
        cursor:"pointer" }} onClick={()=>setExpanded(v=>!v)}>

        {/* Rank + level */}
        <div style={{ textAlign:"center" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22,
            color:rank<=3?T.amber:T.dim, lineHeight:1 }}>
            {rank<=3?"★":rank}
          </div>
          <div className="mono" style={{ fontSize:7, color:col, letterSpacing:"0.1em",
            background:col+"20", borderRadius:3, padding:"1px 4px", marginTop:2 }}>
            {tok.level}
          </div>
        </div>

        {/* Token identity */}
        <div style={{ minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
            <span style={{ fontWeight:700, fontSize:15, color:T.text }}>{tok.symbol}</span>
            <span style={{ color:T.sub, fontSize:11 }}>{tok.name}</span>
            {isHot && <span className="mono" style={{ fontSize:8, color:T.red,
              background:T.red+"15", padding:"1px 6px", borderRadius:3, letterSpacing:"0.1em" }}>
              🚀 RUNNER SIGNAL
            </span>}
          </div>
          <div className="mono" style={{ fontSize:9, color:T.muted }}>{shortAddr(tok.address)}</div>
        </div>

        {/* Runner score ring */}
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <svg width={52} height={52} viewBox="0 0 52 52">
            <circle cx={26} cy={26} r={20} fill="none" stroke={T.bg2} strokeWidth={5}/>
            <circle cx={26} cy={26} r={20} fill="none" stroke={col} strokeWidth={5}
              strokeDasharray={`${2*Math.PI*20*tok.runnerScore/100} ${2*Math.PI*20}`}
              strokeLinecap="round" transform="rotate(-90 26 26)"/>
          </svg>
          <div style={{ marginTop:-40, textAlign:"center" }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:col, lineHeight:1 }}>{tok.runnerScore}</div>
            <div className="mono" style={{ fontSize:7, color:T.dim }}>SIGNAL</div>
          </div>
        </div>

        {/* Buyer pills */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
          {tok.buyers.slice(0,4).map((b,i) => {
            const tierColor = b.isSmartMoney ? T.red : b.tier<=2 ? T.amber : b.tier<=3 ? T.blue : T.muted;
            return (
              <span key={i} className="mono" title={b.address}
                style={{ fontSize:7, padding:"2px 6px", borderRadius:3,
                  background:tierColor+"18", border:`1px solid ${tierColor}40`, color:tierColor,
                  whiteSpace:"nowrap", fontWeight:600 }}>
                {b.smName || shortAddr(b.address)}
              </span>
            );
          })}
          {tok.buyers.length > 4 && <span className="mono" style={{ fontSize:7, color:T.dim }}>+{tok.buyers.length-4}</span>}
        </div>

        <div style={{ color:T.dim, fontSize:14,
          transform:expanded?"rotate(180deg)":"none", transition:"transform 0.2s" }}>▾</div>
      </div>

      {/* Signal strip */}
      <div style={{ padding:"8px 16px", background:T.bg2, borderTop:`1px solid ${T.border}`,
        display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
        {tok.signal1 && <SignalBadge label="CLUSTER" score={tok.signal1.score} triggered={tok.signal1.triggered} color={T.red}/>}
        {tok.signal2 && <SignalBadge label="1ST ENTRY" score={tok.signal2.score} triggered={tok.signal2.triggered} color={T.amber}/>}
        {tok.signal3 && <SignalBadge label="ROTATION" score={tok.signal3.score} triggered={tok.signal3.triggered} color={T.purple}/>}
        {tok.signal4 && <SignalBadge label="QUALITY" score={tok.signal4.score} triggered={tok.signal4.triggered} color={T.blue}/>}
        <div style={{ flex:1 }}/>
        <span className="mono" style={{ fontSize:9, color:T.muted }}>
          {tok.buyers.length} insider{tok.buyers.length>1?"s":""} · last {timeAgo(tok.lastBuyTs)}
        </span>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ padding:"14px 16px", borderTop:`1px solid ${T.border}`, background:"rgba(0,0,0,0.2)" }}>
          {/* Buyer table */}
          <div className="mono" style={{ fontSize:8, color:T.muted, letterSpacing:"0.12em", marginBottom:8 }}>INSIDER BUYERS</div>
          <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:14 }}>
            {tok.buyers.map((b, i) => {
              const tierColor = b.isSmartMoney ? T.red : b.tier<=2 ? T.amber : T.blue;
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
                  padding:"7px 10px", background:T.bg, borderRadius:6, border:`1px solid ${T.border}` }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:tierColor, flexShrink:0 }}/>
                  <span className="mono" style={{ color:tierColor, fontSize:10, fontWeight:600, minWidth:80 }}>
                    {b.smName || shortAddr(b.address)}
                  </span>
                  {b.memecoins?.length>0 && (
                    <div style={{ display:"flex", gap:3 }}>
                      {b.memecoins.slice(0,3).map(m => (
                        <span key={m} className="mono" style={{ fontSize:8, color:T.muted,
                          background:T.bg2, padding:"1px 5px", borderRadius:3 }}>{m}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ flex:1 }}/>
                  <span className="mono" style={{ fontSize:8, color:T.dim }}>{timeAgo(b.buyTs)}</span>
                  <button onClick={()=>onAnalyze(b.address)}
                    style={{ padding:"3px 8px", background:"transparent", border:`1px solid ${T.border2}`,
                      borderRadius:4, color:T.muted, fontSize:8, fontFamily:"'IBM Plex Mono',monospace", cursor:"pointer" }}>
                    ANALYZE
                  </button>
                </div>
              );
            })}
          </div>
          {/* Signal breakdown */}
          {tok.breakdown && (
            <div style={{ marginBottom:12 }}>
              <div className="mono" style={{ fontSize:8, color:T.muted, marginBottom:6 }}>SCORE BREAKDOWN</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))", gap:6 }}>
                {[
                  ["Cluster",tok.breakdown.s1,T.red],
                  ["1st Entry",tok.breakdown.s2,T.amber],
                  ["Rotation",tok.breakdown.s3,T.purple],
                  ["Quality",tok.breakdown.s4,T.blue],
                  ["SM Bonus",tok.breakdown.smBonus,T.cyan],
                  ["Tier1",tok.breakdown.tier1Bonus,T.pink],
                ].map(([label,val,color])=>(
                  <div key={label} style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:6, padding:"7px 10px" }}>
                    <div className="mono" style={{ fontSize:7, color:T.muted, marginBottom:3 }}>{label}</div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, color, lineHeight:1 }}>{Math.round(val)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Actions */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button onClick={()=>onAnalyze(tok.address)}
              style={{ padding:"7px 14px", background:T.cyan+"18", border:`1px solid ${T.cyan}50`,
                borderRadius:5, color:T.cyan, fontSize:10, fontFamily:"'IBM Plex Mono',monospace", cursor:"pointer", fontWeight:600 }}>
              Analyze Token →
            </button>
            <a href={`https://dexscreener.com/ethereum/${tok.address}`} target="_blank" rel="noreferrer"
              style={{ padding:"7px 14px", background:T.green+"12", border:`1px solid ${T.green}35`,
                borderRadius:5, color:T.green, fontSize:10, fontFamily:"'IBM Plex Mono',monospace", textDecoration:"none" }}>
              DexScreener ↗
            </a>
            <a href={`https://app.uniswap.org/#/swap?outputCurrency=${tok.address}`} target="_blank" rel="noreferrer"
              style={{ padding:"7px 14px", background:T.pink+"10", border:`1px solid ${T.pink}35`,
                borderRadius:5, color:T.pink, fontSize:10, fontFamily:"'IBM Plex Mono',monospace", textDecoration:"none" }}>
              Trade ↗
            </a>
            <a href={`https://etherscan.io/token/${tok.address}`} target="_blank" rel="noreferrer"
              style={{ padding:"7px 14px", background:"transparent", border:`1px solid ${T.border2}`,
                borderRadius:5, color:T.muted, fontSize:10, fontFamily:"'IBM Plex Mono',monospace", textDecoration:"none" }}>
              Etherscan ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Insider table ─────────────────────────────────────────────────────
function InsiderTable({ insiders, smartScores, onAnalyze }) {
  return (
    <div style={{ background:T.bg1, border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ display:"grid", gridTemplateColumns:"32px 1fr 80px 80px 80px 1fr 70px",
        padding:"10px 14px", background:T.bg2, borderBottom:`1px solid ${T.border}` }}>
        {["#","WALLET","SMART SCORE","WIN%","ENTRY","MEMECOINS","ACTION"].map(h=>(
          <div key={h} className="mono" style={{ fontSize:8, color:T.muted, letterSpacing:"0.1em" }}>{h}</div>
        ))}
      </div>
      {insiders.slice(0,30).map((ins, i) => {
        const ss = smartScores.find(s => s.address === ins.address);
        const score = ss?.smartScore || 0;
        const scoreCol = score>=70?T.red:score>=50?T.amber:score>=30?T.blue:T.muted;
        return (
          <div key={ins.address} className="row-hover"
            style={{ display:"grid", gridTemplateColumns:"32px 1fr 80px 80px 80px 1fr 70px",
              padding:"10px 14px", borderBottom:`1px solid ${T.border}`, background:"transparent" }}>
            <div className="mono" style={{ color:i<3?T.amber:T.dim, fontSize:10 }}>{i+1}</div>
            <div style={{ minWidth:0 }}>
              <div className="mono" style={{ color:T.sub, fontSize:10, fontWeight:600 }}>
                {ins.smData?.name || shortAddr(ins.address)}
              </div>
              {ins.isSmartMoney && <span style={{ fontSize:8, color:T.red, fontFamily:"'IBM Plex Mono',monospace" }}>⚡ SM Registry</span>}
            </div>
            <div>
              <div style={{ height:3, background:T.bg2, borderRadius:2, marginBottom:3 }}>
                <div style={{ height:"100%", background:scoreCol, borderRadius:2, width:`${score}%`, transition:"width 0.5s" }}/>
              </div>
              <div className="mono" style={{ fontSize:10, color:scoreCol, fontWeight:600 }}>{score}</div>
            </div>
            <div className="mono" style={{ fontSize:10, color:T.green }}>{ss?.winrate||"?"}%</div>
            <div className="mono" style={{ fontSize:10, color:T.purple }}>{ss?.earlyEntryScore||"?"}%</div>
            <div style={{ display:"flex", gap:3, flexWrap:"wrap", overflow:"hidden" }}>
              {ins.memecoins.slice(0,4).map(m=>(
                <span key={m.symbol} className="mono" style={{ fontSize:7, padding:"1px 5px",
                  background:T.bg2, borderRadius:3, color:T.muted }}>{m.icon}{m.symbol}</span>
              ))}
            </div>
            <button onClick={()=>onAnalyze(ins.address)}
              style={{ padding:"4px 8px", background:"transparent", border:`1px solid ${T.cyan}40`,
                borderRadius:4, color:T.cyan, fontSize:8, fontFamily:"'IBM Plex Mono',monospace", cursor:"pointer" }}>
              ANALYZE
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
const AUTO_SCAN_MS = 5 * 60 * 1000; // 5 min

export default function PageMemeFlow({ onAnalyze, devKey, t }) {
  const [view,       setView]      = useState("runners"); // runners | insiders | memecoins
  const [runners,    setRunners]   = useState([]);
  const [insiders,   setInsiders]  = useState([]);
  const [smartScores,setSmartScores]=useState([]);
  const [loading,    setLoading]   = useState(false);
  const [progress,   setProgress]  = useState({ text:"", pct:0 });
  const [hours,      setHours]     = useState(24);
  const [levelFilter,setLevelFilter]=useState("ALL");
  const [lastUpdate, setLastUpdate]= useState(null);
  const [countdown,  setCountdown] = useState(AUTO_SCAN_MS/1000);
  const [liveEvents, setLiveEvents]= useState([]);
  const scanRef = useRef(null);
  const cdRef   = useRef(null);
  const hoursRef= useRef(24);
  useEffect(()=>{ hoursRef.current=hours; },[hours]);

  const run = useCallback(async() => {
    setLoading(true);
    try {
      // Dynamic imports to avoid circular deps
      const { runMemePipeline, setMemeKey } = await import("../engine/memeWhaleEngine.js");
      const { batchSmartScore, setScoreKey } = await import("../engine/smartScoreEngine.js");
      const { enrichSignals } = await import("../engine/signalEngine.js");

      setMemeKey(devKey||"");
      setScoreKey(devKey||"");

      // Step 1: build insiders + raw signals
      const { insiders: rawInsiders, signals: rawSignals } = await runMemePipeline(
        hoursRef.current,
        (p) => setProgress(p)
      );
      setInsiders(rawInsiders);

      // Step 2: score top 20 wallets
      setProgress({ text:"Computing smart scores…", pct:88 });
      const topAddrs  = rawInsiders.slice(0,20).map(i=>i.address);
      const scores    = await batchSmartScore(topAddrs, (p)=>setProgress({...p, pct:88+p.pct*0.1}));
      setSmartScores(scores);

      // Step 3: enrich with 5 signals
      setProgress({ text:"Running signal engine…", pct:98 });
      const enriched  = enrichSignals(rawSignals, rawInsiders, scores);
      setRunners(enriched);

      // Live events feed
      const newEvts = enriched.slice(0,5).map(tok=>({
        symbol:  tok.symbol,
        level:   tok.level,
        buyers:  tok.buyCount,
        score:   tok.runnerScore,
        ts:      Date.now()/1000,
      }));
      setLiveEvents(prev=>[...newEvts,...prev].slice(0,20));
      setLastUpdate(Date.now());
    } catch(e) { console.error("[MemeFlow]",e); }
    finally { setLoading(false); setProgress({text:"",pct:0}); }
  },[devKey]);

  // Auto-scan every 5 min
  useEffect(()=>{
    run();
    setCountdown(AUTO_SCAN_MS/1000);
    cdRef.current = setInterval(()=>setCountdown(c=>{
      if(c<=1){ run(); return AUTO_SCAN_MS/1000; }
      return c-1;
    }),1000);
    scanRef.current = setInterval(run, AUTO_SCAN_MS);
    return()=>{ clearInterval(scanRef.current); clearInterval(cdRef.current); };
  // eslint-disable-next-line
  },[]);

  const filtered = useMemo(()=>{
    if(levelFilter==="ALL") return runners;
    return runners.filter(r=>r.level===levelFilter);
  },[runners,levelFilter]);

  // Stats
  const extremeCount = runners.filter(r=>r.level==="EXTREME").length;
  const highCount    = runners.filter(r=>r.level==="HIGH").length;
  const smActive     = new Set(insiders.flatMap(i=>i.recentBuys?.length>0?[i.address]:[])).size;
  const fmtCd = (s)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  return (
    <div className="page-wrap">
      {/* Header */}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:28,lineHeight:1,marginBottom:4,color:T.text }}>
            SMART MEME <span style={{ color:T.amber }}>FLOW</span>
          </div>
          <div className="mono" style={{ fontSize:10,color:T.muted }}>
            Insider & whale tracking across {MEMECOINS.length} memecoins · Runner signal detection
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          {lastUpdate&&<div className="mono" style={{ fontSize:9,color:T.sub,marginBottom:2 }}>Updated {new Date(lastUpdate).toLocaleTimeString()}</div>}
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background:T.green,animation:"pulse 1s ease-in-out infinite" }}/>
            <span className="mono" style={{ fontSize:9,color:T.green }}>LIVE · {fmtCd(countdown)}</span>
          </div>
        </div>
      </div>

      {/* Live event ticker */}
      {liveEvents.length>0&&(
        <div style={{ background:T.bg1,border:`1px solid ${T.border}`,borderRadius:8,
          padding:"8px 14px",marginBottom:16,overflowX:"auto",scrollbarWidth:"none" }}>
          <div style={{ display:"flex",gap:0,minWidth:"max-content" }}>
            {liveEvents.slice(0,10).map((ev,i)=>{
              const col=LEVEL_COLOR[ev.level]||T.dim;
              return(
                <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"0 16px",borderRight:`1px solid ${T.border}`,flexShrink:0 }}>
                  <span style={{ width:5,height:5,borderRadius:"50%",background:col,animation:"pulse 2s ease-in-out infinite" }}/>
                  <span className="mono" style={{ color:T.amber,fontSize:10,fontWeight:700 }}>{ev.symbol}</span>
                  <span className="mono" style={{ color:col,fontSize:9 }}>{ev.level}</span>
                  <span className="mono" style={{ color:T.muted,fontSize:9 }}>{ev.buyers}B · {ev.score}pt</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
        {/* View tabs */}
        {[["runners","🚀 RUNNERS"],["insiders","👤 INSIDERS"],["memecoins","🔥 MEMECOINS"]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} className="mono"
            style={{ padding:"6px 14px",background:view===v?T.cyan+"22":"transparent",
              border:`1px solid ${view===v?T.cyan:T.border2}`,borderRadius:5,
              color:view===v?T.cyan:T.muted,cursor:"pointer",fontSize:10 }}>
            {l}
          </button>
        ))}
        <div style={{ width:1,height:20,background:T.border }}/>
        {/* Hours */}
        {[6,12,24,48].map(h=>(
          <button key={h} onClick={()=>{ hoursRef.current=h; setHours(h); }} className="mono"
            style={{ padding:"5px 10px",background:hours===h?T.purple+"22":"transparent",
              border:`1px solid ${hours===h?T.purple:T.border}`,borderRadius:5,
              color:hours===h?T.purple:T.muted,cursor:"pointer",fontSize:9 }}>
            {h}H
          </button>
        ))}
        <div style={{ width:1,height:20,background:T.border }}/>
        {/* Level filter */}
        {["ALL","EXTREME","HIGH","MEDIUM","WATCH"].map(l=>(
          <button key={l} onClick={()=>setLevelFilter(l)} className="mono"
            style={{ padding:"5px 10px",background:levelFilter===l?(LEVEL_COLOR[l]||T.cyan)+"22":"transparent",
              border:`1px solid ${levelFilter===l?(LEVEL_COLOR[l]||T.cyan):T.border}`,borderRadius:5,
              color:levelFilter===l?(LEVEL_COLOR[l]||T.cyan):T.muted,cursor:"pointer",fontSize:9 }}>
            {l}
          </button>
        ))}
        <div style={{ flex:1 }}/>
        <button onClick={run} disabled={loading}
          style={{ padding:"8px 20px",background:loading?T.bg2:`linear-gradient(135deg,${T.amber},${T.red})`,
            border:"none",borderRadius:6,color:loading?T.muted:"#060a14",fontWeight:700,
            cursor:loading?"not-allowed":"pointer",fontFamily:"'Bebas Neue',sans-serif",fontSize:15,letterSpacing:"0.1em" }}>
          {loading?"SCANNING…":"SCAN NOW"}
        </button>
      </div>

      {/* Progress */}
      {loading&&(
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
            <span className="mono" style={{ fontSize:11,color:T.muted }}>{progress.text}</span>
            <span className="mono" style={{ fontSize:11,color:T.amber }}>{progress.pct||0}%</span>
          </div>
          <div style={{ height:3,background:T.bg2,borderRadius:2 }}>
            <div style={{ height:"100%",background:`linear-gradient(90deg,${T.amber},${T.red})`,
              borderRadius:2,width:`${progress.pct||0}%`,transition:"width 0.4s ease" }}/>
          </div>
        </div>
      )}

      {/* Stats */}
      {runners.length>0&&!loading&&(
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8,marginBottom:16 }}>
          {[
            ["🚀 Extreme",extremeCount,T.red],
            ["⚡ High Signal",highCount,T.amber],
            ["👤 SM Active",smActive,T.cyan],
            ["📊 Runners",runners.length,T.purple],
          ].map(([label,val,col])=>(
            <div key={label} style={{ background:T.bg1,border:`1px solid ${T.border}`,
              borderRadius:8,padding:"12px 14px",borderTop:`2px solid ${col}` }}>
              <div className="mono" style={{ fontSize:8,color:T.sub,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6 }}>{label}</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:col,lineHeight:1 }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── RUNNERS view ── */}
      {view==="runners"&&(
        <>
          {filtered.length>0&&(
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {filtered.map((tok,i)=>(
                <RunnerCard key={tok.address} tok={tok} rank={i+1} onAnalyze={onAnalyze}/>
              ))}
            </div>
          )}
          {!loading&&runners.length===0&&(
            <div style={{ textAlign:"center",padding:"60px 0",border:`1px dashed ${T.border}`,borderRadius:12,background:T.bg1 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:44,color:T.dim,marginBottom:12 }}>SMART MEME FLOW</div>
              <div className="mono" style={{ fontSize:11,color:T.muted,lineHeight:2,marginBottom:16 }}>
                Tracking {SMART_MONEY.length} SM wallets + memecoin insiders<br/>
                Detecting cluster buys, rotations, first entries…<br/>
                Select a time window and click SCAN NOW
              </div>
              <div style={{ display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap" }}>
                {MEMECOINS.map(m=>(
                  <span key={m.symbol} className="mono"
                    style={{ padding:"4px 10px",background:T.bg2,border:`1px solid ${T.border2}`,
                      borderRadius:4,fontSize:9,color:T.sub,fontWeight:600 }}>
                    {m.icon} {m.symbol}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── INSIDERS view ── */}
      {view==="insiders"&&insiders.length>0&&(
        <InsiderTable insiders={insiders} smartScores={smartScores} onAnalyze={onAnalyze}/>
      )}
      {view==="insiders"&&!loading&&insiders.length===0&&(
        <div className="mono" style={{ textAlign:"center",padding:"40px",color:T.muted }}>Run a scan to populate insider registry</div>
      )}

      {/* ── MEMECOINS view ── */}
      {view==="memecoins"&&(
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12 }}>
          {MEMECOINS.map(coin=>{
            const coinInsiders = insiders.filter(ins=>ins.memecoins.some(m=>m.address===coin.address));
            return(
              <div key={coin.symbol} style={{ background:T.bg1,border:`1px solid ${T.border}`,
                borderRadius:10,padding:16,borderTop:`2px solid ${T.amber}` }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
                  <span style={{ fontSize:28 }}>{coin.icon}</span>
                  <div>
                    <div style={{ fontWeight:700,fontSize:15,color:T.text }}>{coin.symbol}</div>
                    <div style={{ color:T.sub,fontSize:11 }}>{coin.name}</div>
                  </div>
                  <div style={{ marginLeft:"auto",textAlign:"right" }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:T.amber,lineHeight:1 }}>{coinInsiders.length}</div>
                    <div className="mono" style={{ fontSize:8,color:T.muted }}>INSIDERS</div>
                  </div>
                </div>
                <div style={{ color:T.muted,fontSize:11,lineHeight:1.5,marginBottom:12 }}>{coin.notes}</div>
                <div style={{ display:"flex",gap:8 }}>
                  <button onClick={()=>onAnalyze(coin.address)}
                    style={{ flex:1,padding:"7px",background:T.amber+"15",border:`1px solid ${T.amber}40`,
                      borderRadius:5,color:T.amber,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",cursor:"pointer",fontWeight:600 }}>
                    ANALYZE TOKEN →
                  </button>
                  <a href={`https://etherscan.io/token/${coin.address}`} target="_blank" rel="noreferrer"
                    style={{ padding:"7px 10px",background:"transparent",border:`1px solid ${T.border2}`,
                      borderRadius:5,color:T.muted,fontSize:10,fontFamily:"'IBM Plex Mono',monospace",textDecoration:"none" }}>↗</a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

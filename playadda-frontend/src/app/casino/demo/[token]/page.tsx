"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";

// ─── Shared helpers ───────────────────────────────────────────────────────────
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const RED = new Set(["♥","♦"]);

function rand(n: number) { return Math.floor(Math.random() * n); }
function newCard() { return { rank: RANKS[rand(13)], suit: SUITS[rand(4)] }; }

function Card({ r, s, hidden, size = "md" }: { r?: string; s?: string; hidden?: boolean; size?: "sm"|"md"|"lg" }) {
  const sizes = { sm:"w-9 h-12 text-sm", md:"w-12 h-16 text-base", lg:"w-16 h-22 text-xl" } as const;
  const red = RED.has(s ?? "");
  return (
    <div className={`${sizes[size]} rounded-lg flex flex-col items-center justify-center font-black select-none shadow-lg border flex-shrink-0 ${hidden ? "bg-gradient-to-br from-blue-900 to-blue-800 border-blue-600" : "bg-white border-gray-200"}`}
      style={{ height: size==="lg"?"88px": size==="sm"?"48px":"64px" }}>
      {hidden ? <span className="text-2xl opacity-60">🂠</span> : (
        <div className={`text-center leading-none ${red?"text-red-600":"text-gray-900"}`}>
          <div style={{fontSize: size==="lg"?"18px":size==="sm"?"11px":"14px"}}>{r}</div>
          <div style={{fontSize: size==="lg"?"20px":size==="sm"?"14px":"17px"}}>{s}</div>
        </div>
      )}
    </div>
  );
}

function Chip({ val, onClick, selected }: { val: number; onClick: ()=>void; selected: boolean }) {
  const colors: Record<number,string> = { 10:"from-gray-400 to-gray-600", 50:"from-blue-500 to-blue-700", 100:"from-green-500 to-green-700", 500:"from-red-500 to-red-700", 1000:"from-purple-500 to-purple-700" };
  return (
    <button onClick={onClick}
      className={`w-12 h-12 rounded-full bg-gradient-to-b ${colors[val]||"from-gray-500 to-gray-700"} border-4 ${selected?"border-yellow-400 scale-110":"border-white/30"} text-white text-xs font-black shadow-lg transition-all hover:scale-105`}>
      {val>=1000?`${val/1000}K`:val}
    </button>
  );
}

// ─── ROULETTE ─────────────────────────────────────────────────────────────────
const RN_RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const WHEEL_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];

function RouletteGame({ bal, stake, onR }: { bal: number; stake: number; onR: (d: number)=>void }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number|null>(null);
  const [bets, setBets] = useState<Record<string,number>>({});
  const [rot, setRot] = useState(0);
  const [ballRot, setBallRot] = useState(0);
  const ivRef = useRef<NodeJS.Timeout|null>(null);

  const placeBet = (key: string) => {
    if (spinning) return;
    setBets(b => ({ ...b, [key]: (b[key]||0) + stake }));
    onR(-stake);
  };

  const spin = () => {
    if (spinning || Object.keys(bets).length === 0) return;
    setSpinning(true);
    setResult(null);
    const num = WHEEL_ORDER[rand(37)];
    const idx = WHEEL_ORDER.indexOf(num);
    const targetRot = 1440 + idx * (360/37);
    const targetBall = 720 - idx * (360/37);
    let t = 0;
    const dur = 4000;
    const start = Date.now();
    ivRef.current = setInterval(() => {
      t = Math.min(1, (Date.now()-start)/dur);
      const ease = 1 - Math.pow(1-t, 4);
      setRot(targetRot * ease);
      setBallRot(targetBall * ease);
      if (t >= 1) {
        clearInterval(ivRef.current!);
        setResult(num);
        // Payout
        let win = 0;
        const isRed = RN_RED.has(num);
        if (bets["red"] && isRed) win += bets["red"] * 2;
        if (bets["black"] && !isRed && num!==0) win += bets["black"] * 2;
        if (bets["even"] && num%2===0 && num!==0) win += bets["even"] * 2;
        if (bets["odd"] && num%2!==0) win += bets["odd"] * 2;
        if (bets[`n${num}`]) win += bets[`n${num}`] * 36;
        if (win > 0) onR(win);
        setBets({});
        setSpinning(false);
      }
    }, 16);
  };

  const numColor = (n: number) => n===0?"text-green-400":RN_RED.has(n)?"text-red-400":"text-white";

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg">
      {/* Wheel */}
      <div className="relative" style={{width:220,height:220}}>
        <div className="absolute inset-0 rounded-full border-4 border-yellow-600 overflow-hidden"
          style={{background:"radial-gradient(circle, #2d1b00 0%, #1a0f00 100%)"}}>
          <div style={{transform:`rotate(${rot}deg)`,transition:spinning?"none":"all 0.5s",width:"100%",height:"100%",position:"relative"}}>
            {WHEEL_ORDER.map((n,i) => {
              const angle = (i/37)*360;
              return (
                <div key={i} style={{position:"absolute",top:"50%",left:"50%",
                  transform:`rotate(${angle}deg) translateY(-80px)`,
                  transformOrigin:"0 80px", width:16, textAlign:"center"}}
                  className={`text-[9px] font-black ${n===0?"text-green-400":RN_RED.has(n)?"text-red-400":"text-gray-200"}`}>
                  {n}
                </div>
              );
            })}
          </div>
          {/* Ball */}
          <div style={{position:"absolute",top:"50%",left:"50%",transform:`rotate(${ballRot}deg) translateY(-90px) rotate(-${ballRot}deg)`,width:10,height:10,borderRadius:"50%",background:"#fff",boxShadow:"0 0 8px #fff",marginLeft:-5,marginTop:-5}} />
          {/* Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-yellow-800 border-2 border-yellow-600 flex items-center justify-center">
              {result!==null && <span className={`text-xs font-black ${numColor(result)}`}>{result}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Betting grid */}
      <div className="grid gap-1" style={{gridTemplateColumns:"repeat(6,1fr)",width:"100%"}}>
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
          <button key={n} onClick={()=>placeBet(`n${n}`)}
            className={`text-[10px] font-black py-2 rounded ${bets[`n${n}`]?"ring-2 ring-yellow-400":""} ${RN_RED.has(n)?"bg-red-700 hover:bg-red-600":"bg-gray-800 hover:bg-gray-700"} text-white`}>
            {n}{bets[`n${n}`]?<span className="block text-yellow-300">₹{bets[`n${n}`]}</span>:null}
          </button>
        ))}
      </div>
      <div className="flex gap-2 w-full">
        {([["red","🔴 RED",false],["black","⚫ BLACK",false],["even","EV",false],["odd","ODD",false]] as const).map(([k,lbl])=>(
          <button key={k} onClick={()=>placeBet(k)}
            className={`flex-1 py-2 text-xs font-black rounded ${bets[k]?"ring-2 ring-yellow-400 bg-yellow-700":"bg-gray-800 hover:bg-gray-700"} text-white`}>
            {lbl}{bets[k]?<span className="block text-yellow-300">₹{bets[k]}</span>:null}
          </button>
        ))}
      </div>

      {result !== null && (
        <div className={`text-2xl font-black ${numColor(result)} text-shadow`} style={{textShadow:`0 0 20px currentColor`}}>
          Result: {result} {RN_RED.has(result)?"🔴":"⚫"}
        </div>
      )}

      <button onClick={spin} disabled={spinning || Object.keys(bets).length===0}
        className="w-48 py-3 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black font-black text-lg rounded-full shadow-xl disabled:opacity-40 hover:scale-105 transition-transform">
        {spinning ? "⚡ SPINNING…" : "🎡 SPIN"}
      </button>
    </div>
  );
}

// ─── CRASH (AVIATOR STYLE) ────────────────────────────────────────────────────
function CrashGame({ bal, stake, onR }: { bal: number; stake: number; onR: (d: number)=>void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"idle"|"countdown"|"flying"|"crashed"|"cashed">("idle");
  const [mul, setMul] = useState(1.0);
  const [crashAt, setCrashAt] = useState(2.0);
  const [cashedAt, setCashedAt] = useState<number|null>(null);
  const ivRef = useRef<NodeJS.Timeout|null>(null);
  const mulRef = useRef(1.0);

  const drawGraph = useCallback((m: number, crashed: boolean) => {
    const c = canvasRef.current; if(!c) return;
    const ctx = c.getContext("2d")!;
    const W = c.width, H = c.height;
    ctx.clearRect(0,0,W,H);
    const pts: [number,number][] = [];
    const steps = 80;
    for (let i=0;i<=steps;i++) {
      const t = i/steps;
      const progress = t * Math.min(m-1, 8);
      pts.push([W*0.05 + t*(W*0.9), H*0.9 - progress*(H*0.08)*10]);
    }
    // Gradient fill
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, crashed?"rgba(239,68,68,0.4)":"rgba(198,255,0,0.3)");
    grad.addColorStop(1,"rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.moveTo(pts[0][0],H*0.9);
    pts.forEach(([x,y])=>ctx.lineTo(x,y));
    ctx.lineTo(pts[pts.length-1][0],H*0.9);
    ctx.fillStyle=grad; ctx.fill();
    // Line
    ctx.beginPath();
    ctx.moveTo(pts[0][0],pts[0][1]);
    pts.forEach(([x,y])=>ctx.lineTo(x,y));
    ctx.strokeStyle=crashed?"#ef4444":"#c6ff00";
    ctx.lineWidth=3; ctx.stroke();
    // Plane or crash at end
    const [px,py]=pts[pts.length-1];
    ctx.font="24px serif";
    ctx.fillText(crashed?"💥":"✈️",px-12,py-10);
  }, []);

  const start = () => {
    if (bal < stake) return;
    onR(-stake);
    const crash = 1 + Math.random() * (Math.random() < 0.3 ? 1.5 : 7);
    setCrashAt(crash); mulRef.current = 1.0;
    setMul(1.0); setCashedAt(null);
    setPhase("countdown");
    let cd = 3;
    const cdIv = setInterval(() => {
      cd--;
      if (cd <= 0) { clearInterval(cdIv); setPhase("flying"); fly(crash); }
    }, 1000);
  };

  const fly = (crash: number) => {
    let m = 1.0;
    ivRef.current = setInterval(() => {
      m += 0.04 + m * 0.012;
      mulRef.current = m;
      setMul(parseFloat(m.toFixed(2)));
      drawGraph(m, false);
      if (m >= crash) {
        clearInterval(ivRef.current!);
        setMul(parseFloat(crash.toFixed(2)));
        drawGraph(crash, true);
        setPhase("crashed");
        setTimeout(()=>setPhase("idle"),3000);
      }
    }, 80);
  };

  const cashOut = () => {
    if (phase!=="flying") return;
    clearInterval(ivRef.current!);
    const m = mulRef.current;
    const win = Math.floor(stake * m);
    setCashedAt(m); onR(win); setPhase("cashed");
    setTimeout(()=>setPhase("idle"),2500);
  };

  useEffect(()=>{ drawGraph(1,false); },[drawGraph]);

  const mulColor = phase==="crashed"?"text-red-400":phase==="cashed"?"text-yellow-400":mul>3?"text-green-300":mul>2?"text-yellow-300":"text-green-400";

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <div className="w-full rounded-2xl overflow-hidden border border-gray-800 relative" style={{background:"#0d1117"}}>
        <canvas ref={canvasRef} width={480} height={220} className="w-full" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`text-6xl font-black font-mono ${mulColor} drop-shadow-2xl`}
            style={{textShadow:`0 0 40px currentColor`}}>
            {phase==="countdown"?"Starting…":
             phase==="crashed"?`${crashAt.toFixed(2)}x 💥`:
             phase==="cashed"?`${cashedAt?.toFixed(2)}x ✅`:
             `${mul.toFixed(2)}x`}
          </div>
        </div>
        <div className="absolute bottom-2 w-full text-center text-[10px] tracking-widest font-bold text-gray-600 uppercase">
          {phase==="flying"?"🚀 FLYING — CASH OUT BEFORE IT CRASHES":
           phase==="crashed"?"💥 CRASHED — Better luck next time!":
           phase==="cashed"?`✅ Cashed out at ${cashedAt?.toFixed(2)}x = +₹${Math.floor(stake*(cashedAt??1)).toLocaleString("en-IN")}`:
           "Place your bet and start the round"}
        </div>
      </div>

      {phase==="idle" && (
        <button onClick={start} disabled={bal<stake}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white font-black text-xl shadow-xl hover:scale-105 transition-transform disabled:opacity-40">
          🚀 START ROUND  (₹{stake.toLocaleString("en-IN")})
        </button>
      )}
      {phase==="flying" && (
        <button onClick={cashOut}
          className="w-full py-4 rounded-2xl text-black font-black text-xl shadow-xl hover:scale-105 transition-transform animate-pulse"
          style={{background:"linear-gradient(135deg,#c6ff00,#84cc16)"}}>
          💰 CASH OUT  {mul.toFixed(2)}x = ₹{Math.floor(stake*mul).toLocaleString("en-IN")}
        </button>
      )}
      {(phase==="countdown"||phase==="crashed"||phase==="cashed") && (
        <div className="w-full py-4 rounded-2xl bg-gray-900 text-center text-gray-400 font-bold">
          {phase==="countdown"?"⏳ Starting in 3s…":"⏳ Next round soon…"}
        </div>
      )}
    </div>
  );
}

// ─── BLACKJACK ────────────────────────────────────────────────────────────────
function cardVal(r: string) {
  if (["J","Q","K"].includes(r)) return 10;
  if (r==="A") return 11;
  return parseInt(r);
}
function handSum(hand: {rank:string;suit:string}[]) {
  let s = hand.reduce((a,c)=>a+cardVal(c.rank),0);
  let aces = hand.filter(c=>c.rank==="A").length;
  while (s>21 && aces>0) { s-=10; aces--; }
  return s;
}

function BlackjackGame({ bal, stake, onR }: { bal: number; stake: number; onR: (d: number)=>void }) {
  const [phase, setPhase] = useState<"bet"|"playing"|"dealer"|"result">("bet");
  const [player, setPlayer] = useState<{rank:string;suit:string}[]>([]);
  const [dealer, setDealer] = useState<{rank:string;suit:string}[]>([]);
  const [msg, setMsg] = useState("");
  const [bettedStake, setBettedStake] = useState(0);

  const deal = () => {
    if (bal < stake) return;
    onR(-stake);
    setBettedStake(stake);
    const p = [newCard(), newCard()];
    const d = [newCard(), newCard()];
    setPlayer(p); setDealer(d); setPhase("playing"); setMsg("");
    if (handSum(p)===21) { setTimeout(()=>dealerTurn(p,d,stake),500); }
  };

  const hit = () => {
    if (phase!=="playing") return;
    const c = newCard();
    setPlayer(prev=>{
      const np=[...prev,c];
      if(handSum(np)>21){setMsg("💥 BUST!");setPhase("result");onR(0);return np;}
      return np;
    });
  };

  const stand = () => {
    if (phase!=="playing") return;
    setPhase("dealer");
    dealerTurn(player, dealer, bettedStake);
  };

  const dealerTurn = (p: typeof player, d: typeof dealer, s: number) => {
    let curr=[...d];
    const draw = () => {
      if (handSum(curr)<17) { curr=[...curr,newCard()]; setDealer([...curr]); setTimeout(draw,600); }
      else {
        const ps=handSum(p), ds=handSum(curr);
        const bust=ds>21;
        const bj=(ps===21&&p.length===2);
        if(bj){setMsg("🎉 BLACKJACK! 3:2");onR(Math.floor(s*2.5));}
        else if(bust||ps>ds){setMsg("🎉 YOU WIN!");onR(s*2);}
        else if(ps===ds){setMsg("🤝 PUSH");onR(s);}
        else{setMsg("❌ DEALER WINS");}
        setPhase("result");
      }
    };
    setTimeout(draw,600);
  };

  const double = () => {
    if (phase!=="playing"||bal<bettedStake) return;
    onR(-bettedStake); setBettedStake(s=>s*2);
    const c=newCard();
    const np=[...player,c];
    setPlayer(np);
    if(handSum(np)>21){setMsg("💥 BUST!");setPhase("result");}
    else{setPhase("dealer");dealerTurn(np,dealer,bettedStake*2);}
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-lg">
      {/* Table */}
      <div className="w-full rounded-3xl p-5 flex flex-col gap-4"
        style={{background:"radial-gradient(ellipse at center, #1a4731 0%, #0d2b1e 100%)",border:"3px solid #2d6a4f"}}>
        {/* Dealer */}
        <div>
          <div className="text-xs text-green-400 font-bold tracking-widest mb-2 uppercase">
            Dealer {phase!=="bet"&&phase!=="playing"?`— ${handSum(dealer)}`:""}
          </div>
          <div className="flex gap-2">
            {dealer.map((c,i)=><Card key={i} r={c.rank} s={c.suit} hidden={i===1&&phase==="playing"} size="md"/>)}
          </div>
        </div>
        <div className="border-t border-green-800/50"/>
        {/* Player */}
        <div>
          <div className="text-xs text-white font-bold tracking-widest mb-2 uppercase">
            You {phase==="playing"||phase==="dealer"||phase==="result"?`— ${handSum(player)}`:""}
          </div>
          <div className="flex gap-2 flex-wrap">
            {player.map((c,i)=><Card key={i} r={c.rank} s={c.suit} size="md"/>)}
          </div>
        </div>
      </div>

      {/* Message */}
      {msg && <div className="text-2xl font-black text-yellow-300 drop-shadow" style={{textShadow:"0 0 20px #fbbf24"}}>{msg}</div>}

      {/* Actions */}
      {phase==="bet" && <button onClick={deal} disabled={bal<stake}
        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-black text-xl rounded-2xl shadow-xl hover:scale-105 transition-transform disabled:opacity-40">
        🃏 DEAL  (₹{stake.toLocaleString("en-IN")})
      </button>}

      {phase==="playing" && (
        <div className="grid grid-cols-3 gap-3 w-full">
          <button onClick={hit} className="py-3 bg-blue-700 hover:bg-blue-600 text-white font-black text-lg rounded-xl">HIT</button>
          <button onClick={stand} className="py-3 bg-red-700 hover:bg-red-600 text-white font-black text-lg rounded-xl">STAND</button>
          <button onClick={double} disabled={bal<bettedStake}
            className="py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-black text-lg rounded-xl disabled:opacity-40">2x</button>
        </div>
      )}
      {phase==="result" && (
        <button onClick={()=>setPhase("bet")}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-black rounded-xl">
          ▶ New Hand
        </button>
      )}
    </div>
  );
}

// ─── BACCARAT ─────────────────────────────────────────────────────────────────
function BaccaratGame({ bal, stake, onR }: { bal: number; stake: number; onR: (d: number)=>void }) {
  const [phase, setPhase] = useState<"bet"|"result">("bet");
  const [bet, setBet] = useState<"player"|"banker"|"tie"|null>(null);
  const [playerHand, setPlayerHand] = useState<{rank:string;suit:string}[]>([]);
  const [bankerHand, setBankerHand] = useState<{rank:string;suit:string}[]>([]);
  const [winner, setWinner] = useState<"player"|"banker"|"tie"|null>(null);
  const [winAmt, setWinAmt] = useState(0);

  const bacVal = (r:string) => { if(["10","J","Q","K"].includes(r))return 0; if(r==="A")return 1; return parseInt(r); };
  const bacSum = (hand:{rank:string;suit:string}[]) => hand.reduce((a,c)=>a+bacVal(c.rank),0)%10;

  const play = (side: "player"|"banker"|"tie") => {
    if (bal < stake) return;
    setBet(side); onR(-stake);
    const p = [newCard(),newCard()]; const b = [newCard(),newCard()];
    setPlayerHand(p); setBankerHand(b);
    const ps=bacSum(p), bs=bacSum(b);
    const w = ps>bs?"player":bs>ps?"banker":"tie";
    setWinner(w);
    const payout = side===w ? (w==="tie"?9:w==="banker"?1.95:2)*stake : 0;
    setWinAmt(Math.floor(payout));
    if(payout>0) onR(Math.floor(payout));
    setPhase("result");
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-lg">
      <div className="w-full rounded-3xl p-5 grid grid-cols-2 gap-4"
        style={{background:"radial-gradient(ellipse, #3b0a0a 0%, #1a0505 100%)",border:"3px solid #7f1d1d"}}>
        {(
          [
            { key: "player", lbl: "PLAYER", hand: playerHand },
            { key: "banker", lbl: "BANKER", hand: bankerHand },
          ] as { key: "player"|"banker"; lbl: string; hand: {rank:string;suit:string}[] }[]
        ).map(({ key, lbl, hand }) => (
          <div key={key}>
            <div className={`text-xs font-black tracking-widest mb-2 uppercase ${winner===key?"text-yellow-300":"text-red-300"}`}>
              {lbl} {phase==="result"?`— ${bacSum(hand)}`:""}
              {winner===key?" 👑":""}
            </div>
            <div className="flex gap-2">
              {(hand as {rank:string;suit:string}[]).map((c,i)=><Card key={i} r={c.rank} s={c.suit} size="sm"/>)}
            </div>
          </div>
        ))}
      </div>

      {phase==="result" && (
        <div className="text-center">
          <div className="text-2xl font-black text-yellow-300">{winAmt>0?`🎉 WIN +₹${winAmt.toLocaleString("en-IN")}`:"❌ LOSS"}</div>
          <div className="text-sm text-gray-400 mt-1">{winner?.toUpperCase()} wins</div>
        </div>
      )}

      {phase==="bet" && (
        <div className="grid grid-cols-3 gap-3 w-full">
          {([["player","PLAYER","2x","from-blue-700 to-blue-900"],
             ["banker","BANKER","1.95x","from-red-700 to-red-900"],
             ["tie","TIE","9x","from-green-700 to-green-900"]] as const).map(([k,l,mult,grad])=>(
            <button key={k} onClick={()=>play(k)}
              className={`py-4 bg-gradient-to-b ${grad} text-white font-black rounded-xl shadow-lg hover:scale-105 transition-transform border border-white/10`}>
              <div className="text-sm">{l}</div>
              <div className="text-xs text-yellow-300">{mult}</div>
            </button>
          ))}
        </div>
      )}
      {phase==="result" && (
        <button onClick={()=>{setPhase("bet");setBet(null);setWinner(null);setPlayerHand([]);setBankerHand([]);}}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-black rounded-xl">
          ▶ New Round
        </button>
      )}
    </div>
  );
}

// ─── ANDAR BAHAR ─────────────────────────────────────────────────────────────
function AndarBahar({ bal, stake, onR }: { bal:number; stake:number; onR:(d:number)=>void }) {
  const [phase, setPhase] = useState<"bet"|"dealing"|"result">("bet");
  const [joker, setJoker] = useState<{rank:string;suit:string}|null>(null);
  const [andar, setAndar] = useState<{rank:string;suit:string}[]>([]);
  const [bahar, setBahar] = useState<{rank:string;suit:string}[]>([]);
  const [winner, setWinner] = useState<"andar"|"bahar"|null>(null);
  const [winAmt, setWinAmt] = useState(0);

  const playBet = (side:"andar"|"bahar") => {
    if(bal<stake) return;
    onR(-stake);
    const j=newCard(); setJoker(j); setAndar([]); setBahar([]); setWinner(null);
    setPhase("dealing");
    let a:typeof andar=[]; let b:typeof bahar=[]; let turn=0; let found=false;
    const iv=setInterval(()=>{
      if(found){clearInterval(iv);return;}
      const c=newCard();
      if(turn%2===0){a=[...a,c];setAndar([...a]);if(c.rank===j.rank){found=true;clearInterval(iv);const w="andar";setWinner(w);const win=side===w?Math.floor(stake*1.9):0;setWinAmt(win);if(win>0)onR(win);setTimeout(()=>setPhase("result"),400);}}
      else{b=[...b,c];setBahar([...b]);if(c.rank===j.rank){found=true;clearInterval(iv);const w="bahar";setWinner(w);const win=side===w?Math.floor(stake*1.9):0;setWinAmt(win);if(win>0)onR(win);setTimeout(()=>setPhase("result"),400);}}
      turn++;
      if(turn>24&&!found){clearInterval(iv);const w:typeof winner=Math.random()>0.5?"andar":"bahar";setWinner(w);const win=side===w?Math.floor(stake*1.9):0;setWinAmt(win);if(win>0)onR(win);setTimeout(()=>setPhase("result"),400);}
    },280);
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-lg">
      <div className="w-full rounded-3xl p-4"
        style={{background:"radial-gradient(ellipse,#1a4731 0%,#0d2b1e 100%)",border:"3px solid #2d6a4f"}}>
        {/* Joker */}
        <div className="text-center mb-3">
          <div className="text-[10px] text-green-400 font-black tracking-widest uppercase mb-2">🃏 Joker — Match this rank!</div>
          <div className="flex justify-center">{joker?<Card r={joker.rank} s={joker.suit} size="lg"/>:<Card hidden size="lg"/>}</div>
        </div>
        {/* Cards */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          {([["ANDAR","andar","#3b82f6",andar],["BAHAR","bahar","#f59e0b",bahar]] as const).map(([l,k,col,hand])=>(
            <div key={k} className="rounded-xl p-2" style={{border:`2px solid ${winner===k?col:"rgba(255,255,255,0.1)"}`,background:winner===k?`${col}22`:"rgba(0,0,0,0.3)"}}>
              <div className="text-[10px] font-black uppercase tracking-widest mb-2 text-center" style={{color:col}}>
                {l} {winner===k?"✅":""}
              </div>
              <div className="flex flex-wrap gap-1 justify-center min-h-12">
                {hand.slice(-6).map((c,i)=><Card key={i} r={c.rank} s={c.suit} size="sm"/>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {phase==="result"&&<div className="text-2xl font-black text-center" style={{color:winAmt>0?"#c6ff00":"#ef4444",textShadow:`0 0 20px ${winAmt>0?"#c6ff00":"#ef4444"}`}}>{winAmt>0?`🎉 WIN! +₹${winAmt.toLocaleString("en-IN")}`:`❌ ${winner?.toUpperCase()} wins`}</div>}

      {phase==="bet"&&(
        <div className="grid grid-cols-2 gap-3 w-full">
          <button onClick={()=>playBet("andar")} disabled={bal<stake}
            className="py-4 bg-blue-700 hover:bg-blue-600 text-white font-black text-lg rounded-2xl shadow-xl hover:scale-105 transition-transform disabled:opacity-40">🔵 ANDAR</button>
          <button onClick={()=>playBet("bahar")} disabled={bal<stake}
            className="py-4 bg-amber-600 hover:bg-amber-500 text-white font-black text-lg rounded-2xl shadow-xl hover:scale-105 transition-transform disabled:opacity-40">🟡 BAHAR</button>
        </div>
      )}
      {phase==="dealing"&&<div className="text-green-400 font-bold tracking-widest animate-pulse">🃏 Dealing cards...</div>}
      {phase==="result"&&<button onClick={()=>{setPhase("bet");setJoker(null);setAndar([]);setBahar([]);setWinner(null);}} className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-black rounded-xl">▶ Play Again</button>}
    </div>
  );
}

// ─── DRAGON TIGER ────────────────────────────────────────────────────────────
function DragonTigerGame({ bal, stake, onR }: { bal:number; stake:number; onR:(d:number)=>void }) {
  const [phase, setPhase] = useState<"bet"|"result">("bet");
  const [dragon, setDragon] = useState<{rank:string;suit:string}|null>(null);
  const [tiger, setTiger] = useState<{rank:string;suit:string}|null>(null);
  const [winner, setWinner] = useState<"dragon"|"tiger"|"tie"|null>(null);
  const [winAmt, setWinAmt] = useState(0);

  const rankVal = (r:string)=>{ if(r==="A")return 1; if(["J","Q","K"].includes(r))return parseInt({J:"11",Q:"12",K:"13"}[r]!); return parseInt(r);};

  const play = (side:"dragon"|"tiger"|"tie") => {
    if(bal<stake) return;
    onR(-stake);
    const d=newCard(), t=newCard();
    setDragon(d); setTiger(t);
    const dv=rankVal(d.rank), tv=rankVal(t.rank);
    const w:typeof winner=dv===tv?"tie":dv>tv?"dragon":"tiger";
    setWinner(w);
    const payout = side===w ? (w==="tie"?11:2)*stake : 0;
    setWinAmt(Math.floor(payout));
    if(payout>0) onR(Math.floor(payout));
    setPhase("result");
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-lg">
      <div className="w-full rounded-3xl p-5 grid grid-cols-2 gap-8"
        style={{background:"radial-gradient(ellipse,#1a0510 0%,#0a0208 100%)",border:"3px solid #7e22ce"}}>
        {([["🐉 DRAGON","dragon",dragon,"#a855f7"],["🐯 TIGER","tiger",tiger,"#f59e0b"]] as const).map(([l,k,card,col])=>(
          <div key={k} className="flex flex-col items-center gap-2">
            <div className="text-xs font-black tracking-widest uppercase" style={{color:col,textShadow:`0 0 10px ${col}`}}>{l}</div>
            <div className="text-2xl">{card?<Card r={card.rank} s={card.suit} size="lg"/>:<Card hidden size="lg"/>}</div>
            {card&&<div className="text-sm font-bold text-gray-300">{winner===k?"👑 WINS":""}</div>}
          </div>
        ))}
      </div>

      {phase==="result"&&<div className="text-2xl font-black text-center" style={{color:winAmt>0?"#c6ff00":"#ef4444",textShadow:`0 0 20px ${winAmt>0?"#c6ff00":"#ef4444"}`}}>{winAmt>0?`🎉 WIN! +₹${winAmt.toLocaleString("en-IN")}`:`❌ ${winner?.toUpperCase()} wins`}</div>}

      {phase==="bet"&&(
        <div className="grid grid-cols-3 gap-3 w-full">
          <button onClick={()=>play("dragon")} disabled={bal<stake}
            className="py-4 font-black text-white rounded-2xl hover:scale-105 transition-all"
            style={{background:"linear-gradient(135deg,#7c3aed,#4c1d95)"}}>🐉 Dragon<br/><span className="text-xs text-purple-300">2x</span></button>
          <button onClick={()=>play("tie")} disabled={bal<stake}
            className="py-4 font-black text-white rounded-2xl hover:scale-105 transition-all"
            style={{background:"linear-gradient(135deg,#059669,#065f46)"}}>TIE<br/><span className="text-xs text-green-300">11x</span></button>
          <button onClick={()=>play("tiger")} disabled={bal<stake}
            className="py-4 font-black text-white rounded-2xl hover:scale-105 transition-all"
            style={{background:"linear-gradient(135deg,#d97706,#92400e)"}}>🐯 Tiger<br/><span className="text-xs text-amber-300">2x</span></button>
        </div>
      )}
      {phase==="result"&&<button onClick={()=>{setPhase("bet");setDragon(null);setTiger(null);setWinner(null);}} className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-black rounded-xl">▶ New Round</button>}
    </div>
  );
}

// ─── SLOTS ────────────────────────────────────────────────────────────────────
const SYMS=[{e:"🍒",p:2},{e:"🍋",p:3},{e:"🍊",p:4},{e:"⭐",p:5},{e:"🔔",p:8},{e:"💎",p:10},{e:"7️⃣",p:20},{e:"🃏",p:40}];

function SlotsGame({ bal, stake, onR }: { bal:number; stake:number; onR:(d:number)=>void }) {
  const [reels, setReels] = useState([[0,1,2],[2,3,4],[4,5,6]]);
  const [spinning, setSpinning] = useState(false);
  const [win, setWin] = useState<{text:string;amt:number}|null>(null);

  const spin = () => {
    if(spinning||bal<stake) return;
    setSpinning(true); setWin(null); onR(-stake);
    const ivs = reels.map((_,ri)=>{
      return setInterval(()=>{
        setReels(prev=>{const n=[...prev];n[ri]=n[ri].map(v=>(v+1)%SYMS.length);return n;});
      },80*(ri+1));
    });
    const dur=[800,1200,1600];
    ivs.forEach((iv,i)=>setTimeout(()=>{
      clearInterval(iv);
      if(i===2){
        const final=[[rand(8),rand(8),rand(8)],[rand(8),rand(8),rand(8)],[rand(8),rand(8),rand(8)]];
        setReels(final);
        // Middle row
        const m=[final[0][1],final[1][1],final[2][1]];
        const allSame=m[0]===m[1]&&m[1]===m[2];
        const hasWild=m.includes(7);
        let winAmt=0;
        if(allSame){winAmt=SYMS[m[0]].p*stake;}
        else if(hasWild){const others=m.filter(v=>v!==7);if(others.length>0)winAmt=Math.floor(SYMS[others[0]].p*stake*1.5);}
        else if(m[0]===m[1]||m[1]===m[2]){winAmt=Math.floor(stake*1.5);}
        if(winAmt>0){
          const text=winAmt>=stake*15?"🎉 JACKPOT!":winAmt>=stake*5?"💎 BIG WIN!":"✨ WIN!";
          setWin({text,amt:winAmt});onR(winAmt);
        }
        setSpinning(false);
      }
    },dur[i]));
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Machine */}
      <div className="rounded-3xl p-5" style={{background:"linear-gradient(180deg,#1e003e,#2d0060)",border:"3px solid #7c3aed",boxShadow:"0 0 40px rgba(124,58,237,0.5)"}}>
        <div className="text-[10px] text-purple-400 font-black tracking-widest text-center mb-3 uppercase">PlayAdda Mega Slots</div>
        <div className="rounded-2xl p-4 flex gap-3" style={{background:"#0a0018",border:"2px solid #4c1d95"}}>
          {reels.map((reel,ri)=>(
            <div key={ri} className="flex flex-col gap-1" style={{width:64}}>
              {reel.map((sym,si)=>(
                <div key={si} className={`w-14 h-14 flex items-center justify-center rounded-xl transition-all ${si===1?"scale-110 bg-purple-900/50 ring-2 ring-purple-500":"opacity-40 bg-black/20"}`}
                  style={{fontSize:si===1?28:20,filter:spinning?"blur(2px)":"none"}}>
                  {SYMS[sym].e}
                </div>
              ))}
            </div>
          ))}
        </div>
        {/* Win line */}
        <div className="h-8 mt-2 flex items-center justify-center">
          {win && <div className="font-black text-lg" style={{color:"#c6ff00",textShadow:"0 0 20px #c6ff00"}}>{win.text} +₹{win.amt.toLocaleString("en-IN")}</div>}
        </div>
      </div>

      {/* Paytable */}
      <div className="grid grid-cols-4 gap-2 w-full max-w-xs text-center">
        {SYMS.slice(-4).map(s=>(
          <div key={s.e} className="rounded-xl py-2 text-xs" style={{background:"rgba(124,58,237,0.15)",border:"1px solid rgba(124,58,237,0.3)"}}>
            <div className="text-xl">{s.e}</div>
            <div className="text-purple-300 font-bold">{s.p}x</div>
          </div>
        ))}
      </div>

      <button onClick={spin} disabled={spinning||bal<stake}
        className="w-56 py-4 font-black text-xl rounded-full shadow-xl hover:scale-105 transition-transform disabled:opacity-40"
        style={{background:spinning?"#374151":"linear-gradient(135deg,#7c3aed,#4f46e5)",color:"#fff",boxShadow:spinning?"none":"0 4px 24px rgba(124,58,237,0.7)"}}>
        {spinning?"⚡ SPINNING…":"▶ SPIN"}
      </button>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
// NOTE: This page is loaded inside an iFrame via CasinoGameModal.
// We use dynamic imports for AuthContext because it needs AuthProvider which
// lives in the parent. Instead we read real balance via the casinoApi and
// store round_id in state, passing wallet operations through postMessage
// or by direct API calls (same origin — works because demo page is served by
// the same Next.js app).

import { casinoApi } from "@/lib/api";

export default function DemoGamePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const gameId = searchParams.get("game") || "demo";
  const gameName = searchParams.get("name") ? decodeURIComponent(searchParams.get("name")!) : "Demo Game";
  const providerName = searchParams.get("provider") ? decodeURIComponent(searchParams.get("provider")!) : "PlayAdda";

  // isDemo: guest or explicit demo mode flag
  const isDemoParam = searchParams.get("isDemo");
  const isDemo = isDemoParam !== "false"; // default = demo, only false when explicitly set

  // Local balance for DEMO mode (₹10,000 virtual chips)
  const [demoBalance, setDemoBalance] = useState(10000);
  // Real balance for REAL mode (fetched from backend, then updated locally)
  const [realBalance, setRealBalance] = useState<number | null>(null);
  const [walletLoading, setWalletLoading] = useState(!isDemo);
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
  const [stake, setStake] = useState(100);
  const [history, setHistory] = useState<{ d: number; t: string; mode: "win" | "loss" | "push" }[]>([]);
  const [settling, setSettling] = useState(false);
  const [betError, setBetError] = useState<string | null>(null);

  const balance = isDemo ? demoBalance : (realBalance ?? 0);

  // Fetch real wallet balance on mount
  useEffect(() => {
    if (isDemo) return;
    const fetchBalance = async () => {
      try {
        setWalletLoading(true);
        const { api } = await import("@/lib/api");
        const res = await api.get("/wallet");
        const data = res.data?.data || res.data;
        const avail = data?.available_balance ?? data?.balance ?? 0;
        setRealBalance(parseFloat(avail));
      } catch {
        setRealBalance(0);
      } finally {
        setWalletLoading(false);
      }
    };
    void fetchBalance();
  }, [isDemo]);

  /**
   * onBetStart — called by each game BEFORE the round begins.
   * Returns: { ok, roundId } — roundId is null in demo mode.
   * Game should abort if ok=false (insufficient funds).
   */
  const onBetStart = useCallback(async (betStake: number): Promise<{ ok: boolean; roundId: string | null }> => {
    setBetError(null);
    if (isDemo) {
      if (demoBalance < betStake) { setBetError("Insufficient demo balance!"); return { ok: false, roundId: null }; }
      setDemoBalance(b => b - betStake);
      return { ok: true, roundId: null };
    }
    // Real mode — call backend
    try {
      const res = await casinoApi.bet(gameId, gameName, betStake);
      const data = res.data?.data || res.data;
      setRealBalance(data.balance);
      setCurrentRoundId(data.round_id);
      return { ok: true, roundId: data.round_id };
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Bet failed";
      setBetError(msg);
      return { ok: false, roundId: null };
    }
  }, [isDemo, demoBalance, gameId, gameName]);

  /**
   * onRoundEnd — called by each game AFTER the round ends.
   * winAmount: 0 = loss, >0 = total returned (e.g., stake*2 for win, stake = push).
   */
  const onRoundEnd = useCallback(async (winAmount: number, betStake: number, roundId: string | null) => {
    const net = winAmount - betStake;
    const mode = net > 0 ? "win" : net === 0 && winAmount > 0 ? "push" : "loss";

    if (isDemo) {
      setDemoBalance(b => b + winAmount);
      setHistory(h => [{ d: net, t: gameName, mode }, ...h.slice(0, 9)]);
      return;
    }

    // Real mode — settle with backend
    setSettling(true);
    try {
      const res = await casinoApi.settle(roundId!, winAmount, betStake);
      const data = res.data?.data || res.data;
      setRealBalance(data.balance);
      setHistory(h => [{ d: data.net, t: gameName, mode }, ...h.slice(0, 9)]);
    } catch {
      // Fallback: reflect locally and refresh wallet
      setRealBalance(b => (b ?? 0) + net);
      setHistory(h => [{ d: net, t: gameName, mode }, ...h.slice(0, 9)]);
    } finally {
      setSettling(false);
      setCurrentRoundId(null);
    }
  }, [isDemo, gameName]);

  const gn = gameName.toLowerCase();
  const gameType =
    gn.includes("roulette") ? "roulette" :
    gn.includes("blackjack") ? "blackjack" :
    gn.includes("baccarat") ? "baccarat" :
    gn.includes("dragon") ? "dragon-tiger" :
    gn.includes("andar") || gn.includes("teen") || gn.includes("32 cards") ? "andar-bahar" :
    gn.includes("aviator") || gn.includes("jet") || gn.includes("crash") || gn.includes("mines") ? "crash" :
    "slots";

  const bgImage =
    gameType === "crash" ? "url('/games/aviator.png')" :
    gameType === "roulette" ? "url('/games/roulette.png')" :
    gameType === "slots" ? "url('/games/slots.png')" :
    gameType === "blackjack" ? "url('/games/blackjack.png')" :
    gameType === "dragon-tiger" ? "url('/games/dragon-tiger.png')" :
    gameType === "andar-bahar" ? "url('/games/teen-patti.png')" : "";

  const STAKES = [50, 100, 250, 500, 1000, 2000];

  // Adapter: converts the old onR(delta) signature used by game components
  // into the new onBetStart/onRoundEnd pair.
  // Each game calls onR(-stake) to bet, then onR(+winAmount) to credit.
  // We detect the transition: negative = bet, positive = win/credit.
  const [pendingStake, setPendingStake] = useState(0);
  const [pendingRoundId, setPendingRoundId] = useState<string | null>(null);

  const onR = useCallback(async (delta: number) => {
    if (delta < 0) {
      // Betting phase — debit
      const betAmt = Math.abs(delta);
      setPendingStake(betAmt);
      const result = await onBetStart(betAmt);
      if (!result.ok) return;
      setPendingRoundId(result.roundId);
    } else if (delta > 0) {
      // Win/credit phase — settle
      await onRoundEnd(delta, pendingStake, pendingRoundId);
      setPendingStake(0);
      setPendingRoundId(null);
    }
    // delta === 0 is ignored (push handled separately)
  }, [onBetStart, onRoundEnd, pendingStake, pendingRoundId]);

  if (!isDemo && walletLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050d08" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading your wallet…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ fontFamily: "Inter,system-ui,sans-serif", background: "#050d08" }}>

      {/* Hero Banner */}
      {bgImage && (
        <div className="relative h-36 overflow-hidden flex-shrink-0">
          <div className="absolute inset-0" style={{ backgroundImage: bgImage, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.35) blur(1px)" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050d08]" />
          <div className="relative h-full flex items-end px-5 pb-3 gap-3">
            <div>
              <div className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-2">
                <span className="text-gray-400">{providerName}</span>
                {isDemo ? (
                  <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full text-[9px] font-black">🎮 DEMO</span>
                ) : (
                  <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full text-[9px] font-black">💵 REAL MONEY</span>
                )}
              </div>
              <div className="text-2xl font-black text-white leading-tight">{gameName}</div>
            </div>
          </div>
        </div>
      )}

      {/* Balance + Stake Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="text-sm flex items-center gap-3">
          <div>
            <span className="text-gray-500 text-[10px] block">
              {isDemo ? "Demo Balance" : "Real Balance"}
            </span>
            <span className={`font-black text-lg ${isDemo ? "text-yellow-400" : "text-green-400"}`}>
              ₹{balance.toLocaleString("en-IN")}
            </span>
          </div>
          {settling && (
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              Settling…
            </div>
          )}
        </div>
        <div className="flex gap-1.5">
          {STAKES.map(s => (
            <button
              key={s}
              onClick={() => setStake(s)}
              disabled={s > balance}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all disabled:opacity-30 ${stake === s ? "text-black" : "text-gray-400 hover:text-white border border-white/10"}`}
              style={stake === s ? { background: "#c6ff00" } : {}}
            >
              {s >= 1000 ? `${s / 1000}K` : s}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {betError && (
        <div className="mx-4 mt-3 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-bold flex items-center gap-2">
          ⚠️ {betError}
          <button onClick={() => setBetError(null)} className="ml-auto text-red-300 hover:text-white">✕</button>
        </div>
      )}

      {/* Demo mode notice */}
      {isDemo && (
        <div className="mx-4 mt-3 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-between">
          <span className="text-yellow-400 text-[10px] font-bold">🎮 Playing with virtual chips — <span className="text-white">Log in</span> to play with real money</span>
          <a href="/" className="text-[9px] bg-yellow-500 text-black px-2 py-0.5 rounded-full font-black hover:bg-yellow-400 transition-colors">LOGIN</a>
        </div>
      )}

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-5 pb-6 gap-4">
        {gameType === "roulette" && <RouletteGame bal={balance} stake={stake} onR={onR} />}
        {gameType === "blackjack" && <BlackjackGame bal={balance} stake={stake} onR={onR} />}
        {gameType === "baccarat" && <BaccaratGame bal={balance} stake={stake} onR={onR} />}
        {gameType === "dragon-tiger" && <DragonTigerGame bal={balance} stake={stake} onR={onR} />}
        {gameType === "andar-bahar" && <AndarBahar bal={balance} stake={stake} onR={onR} />}
        {gameType === "crash" && <CrashGame bal={balance} stake={stake} onR={onR} />}
        {gameType === "slots" && <SlotsGame bal={balance} stake={stake} onR={onR} />}
      </div>

      {/* Round History Strip */}
      {history.length > 0 && (
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
          {history.map((h, i) => (
            <span
              key={i}
              className="text-[10px] font-bold px-2 py-1 rounded-md flex-shrink-0"
              style={{
                background: h.mode === "win" ? "rgba(198,255,0,0.1)" : h.mode === "push" ? "rgba(161,161,170,0.1)" : "rgba(239,68,68,0.1)",
                color: h.mode === "win" ? "#c6ff00" : h.mode === "push" ? "#a1a1aa" : "#ef4444",
                border: `1px solid ${h.mode === "win" ? "rgba(198,255,0,0.25)" : h.mode === "push" ? "rgba(161,161,170,0.25)" : "rgba(239,68,68,0.25)"}`,
              }}
            >
              {h.d > 0 ? "+" : ""}₹{Math.abs(h.d).toLocaleString("en-IN")}
            </span>
          ))}
          {!isDemo && (
            <a href="/casino/history" className="text-[10px] text-gray-500 hover:text-gray-300 flex-shrink-0 flex items-center gap-1 px-2">
              Full history →
            </a>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center pb-3 text-[9px] text-gray-700">
        {isDemo ? "DEMO MODE · Virtual chips only · No real money involved" : `REAL MONEY · Every round debits/credits your wallet · ${token?.slice(0, 12)}`}
      </div>
    </div>
  );
}

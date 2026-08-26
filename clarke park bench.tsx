import React, { useState, useEffect, useRef, useMemo } from "react";

/* ------------------------------------------------------------------
   Clarke & Park Bench — a drafting-paper instrument for FOC teaching
   Phase colours follow NEC 208 V convention: A black, B red, C blue.
------------------------------------------------------------------- */

const C = {
  paper: "#E7E9E1",
  panel: "#F3F4EE",
  grid: "#C9CEC2",
  gridFine: "#D9DDD2",
  ink: "#16211B",
  ink60: "#5A6660",
  a: "#15181A",
  b: "#B32B24",
  c: "#20509B",
  alpha: "#0F6E5C",
  beta: "#A9631A",
  d: "#6C4BA0",
  q: "#17753C",
  warn: "#B32B24",
};

const TAU = Math.PI * 2;
const SQ3 = Math.sqrt(3);

/* ---------- generic SVG strip chart ---------- */
function Strip({ title, unit, traces, N, cursor, yMax = 1.35, samples, height = 132 }) {
  const W = 640, H = height, L = 46, R = 10, T = 12, B = 18;
  const pw = W - L - R, ph = H - T - B;
  const x = (i) => L + (i / (N - 1)) * pw;
  const y = (v) => T + ph / 2 - (v / yMax) * (ph / 2);

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 2 }}>
        <span style={{ font: "600 11px/1 'IBM Plex Mono', monospace", letterSpacing: ".14em", textTransform: "uppercase", color: C.ink }}>{title}</span>
        <span style={{ font: "400 10px/1 'IBM Plex Mono', monospace", color: C.ink60 }}>{unit}</span>
        <span style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          {traces.map((t) => (
            <span key={t.label} style={{ font: "500 10px/1 'IBM Plex Mono', monospace", color: t.color }}>
              <span style={{ display: "inline-block", width: 14, height: 2, background: t.color, verticalAlign: "middle", marginRight: 4 }} />
              {t.label}
            </span>
          ))}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block", background: C.panel, border: `1px solid ${C.grid}` }}>
        {[-1, -0.5, 0.5, 1].map((v) => (
          <line key={v} x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={C.gridFine} strokeWidth="1" />
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={L + f * pw} x2={L + f * pw} y1={T} y2={T + ph} stroke={C.gridFine} strokeWidth="1" />
        ))}
        <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke={C.grid} strokeWidth="1.2" />
        <text x={L - 6} y={y(1) + 3} textAnchor="end" style={{ font: "400 9px 'IBM Plex Mono', monospace", fill: C.ink60 }}>+1.0</text>
        <text x={L - 6} y={y(0) + 3} textAnchor="end" style={{ font: "400 9px 'IBM Plex Mono', monospace", fill: C.ink60 }}>0</text>
        <text x={L - 6} y={y(-1) + 3} textAnchor="end" style={{ font: "400 9px 'IBM Plex Mono', monospace", fill: C.ink60 }}>-1.0</text>

        {samples && samples.count <= 260 && samples.idx.map((i, k) => (
          <circle key={k} cx={x(i)} cy={y(samples.vals[k])} r="1.9" fill="none" stroke={C.ink} strokeWidth="0.9" opacity="0.55" />
        ))}

        {traces.map((t) => (
          <polyline key={t.label} fill="none" stroke={t.color} strokeWidth={t.w || 1.6}
            strokeLinejoin="round" strokeDasharray={t.dash || "none"}
            points={t.data.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
        ))}

        <line x1={x(cursor)} x2={x(cursor)} y1={T} y2={T + ph} stroke={C.ink} strokeWidth="0.9" opacity="0.5" />
      </svg>
    </div>
  );
}

/* ---------- signature element: the alpha-beta plane ---------- */
function Plane({ ia, ib, ic, al, be, id, iq, th, locus }) {
  const S = 300, c = S / 2, k = 92; // px per 1.0 pu
  const P = (u, v) => [c + u * k, c - v * k];
  const [vx, vy] = P(al, be);
  const axis = (ang, len, col, lbl, dash) => {
    const [ex, ey] = P(Math.cos(ang) * len, Math.sin(ang) * len);
    return (
      <g key={lbl}>
        <line x1={c} y1={c} x2={ex} y2={ey} stroke={col} strokeWidth="1.2" strokeDasharray={dash || "none"} opacity="0.85" />
        <text x={ex} y={ey} dx={ex > c ? 5 : -5} dy={ey > c ? 11 : -4} textAnchor={ex > c ? "start" : "end"}
          style={{ font: "600 11px 'IBM Plex Mono', monospace", fill: col }}>{lbl}</text>
      </g>
    );
  };
  const [dEndX, dEndY] = P(id * Math.cos(th), id * Math.sin(th));
  const [qEndX, qEndY] = P(-iq * Math.sin(th), iq * Math.cos(th));

  return (
    <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 340, display: "block", background: C.panel, border: `1px solid ${C.grid}` }}>
      {[0.5, 1.0].map((r) => <circle key={r} cx={c} cy={c} r={r * k} fill="none" stroke={C.gridFine} />)}
      <line x1={16} y1={c} x2={S - 16} y2={c} stroke={C.grid} />
      <line x1={c} y1={16} x2={c} y2={S - 16} stroke={C.grid} />
      <text x={S - 14} y={c - 6} textAnchor="end" style={{ font: "600 10px 'IBM Plex Mono', monospace", fill: C.alpha }}>α</text>
      <text x={c + 6} y={22} style={{ font: "600 10px 'IBM Plex Mono', monospace", fill: C.beta }}>β</text>

      {/* stator winding axes, 120 deg apart */}
      {[[0, C.a, "a"], [TAU / 3, C.b, "b"], [-TAU / 3, C.c, "c"]].map(([ang, col, lbl]) =>
        axis(ang, 1.22, col, lbl, "2 3"))}

      {/* rotating d-q frame */}
      {axis(th, 1.28, C.d, "d")}
      {axis(th + Math.PI / 2, 1.28, C.q, "q")}

      <polyline fill="none" stroke={C.ink} strokeWidth="0.8" opacity="0.28"
        points={locus.map(([u, v]) => P(u, v).join(",")).join(" ")} />

      {/* projections onto d and q */}
      <line x1={vx} y1={vy} x2={dEndX} y2={dEndY} stroke={C.d} strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
      <line x1={vx} y1={vy} x2={qEndX} y2={qEndY} stroke={C.q} strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
      <circle cx={dEndX} cy={dEndY} r="3.2" fill={C.d} />
      <circle cx={qEndX} cy={qEndY} r="3.2" fill={C.q} />

      <line x1={c} y1={c} x2={vx} y2={vy} stroke={C.ink} strokeWidth="2.4" />
      <circle cx={vx} cy={vy} r="4.5" fill={C.ink} />
    </svg>
  );
}

/* ---------- tab 2: PI tracking error ---------- */
function ErrorPlot({ bw, fe }) {
  const W = 640, H = 250, L = 46, R = 44, T = 14, B = 30;
  const pw = W - L - R, ph = H - T - B;
  const fMax = 1000;
  const x = (f) => L + (f / fMax) * pw;
  const yM = (m) => T + ph - m * ph;              // 0..1 magnitude
  const yP = (p) => T + ph - (p / 90) * ph;       // 0..90 deg

  const pts = [];
  for (let i = 0; i <= 200; i++) {
    const f = (i / 200) * fMax;
    const r = f / bw;
    pts.push([f, 1 / Math.sqrt(1 + r * r), (Math.atan(r) * 180) / Math.PI]);
  }
  const r0 = fe / bw;
  const mag = 1 / Math.sqrt(1 + r0 * r0);
  const lag = (Math.atan(r0) * 180) / Math.PI;

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block", background: C.panel, border: `1px solid ${C.grid}` }}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={L + f * pw} x2={L + f * pw} y1={T} y2={T + ph} stroke={C.gridFine} />
            <text x={L + f * pw} y={H - 12} textAnchor="middle" style={{ font: "400 9px 'IBM Plex Mono', monospace", fill: C.ink60 }}>{Math.round(f * fMax)}</text>
          </g>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={"h" + f}>
            <line x1={L} x2={W - R} y1={T + f * ph} y2={T + f * ph} stroke={C.gridFine} />
            <text x={L - 6} y={T + f * ph + 3} textAnchor="end" style={{ font: "400 9px 'IBM Plex Mono', monospace", fill: C.b }}>{Math.round((1 - f) * 100)}%</text>
            <text x={W - R + 6} y={T + f * ph + 3} style={{ font: "400 9px 'IBM Plex Mono', monospace", fill: C.c }}>{Math.round(f * 90)}°</text>
          </g>
        ))}

        <line x1={L} x2={W - R} y1={yM(1)} y2={yM(1)} stroke={C.q} strokeWidth="2" />
        <text x={L + 8} y={yM(1) - 6} style={{ font: "600 10px 'IBM Plex Mono', monospace", fill: C.q }}>dq frame — DC reference, no tracking error at any speed</text>

        <polyline fill="none" stroke={C.b} strokeWidth="2" points={pts.map(([f, m]) => `${x(f)},${yM(m)}`).join(" ")} />
        <polyline fill="none" stroke={C.c} strokeWidth="2" strokeDasharray="5 3" points={pts.map(([f, , p]) => `${x(f)},${yP(p)}`).join(" ")} />

        <line x1={x(fe)} x2={x(fe)} y1={T} y2={T + ph} stroke={C.ink} strokeWidth="1" strokeDasharray="2 3" />
        <circle cx={x(fe)} cy={yM(mag)} r="4" fill={C.b} />
        <circle cx={x(fe)} cy={yP(lag)} r="4" fill={C.c} />
        <text x={W - R - 4} y={H - 12} textAnchor="end" style={{ font: "400 9px 'IBM Plex Mono', monospace", fill: C.ink60 }}>electrical frequency, Hz</text>
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8, marginTop: 10 }}>
        <Readout k="Amplitude delivered" v={`${(mag * 100).toFixed(1)} %`} col={C.b} />
        <Readout k="Phase lag" v={`${lag.toFixed(1)}°`} col={C.c} />
        <Readout k="Torque per amp" v={`${(Math.cos((lag * Math.PI) / 180) * 100).toFixed(1)} %`} col={C.q} />
        <Readout k="Stray d-axis current" v={`${(Math.sin((lag * Math.PI) / 180) * 100).toFixed(1)} %`} col={C.d} />
      </div>
    </>
  );
}

function Readout({ k, v, col }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.grid}`, padding: "7px 9px" }}>
      <div style={{ font: "400 9px/1.3 'IBM Plex Mono', monospace", letterSpacing: ".08em", textTransform: "uppercase", color: C.ink60 }}>{k}</div>
      <div style={{ font: `600 17px/1.25 'IBM Plex Mono', monospace`, color: col || C.ink }}>{v}</div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ display: "flex", justifyContent: "space-between", font: "400 10px 'IBM Plex Mono', monospace", color: C.ink60, letterSpacing: ".06em", textTransform: "uppercase" }}>
        <span>{label}</span><span style={{ color: C.ink, fontWeight: 600 }}>{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: C.ink, marginTop: 3 }} />
    </label>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [fe, setFe] = useState(400);
  const [idRef, setIdRef] = useState(-0.25);
  const [iqRef, setIqRef] = useState(0.85);
  const [step, setStep] = useState(true);
  const [bw, setBw] = useState(1000);
  const [run, setRun] = useState(true);
  const [ph, setPh] = useState(0);
  const raf = useRef();

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setRun(false);
  }, []);

  useEffect(() => {
    if (!run) return;
    let last = performance.now();
    const loop = (t) => {
      const dt = (t - last) / 1000; last = t;
      setPh((p) => (p + dt * 0.16) % 1);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [run]);

  const N = 720;
  const CYC = 4;                       // window spans 4 electrical periods
  const Twin = CYC / fe;               // seconds
  const FS = 10000;                    // control / PWM sampling rate

  const wave = useMemo(() => {
    const ia = [], ib = [], ic = [], al = [], be = [], dd = [], qq = [], loc = [];
    for (let n = 0; n < N; n++) {
      const frac = n / (N - 1);
      const th = frac * CYC * TAU;
      const gate = step && frac < 0.4 ? 0.15 : 1;
      const D = idRef * gate, Q = iqRef * gate;
      const A = D * Math.cos(th) - Q * Math.sin(th);
      const Bv = D * Math.sin(th) + Q * Math.cos(th);
      al.push(A); be.push(Bv); dd.push(D); qq.push(Q);
      ia.push(A); ib.push(-0.5 * A + (SQ3 / 2) * Bv); ic.push(-0.5 * A - (SQ3 / 2) * Bv);
      if (n % 3 === 0) loc.push([A, Bv]);
    }
    return { ia, ib, ic, al, be, dd, qq, loc };
  }, [idRef, iqRef, step]);

  const samples = useMemo(() => {
    const count = Math.round(Twin * FS);
    const idx = [], vals = [];
    for (let k = 0; k <= count; k++) {
      const i = Math.round((k / count) * (N - 1));
      idx.push(i); vals.push(wave.ia[i]);
    }
    return { count, idx, vals };
  }, [Twin, wave]);

  const cur = Math.floor(ph * (N - 1));
  const theta = (cur / (N - 1)) * CYC * TAU;
  const rpm = Math.round((fe * 60) / 4);   // 8-pole machine, 4 pole pairs

  const tabBtn = (i, label) => (
    <button key={i} onClick={() => setTab(i)}
      style={{
        font: "600 11px 'IBM Plex Mono', monospace", letterSpacing: ".1em", textTransform: "uppercase",
        padding: "8px 14px", cursor: "pointer",
        background: tab === i ? C.ink : "transparent", color: tab === i ? C.paper : C.ink60,
        border: `1px solid ${tab === i ? C.ink : C.grid}`, borderRadius: 0,
      }}>{label}</button>
  );

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100%", padding: "18px 16px 28px", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@600;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500&display=swap');
        input[type=range]{height:18px}`}</style>

      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ borderBottom: `2px solid ${C.ink}`, paddingBottom: 8, marginBottom: 14 }}>
          <div style={{ font: "800 clamp(22px,5vw,34px)/1 Archivo, sans-serif", letterSpacing: "-.02em", textTransform: "uppercase" }}>
            Clarke &amp; Park Bench
          </div>
          <div style={{ font: "400 11px/1.5 'IBM Plex Mono', monospace", color: C.ink60, marginTop: 5 }}>
            8-pole IPMSM · 10 kHz current loop · currents in per-unit of rated peak
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {tabBtn(0, "Transform chain")}
          {tabBtn(1, "Why PI fails on AC")}
        </div>

        {tab === 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18, alignItems: "start" }}>
              <div>
                <div style={{ font: "600 11px 'IBM Plex Mono', monospace", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 4 }}>
                  Stator current vector in the αβ plane
                </div>
                <Plane ia={wave.ia[cur]} ib={wave.ib[cur]} ic={wave.ic[cur]}
                  al={wave.al[cur]} be={wave.be[cur]} id={wave.dd[cur]} iq={wave.qq[cur]}
                  th={theta} locus={wave.loc} />
                <p style={{ font: "400 12px/1.55 'IBM Plex Sans', sans-serif", color: C.ink60, margin: "8px 0 0", maxWidth: 340 }}>
                  Three winding axes 120° apart produce one vector. Clarke names it with two numbers instead of three.
                  Park re-reads that same vector against the rotor's own d and q axes, which spin with it — so the two
                  numbers stop moving.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                  <Readout k="Rotor speed" v={`${rpm.toLocaleString()} rpm`} />
                  <Readout k="Samples / cycle" v={(FS / fe).toFixed(1)} col={FS / fe < 20 ? C.warn : C.ink} />
                </div>
              </div>

              <div>
                <Strip title="abc — what the current sensors see" unit={`${(Twin * 1000).toFixed(1)} ms window · circles = 10 kHz sample instants on phase A`}
                  N={N} cursor={cur} samples={samples}
                  traces={[
                    { label: "ia", color: C.a, data: wave.ia },
                    { label: "ib", color: C.b, data: wave.ib },
                    { label: "ic", color: C.c, data: wave.ic },
                  ]} />
                <Strip title="αβ — Clarke: 3 → 2, still AC" unit="stationary frame"
                  N={N} cursor={cur}
                  traces={[
                    { label: "iα", color: C.alpha, data: wave.al },
                    { label: "iβ", color: C.beta, data: wave.be },
                  ]} />
                <Strip title="dq — Park: AC → DC, flux and torque split" unit="rotor frame · this is what the PI loops regulate"
                  N={N} cursor={cur}
                  traces={[
                    { label: "id (flux)", color: C.d, data: wave.dd, w: 2.2 },
                    { label: "iq (torque)", color: C.q, data: wave.qq, w: 2.2 },
                  ]} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.grid}` }}>
              <Slider label="Electrical frequency" value={fe} min={20} max={1000} step={5} onChange={setFe} fmt={(v) => `${v} Hz`} />
              <Slider label="id — field weakening" value={idRef} min={-1} max={0.2} step={0.05} onChange={setIdRef} fmt={(v) => v.toFixed(2)} />
              <Slider label="iq — torque command" value={iqRef} min={0} max={1.1} step={0.05} onChange={setIqRef} fmt={(v) => v.toFixed(2)} />
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <button onClick={() => setStep(!step)} style={btn(step)}>Torque step</button>
                <button onClick={() => setRun(!run)} style={btn(run)}>{run ? "Pause" : "Run"}</button>
              </div>
            </div>
          </>
        )}

        {tab === 1 && (
          <>
            <p style={{ font: "400 13px/1.6 'IBM Plex Sans', sans-serif", maxWidth: 720, margin: "0 0 12px" }}>
              A PI regulator has infinite gain only at DC. Close a current loop of bandwidth <b>{bw} Hz</b> and ask it to
              follow a sinusoid instead, and what comes out is the first-order response below: shrunken and late. The lag
              is the expensive part — it rotates your current vector off the torque axis and dumps the difference into
              the flux axis, where it heats the machine and buys nothing.
            </p>
            <ErrorPlot bw={bw} fe={fe} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.grid}` }}>
              <Slider label="Current loop bandwidth" value={bw} min={100} max={2500} step={50} onChange={setBw} fmt={(v) => `${v} Hz`} />
              <Slider label="Operating electrical frequency" value={fe} min={20} max={1000} step={5} onChange={setFe} fmt={(v) => `${v} Hz · ${Math.round((v * 60) / 4).toLocaleString()} rpm`} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const btn = (on) => ({
  font: "600 11px 'IBM Plex Mono', monospace", letterSpacing: ".08em", textTransform: "uppercase",
  padding: "8px 12px", cursor: "pointer", borderRadius: 0,
  background: on ? C.ink : "transparent", color: on ? C.paper : C.ink60,
  border: `1px solid ${on ? C.ink : C.grid}`,
});

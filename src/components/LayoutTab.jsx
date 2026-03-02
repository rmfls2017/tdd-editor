import { useState, useMemo, useCallback } from "react";
import { C, TC, RC, fc, T, S } from "../constants/theme.js";
import { B, Chip } from "./common.jsx";

// ═══════════════════════════════════════
//  Layout Tab
//  key={tdd.id} on mount → fresh state
// ═══════════════════════════════════════
export default function LayoutTab({ tdd }) {
  const [recId, setRecId] = useState(tdd.layout.records[0]?.id);
  const [selF, setSelF] = useState(null);
  const [hovB, setHovB] = useState(null);
  const rec = tdd.layout.records.find(r => r.id === recId) || tdd.layout.records[0];
  const gf = useCallback(i => rec?.fields.find(f => i >= f.offset && i < f.offset + f.length), [rec]);

  // Cumulative length calc
  const cumLen = useMemo(() => {
    if (!rec) return [];
    let sum = 0;
    return rec.fields.map(f => { sum += f.length; return sum; });
  }, [rec]);
  const totalFieldLen = cumLen.length > 0 ? cumLen[cumLen.length - 1] : 0;
  const lenMatch = totalFieldLen === rec?.length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, overflow: "auto" }}>
        {/* Record tabs */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
          {tdd.layout.records.map(r => (
            <Chip key={r.id} on={recId === r.id} onClick={() => { setRecId(r.id); setSelF(null) }} count={r.fields.length} c={RC[r.recordType]}>
              {r.recordType} <span style={{ opacity: .6, fontSize: 9 }}>{r.length}B</span>
            </Chip>
          ))}
          <span style={{ fontSize: T.xs, color: C.txD, marginLeft: S[2] }}>
            {tdd.layout.records.map(r => `${r.recordType[0]}:${r.length}B`).join(" · ")}
          </span>
        </div>
        {/* Byte map */}
        <div style={{ background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, padding: S[2], flexShrink: 0 }}>
          <div style={{ fontSize: T.xs, color: C.txD, marginBottom: S[1], fontFamily: "'JetBrains Mono',monospace", display: "flex", justifyContent: "space-between" }}>
            <span>BYTE MAP — {rec?.recordType} ({rec?.length}B, {tdd.protocol.encoding})</span>
            <span>{rec?.fields.length} fields</span>
          </div>
          {/* Start/End markers */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: C.txD, marginBottom: 2 }}>
            <span>0</span>
            <span>{rec?.length}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {Array.from({ length: rec?.length || 0 }).map((_, i) => {
              const f = gf(i); const ci = f ? rec.fields.indexOf(f) : -1; const col = ci >= 0 ? fc[ci % fc.length] : C.s3;
              const h = hovB !== null && f && hovB >= f.offset && hovB < f.offset + f.length; const s = selF && f?.id === selF;
              return <div key={i} onMouseEnter={() => setHovB(i)} onMouseLeave={() => setHovB(null)} onClick={() => f && setSelF(f.id)} style={{ width: Math.max(3, Math.min(6, 360 / (rec?.length || 120))), height: 20, borderRadius: 1, cursor: f ? "pointer" : "default", background: s ? col : h ? col + "cc" : col + "50", outline: s ? `1px solid ${col}` : "none", transition: "background .06s" }} />;
            })}
          </div>
          {hovB !== null && (() => { const f = gf(hovB); return f ? <div style={{ marginTop: S[1], fontSize: T.xs, color: C.tx, fontFamily: "'JetBrains Mono',monospace" }}><span style={{ color: fc[rec.fields.indexOf(f) % fc.length] }}>■</span> {f.name} [{f.offset}:{f.offset + f.length - 1}] {f.type} {f.length}B</div> : null })()}
        </div>
        {/* Fields table - 7 columns for better readability */}
        <div style={{ border: `1px solid ${C.bd}`, borderRadius: 4, overflow: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: T.sm, fontFamily: "inherit" }}>
            <thead><tr style={{ background: C.s2 }}>
              {["", "#", "필드명", "Offset", "Len", "Type", "필수"].map(h => <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: C.txD, fontWeight: 500, fontSize: T.xs, textTransform: "uppercase", letterSpacing: .3, borderBottom: `1px solid ${C.bd}`, whiteSpace: "nowrap", position: "sticky", top: 0, background: C.s2, zIndex: 1 }}>{h}</th>)}
            </tr></thead>
            <tbody>{rec?.fields.map((f, i) => {
              const sel = selF === f.id; const col = fc[i % fc.length];
              return <tr key={f.id} onClick={() => setSelF(f.id)} style={{ background: sel ? col + "08" : "transparent", borderLeft: sel ? `2px solid ${col}` : "2px solid transparent", cursor: "pointer" }} onMouseEnter={e => { if (!sel) e.currentTarget.style.background = C.s2 }} onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent" }}>
                <td style={{ padding: "5px 8px", borderBottom: `1px solid ${C.bd}06` }}><div style={{ width: 8, height: 8, borderRadius: 2, background: col }} /></td>
                <td style={{ padding: "5px 8px", borderBottom: `1px solid ${C.bd}06`, fontSize: T.xs, color: C.txD, textAlign: "center" }}>{i + 1}</td>
                <td style={{ padding: "5px 8px", borderBottom: `1px solid ${C.bd}06`, color: C.txB, fontWeight: 500 }}>{f.name} <span style={{ fontSize: T.xs, color: C.txD, fontFamily: "'JetBrains Mono',monospace" }}>({f.id})</span></td>
                <td style={{ padding: "5px 8px", borderBottom: `1px solid ${C.bd}06`, fontFamily: "'JetBrains Mono',monospace", fontSize: T.xs, color: C.txD, textAlign: "center" }}>{f.offset}</td>
                <td style={{ padding: "5px 8px", borderBottom: `1px solid ${C.bd}06`, fontFamily: "'JetBrains Mono',monospace", fontSize: T.sm, color: C.txB, textAlign: "center", fontWeight: 600 }}>{f.length}</td>
                <td style={{ padding: "5px 8px", borderBottom: `1px solid ${C.bd}06` }}><B c={TC[f.type] || C.tx} s>{f.type}</B></td>
                <td style={{ padding: "5px 8px", borderBottom: `1px solid ${C.bd}06`, textAlign: "center" }}>{f.required ? <span style={{ color: C.gn, fontSize: T.xs }}>●</span> : <span style={{ color: C.txD, fontSize: T.xs }}>○</span>}</td>
              </tr>;
            })}</tbody>
            <tfoot><tr style={{ background: C.s3, position: "sticky", bottom: 0 }}>
              <td colSpan={4} style={{ padding: "6px 8px", fontSize: T.xs, fontWeight: 600, color: C.txB, textAlign: "right", borderTop: `2px solid ${C.bd}` }}>합계</td>
              <td style={{ padding: "6px 8px", fontFamily: "'JetBrains Mono',monospace", fontSize: T.sm, fontWeight: 700, textAlign: "center", borderTop: `2px solid ${C.bd}`, color: lenMatch ? C.gn : C.rd }}>{totalFieldLen}</td>
              <td colSpan={2} style={{ padding: "6px 8px", fontSize: T.xs, color: C.txD, borderTop: `2px solid ${C.bd}` }}>
                / {rec?.length}B {lenMatch ? <span style={{ color: C.gn, fontWeight: 600 }}>✓ 일치</span> : totalFieldLen < rec?.length ? <span style={{ color: C.or }}>← {rec?.length - totalFieldLen}B 미할당</span> : <span style={{ color: C.rd }}>← {totalFieldLen - rec?.length}B 초과</span>}
              </td>
            </tr></tfoot>
          </table>
        </div>
      </div>
      {/* Detail panel */}
      <div style={{ background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, padding: S[3], overflow: "auto" }}>
        {selF ? (() => { const f = rec.fields.find(x => x.id === selF); if (!f) return <div style={{ color: C.txD, fontSize: T.sm, textAlign: "center", paddingTop: 40 }}>필드를 선택하세요</div>; const ci = rec.fields.indexOf(f); const col = fc[ci % fc.length];
          return <div style={{ display: "flex", flexDirection: "column", gap: S[3] }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: col }} /><span style={{ fontSize: T.base, fontWeight: 600, color: C.txB }}>{f.name}</span></div>
            <div style={{ fontSize: T.xs, fontFamily: "'JetBrains Mono',monospace", color: C.txD }}>{f.id}</div>
            {[["Record", rec.recordType + " (" + rec.length + "B)"], ["Offset", f.offset], ["End", f.offset + f.length - 1], ["Length", f.length + "B"], ["누적 바이트", `${cumLen[ci]} / ${rec.length}B`], ["Type", f.type], ["Pad", f.pad || "NONE"], ["Required", f.required ? "✓" : "✗"], ["Fixed", f.fixedValue != null ? `"${f.fixedValue}"` : null], ["Source", f.sourceRef], ["Transform", f.transformRef], ["Description", f.description]].filter(([, v]) => v != null).map(([l, v]) => (
              <div key={l}><div style={{ fontSize: T.xs - 1, color: C.txD, marginBottom: 2, textTransform: "uppercase", letterSpacing: .3 }}>{l}</div><div style={{ fontSize: T.sm, color: C.txB, fontFamily: "'JetBrains Mono',monospace", padding: "4px 6px", background: C.s3, borderRadius: 3, border: `1px solid ${C.bd}` }}>{v}</div></div>
            ))}
          </div>;
        })() : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.txD, fontSize: T.sm }}>필드를 선택하세요</div>}
      </div>
    </div>
  );
}

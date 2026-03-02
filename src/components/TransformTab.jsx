import { useState } from "react";
import { C, RC, I } from "../constants/theme.js";
import { B, Sec, EmptyState } from "./common.jsx";

// ═══════════════════════════════════════
//  Transform Tab
//  key={tdd.id} forces fresh mount
// ═══════════════════════════════════════
export default function TransformTab({ tdd }) {
  // Guard FIRST — no hooks below depend on transforms existing
  const hasTransforms = tdd.transforms && tdd.transforms.length > 0;

  const [sel, setSel] = useState(() => hasTransforms ? tdd.transforms[0].id : null);
  const [ti, setTi] = useState(() => {
    if (!hasTransforms) return "";
    const t = tdd.transforms[0];
    return t.type === "MAPPING_TABLE" ? Object.keys(t.mappings || {})[0] || "" : "";
  });
  const [to, setTo] = useState(null);

  if (!hasTransforms) {
    return (
      <EmptyState
        icon={I.transform}
        title="등록된 Transform이 없습니다"
        description="정의서에 변환 규칙을 추가하면 여기에 표시됩니다"
      />
    );
  }

  const tr = tdd.transforms.find(t => t.id === sel) || tdd.transforms[0];
  const TB = { MAPPING_TABLE: [C.ac, "TABLE"], EXPRESSION: [C.gn, "EXPR"], DATE_FORMAT: [C.or, "DATE"], FUNCTION: [C.pr, "FUNC"] };
  const refs = tr ? tdd.layout.records.flatMap(r => r.fields.filter(f => f.transformRef === tr.id).map(f => ({ ...f, recType: r.recordType }))) : [];

  const run = () => {
    if (!tr) return;
    if (tr.type === "MAPPING_TABLE") {
      const m = tr.mappings[ti];
      setTo(m ? { ok: true, v: m } : { ok: false, v: `'${ti}' 매핑 없음` });
    } else if (tr.type === "EXPRESSION") {
      try { const value = ti; setTo({ ok: true, v: String(eval(tr.expression)) }); } catch (e) { setTo({ ok: false, v: e.message }); }
    } else if (tr.type === "DATE_FORMAT") {
      const cleaned = ti.replace(/[-\/]/g, '');
      setTo(/^\d{8}$/.test(cleaned) ? { ok: true, v: cleaned } : { ok: false, v: "유효하지 않은 날짜" });
    } else {
      setTo({ ok: true, v: "(FUNCTION — 엔진에서 실행)" });
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "auto" }}>
        {tdd.transforms.map(t => { const [bc, bl] = TB[t.type] || [C.tx, "?"]; const a = sel === t.id; return (
          <div key={t.id} onClick={() => { setSel(t.id); setTo(null); setTi(t.type === "MAPPING_TABLE" ? Object.keys(t.mappings || {})[0] || "" : t.type === "EXPRESSION" ? "50000" : "2026-03-02") }} style={{ padding: "7px 9px", background: a ? C.s3 : C.s2, border: `1px solid ${a ? bc + "38" : C.bd}`, borderRadius: 3, cursor: "pointer", borderLeft: `3px solid ${a ? bc : C.bd}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}><span style={{ fontSize: 10, fontWeight: a ? 600 : 400, color: a ? C.txB : C.tx }}>{t.name}</span><B c={bc} s>{bl}</B></div>
            <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: C.txD }}>{t.id}</div>
          </div>);
        })}
        {refs.length > 0 && <div style={{ marginTop: 8 }}><div style={{ fontSize: 8, color: C.txD, marginBottom: 4, textTransform: "uppercase", letterSpacing: .3 }}>참조 필드</div>
          {refs.map(f => <div key={f.id} style={{ padding: "2px 6px", fontSize: 9, color: C.cy, fontFamily: "'JetBrains Mono',monospace", marginBottom: 1 }}>← <B c={RC[f.recType]} s>{f.recType[0]}</B> {f.id} <span style={{ color: C.txD }}>({f.name})</span></div>)}
        </div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, overflow: "auto" }}>
        {tr && <>
          <div style={{ background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, padding: 12 }}>
            <Sec icon="⚙">변환 규칙</Sec>
            {tr.type === "MAPPING_TABLE" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 2 }}>
              {Object.entries(tr.mappings).map(([k, v]) => <div key={k} style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 6px", background: C.s3, borderRadius: 2, fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}><span style={{ color: C.tx, minWidth: 50 }}>{k}</span><span style={{ color: C.txD }}>→</span><span style={{ color: C.gn, fontWeight: 600 }}>{v}</span></div>)}
            </div>}
            {tr.type === "EXPRESSION" && <div style={{ padding: "7px 10px", background: C.s3, borderRadius: 3, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.gn, border: `1px solid ${C.bd}` }}>{tr.expression}</div>}
            {tr.type === "DATE_FORMAT" && <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>{tr.inputFormats.map(f => <B key={f} c={C.or}>{f}</B>)}<span style={{ color: C.txD }}>→</span><B c={C.gn}>{tr.outputFormat}</B></div>}
            {tr.type === "FUNCTION" && <div style={{ padding: "7px 10px", background: C.s3, borderRadius: 3, fontSize: 10, color: C.pr, border: `1px solid ${C.bd}` }}>내장 함수: <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{tr.functionName}</span></div>}
          </div>
          <div style={{ background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, padding: 12 }}>
            <Sec icon="▶" right={<button onClick={run} style={{ padding: "3px 10px", fontSize: 9, fontWeight: 600, background: C.ac, color: "#fff", border: "none", borderRadius: 3, cursor: "pointer" }}>실행</button>}>테스트</Sec>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 8, color: C.txD, marginBottom: 2 }}>INPUT</div><input value={ti} onChange={e => { setTi(e.target.value); setTo(null) }} onKeyDown={e => e.key === "Enter" && run()} style={{ width: "100%", padding: "5px 7px", background: C.s3, border: `1px solid ${C.bd}`, borderRadius: 3, color: C.txB, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, outline: "none", boxSizing: "border-box" }} /></div>
              <div style={{ color: C.txD, paddingTop: 12, fontSize: 12 }}>→</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 8, color: C.txD, marginBottom: 2 }}>OUTPUT</div><div style={{ padding: "5px 7px", background: to ? to.ok ? C.gnD : C.rdD : C.s3, border: `1px solid ${to ? to.ok ? C.gn + "28" : C.rd + "28" : C.bd}`, borderRadius: 3, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: to ? to.ok ? C.gn : C.rd : C.txD, minHeight: 14 }}>{to ? to.v : "—"}</div></div>
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}

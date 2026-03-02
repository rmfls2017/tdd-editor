import { useState } from "react";
import { C, I } from "../constants/theme.js";
import { B, Chip, Sec, EmptyState } from "./common.jsx";

// ═══════════════════════════════════════
//  DataSource Tab
// ═══════════════════════════════════════
export default function DataSourceTab({ tdd }) {
  const hasDatasources = tdd.dataSources && tdd.dataSources.length > 0;
  const [sel, setSel] = useState(() => hasDatasources ? tdd.dataSources[0].id : null);
  const [sc, setSc] = useState("default");

  if (!hasDatasources) {
    return (
      <EmptyState
        icon={I.dataSource}
        title="등록된 DataSource가 없습니다"
        description="정의서에 데이터소스를 추가하면 여기에 표시됩니다"
      />
    );
  }

  const ds = tdd.dataSources.find(d => d.id === sel) || tdd.dataSources[0];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {tdd.dataSources.map(d => { const a = sel === d.id; return (
          <div key={d.id} onClick={() => { setSel(d.id); setSc("default") }} style={{ padding: "7px 9px", background: a ? C.s3 : C.s2, border: `1px solid ${a ? C.cy + "38" : C.bd}`, borderRadius: 3, cursor: "pointer", borderLeft: `3px solid ${a ? C.cy : C.bd}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}><span style={{ fontSize: 10, fontWeight: a ? 600 : 400, color: a ? C.txB : C.tx }}>{d.name}</span><B c={C.cy} s>QUERY</B></div>
            <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: C.txD }}>{d.id}</div>
          </div>);
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, overflow: "auto" }}>
        {ds && <>
          <div style={{ background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, padding: 12 }}>
            <Sec icon="📄">SQL</Sec>
            <pre style={{ padding: "8px 10px", background: "#070810", borderRadius: 3, border: `1px solid ${C.bd}`, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.txB, margin: 0, overflow: "auto", lineHeight: 1.5 }}>
              {ds.query.split('\n').map((l, i) => <span key={i}>{l.split(/(SELECT|FROM|JOIN|WHERE|AND|ON|ORDER BY|AS|NVL|MAX|:\w+)/g).map((p, j) => /^(SELECT|FROM|JOIN|WHERE|AND|ON|ORDER BY|AS|NVL|MAX)$/.test(p) ? <span key={j} style={{ color: C.ac, fontWeight: 600 }}>{p}</span> : /^:\w+/.test(p) ? <span key={j} style={{ color: C.or }}>{p}</span> : <span key={j}>{p}</span>)}{'\n'}</span>)}
            </pre>
            <div style={{ marginTop: 6 }}><div style={{ fontSize: 8, color: C.txD, marginBottom: 3 }}>PARAMS</div>
              {ds.params.map(p => <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 5px", background: C.s3, borderRadius: 2, marginBottom: 1 }}><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.or }}>{`:${p.name}`}</span><span style={{ color: C.txD, fontSize: 8 }}>←</span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.cy }}>{p.source}</span></div>)}
            </div>
          </div>
          <div style={{ background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, padding: 12 }}>
            <Sec icon="🧪">Stub</Sec>
            <div style={{ display: "flex", gap: 3, marginBottom: 8, flexWrap: "wrap" }}>{Object.keys(ds.stub.scenarios).map(s => <Chip key={s} on={sc === s} onClick={() => setSc(s)}>{s}</Chip>)}</div>
            <pre style={{ background: "#070810", borderRadius: 3, border: `1px solid ${C.bd}`, padding: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.txB, margin: 0, overflow: "auto", maxHeight: 160, lineHeight: 1.4 }}>{JSON.stringify(ds.stub.scenarios[sc], null, 2)}</pre>
          </div>
        </>}
      </div>
    </div>
  );
}

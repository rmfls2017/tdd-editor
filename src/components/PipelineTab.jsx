import { useState, useCallback, useRef } from "react";
import { C, AC, I } from "../constants/theme.js";
import { B, Sec, EmptyState } from "./common.jsx";

// ═══════════════════════════════════════
//  Pipeline Tab
// ═══════════════════════════════════════
export default function PipelineTab({ tdd }) {
  const hasSteps = tdd.pipeline?.steps && tdd.pipeline.steps.length > 0;
  const [drs, setDrs] = useState(null);
  const [rs, setRs] = useState(-1);
  const runIdRef = useRef(0);

  const run = useCallback(async () => {
    if (!hasSteps) return;
    const currentRunId = ++runIdRef.current;
    setDrs("run");
    for (let i = 0; i < tdd.pipeline.steps.length; i++) {
      if (runIdRef.current !== currentRunId) return; // cancelled
      setRs(i);
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
    }
    if (runIdRef.current === currentRunId) {
      setRs(-1); setDrs("done");
    }
  }, [tdd, hasSteps]);

  if (!hasSteps) {
    return (
      <EmptyState
        icon={I.pipeline}
        title="파이프라인이 정의되지 않았습니다"
        description="정의서에 파이프라인 단계를 추가하면 여기에 표시됩니다"
      />
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, overflow: "auto" }}>
        <div style={{ background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, padding: 12 }}>
          <Sec icon="▶" right={<button onClick={run} disabled={drs === "run"} style={{ padding: "3px 12px", fontSize: 9, fontWeight: 600, background: drs === "run" ? C.s3 : C.gn, color: drs === "run" ? C.txD : "#000", border: "none", borderRadius: 3, cursor: drs === "run" ? "not-allowed" : "pointer" }}>{drs === "run" ? "실행중..." : drs === "done" ? "↻ 재실행" : "DryRun"}</button>}>Pipeline ({tdd.pipeline.steps.length} steps)</Sec>
          {tdd.pipeline.steps.map((s, i) => { const col = AC[s.action] || C.tx; const ir = rs === i; const id = drs === "done" || (drs === "run" && rs > i); return (
            <div key={s.id}><div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 8px", borderRadius: 3, background: ir ? col + "06" : "transparent" }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", background: id ? col + "18" : ir ? col + "38" : C.s3, color: id || ir ? col : C.txD, border: `2px solid ${id || ir ? col : C.bd}`, boxShadow: ir ? `0 0 8px ${col}40` : "none", flexShrink: 0 }}>{id && !ir ? "✓" : s.order}</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: C.txB, marginBottom: 1 }}>{s.description}</div><div style={{ display: "flex", gap: 3, alignItems: "center" }}><B c={col} s>{s.action}</B>{s.dataSourceRef && <span style={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: C.txD }}>→ {s.dataSourceRef}</span>}</div></div>
              {id && !ir && <span style={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: C.gn }}>{Math.floor(Math.random() * 50 + 5)}ms</span>}
              {ir && <div style={{ width: 10, height: 10, borderRadius: 5, border: `2px solid ${col}`, borderTopColor: "transparent", animation: "spin .7s linear infinite" }} />}
            </div>{i < tdd.pipeline.steps.length - 1 && <div style={{ marginLeft: 19, width: 2, height: 4, background: id ? col + "38" : C.bd }} />}</div>);
          })}
        </div>
        {tdd.validationRules && tdd.validationRules.length > 0 && <div style={{ background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, padding: 12 }}>
          <Sec icon="🛡">Validation</Sec>
          {tdd.validationRules.map(v => <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 6px", background: C.s3, borderRadius: 2, marginBottom: 2 }}><B c={v.level === "ERROR" ? C.rd : C.or} s>{v.level}</B><span style={{ fontSize: 9, color: C.tx, flex: 1 }}>{v.name}</span></div>)}
        </div>}
      </div>
      <div style={{ background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, padding: 12, overflow: "auto" }}>
        <Sec icon="🧪" right={tdd.testCases && tdd.testCases.length > 0 ? <span style={{ fontSize: 9, color: C.txD }}>{tdd.testCases.filter(t => t.success).length}✓ {tdd.testCases.filter(t => !t.success).length}✗</span> : null}>Tests</Sec>
        {tdd.testCases && tdd.testCases.length > 0 ? tdd.testCases.map(tc => <div key={tc.id} style={{ padding: "5px 7px", background: C.s3, borderRadius: 2, marginBottom: 2, border: `1px solid ${C.bd}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ fontSize: 10 }}>{tc.success ? "✅" : "❌"}</span><span style={{ fontSize: 9, color: C.txB, flex: 1 }}>{tc.name}</span><span style={{ fontSize: 7, fontFamily: "'JetBrains Mono',monospace", color: C.txD }}>{tc.id}</span></div>
        </div>) : <div style={{ color: C.txD, fontSize: 10, textAlign: "center", padding: 16 }}>테스트 없음</div>}
      </div>
    </div>
  );
}

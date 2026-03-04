import { useState } from "react";
import { C, RC, I } from "../constants/theme.js";
import { B, Sec, EmptyState, Btn } from "./common.jsx";
import { ActionButton } from "./ActionButton.jsx";
import TransformEditModal from "./TransformEditModal.jsx";

function validateInput(transform, value) {
  if (!value || !transform) return { valid: true };

  if (transform.type === "MAPPING_TABLE") {
    const exists = value in transform.mappings;
    return exists
      ? { valid: true }
      : { valid: false, message: `'${value}' 매핑 키에 없음` };
  }

  if (transform.type === "DATE_FORMAT") {
    const cleaned = value.replace(/[-\/.\s]/g, "");
    const isDate = /^\d{8}$/.test(cleaned);
    return isDate
      ? { valid: true }
      : { valid: false, message: "날짜 형식이 아닙니다" };
  }

  return { valid: true };
}

// ═══════════════════════════════════════
//  Transform Tab
//  key={tdd.id} forces fresh mount
// ═══════════════════════════════════════
export default function TransformTab({ tdd, onTddUpdate }) {
  // Guard FIRST — no hooks below depend on transforms existing
  const hasTransforms = tdd.transforms && tdd.transforms.length > 0;

  const [sel, setSel] = useState(() => hasTransforms ? tdd.transforms[0].id : null);
  const [testResults, setTestResults] = useState({});  // { tcId: { ok: true, v: "004" }, ... }
  const [editingTestCase, setEditingTestCase] = useState(null);  // { tcId, input, expected, focus } or null for new
  const [showModal, setShowModal] = useState(false);
  const [editingTransform, setEditingTransform] = useState(null);
  const [hovered, setHovered] = useState(null);

  // CRUD handlers
  const handleAdd = () => {
    setEditingTransform(null);
    setShowModal(true);
  };

  const handleEdit = (transform) => {
    setEditingTransform(transform);
    setShowModal(true);
  };

  const handleDelete = (transform) => {
    if (!confirm(`'${transform.name}' Transform을 삭제하시겠습니까?`)) return;
    const updatedTdd = {
      ...tdd,
      transforms: tdd.transforms.filter(t => t.id !== transform.id)
    };
    onTddUpdate(updatedTdd);
    if (sel === transform.id) {
      setSel(updatedTdd.transforms[0]?.id || null);
    }
  };

  const handleSave = (transformData) => {
    let updatedTransforms;
    if (editingTransform) {
      // Edit existing
      updatedTransforms = tdd.transforms.map(t =>
        t.id === editingTransform.id ? { ...transformData, testCases: t.testCases } : t
      );
    } else {
      // Add new
      updatedTransforms = [...(tdd.transforms || []), transformData];
    }
    const updatedTdd = { ...tdd, transforms: updatedTransforms };
    onTddUpdate(updatedTdd);
    setShowModal(false);
    setEditingTransform(null);
    setSel(transformData.id);
  };

  // Test case CRUD handlers
  const handleAddTestCase = (transformId) => {
    const transform = tdd.transforms.find(t => t.id === transformId);
    if (!transform) return;
    const newTc = { id: `tc_${Date.now()}`, input: "", expected: "" };
    const updatedTransform = {
      ...transform,
      testCases: [...(transform.testCases || []), newTc]
    };
    const updatedTdd = {
      ...tdd,
      transforms: tdd.transforms.map(t => t.id === transformId ? updatedTransform : t)
    };
    onTddUpdate(updatedTdd);
    setEditingTestCase({ transformId, tcId: newTc.id, input: "", expected: "" });
  };

  const handleEditTestCase = (transformId, tc) => {
    setEditingTestCase({ transformId, tcId: tc.id, input: tc.input, expected: tc.expected });
  };

  const handleSaveTestCase = () => {
    if (!editingTestCase) return;
    const { transformId, tcId, input, expected } = editingTestCase;
    const transform = tdd.transforms.find(t => t.id === transformId);
    if (!transform) return;
    const updatedTestCases = (transform.testCases || []).map(tc =>
      tc.id === tcId ? { ...tc, input, expected } : tc
    );
    const updatedTransform = { ...transform, testCases: updatedTestCases };
    const updatedTdd = {
      ...tdd,
      transforms: tdd.transforms.map(t => t.id === transformId ? updatedTransform : t)
    };
    onTddUpdate(updatedTdd);
    setEditingTestCase(null);
  };

  const handleDeleteTestCase = (transformId, tcId) => {
    const transform = tdd.transforms.find(t => t.id === transformId);
    if (!transform) return;
    const updatedTestCases = (transform.testCases || []).filter(tc => tc.id !== tcId);
    const updatedTransform = { ...transform, testCases: updatedTestCases };
    const updatedTdd = {
      ...tdd,
      transforms: tdd.transforms.map(t => t.id === transformId ? updatedTransform : t)
    };
    onTddUpdate(updatedTdd);
    setTestResults(prev => { const next = { ...prev }; delete next[tcId]; return next; });
  };

  const runSingleTest = (transform, input) => {
    if (!transform) return { ok: false, v: "Transform 없음" };
    if (transform.type === "MAPPING_TABLE") {
      const m = transform.mappings[input];
      return m ? { ok: true, v: m } : { ok: false, v: `'${input}' 매핑 없음` };
    } else if (transform.type === "EXPRESSION") {
      try { const value = input; return { ok: true, v: String(eval(transform.expression)) }; } catch (e) { return { ok: false, v: e.message }; }
    } else if (transform.type === "DATE_FORMAT") {
      const cleaned = input.replace(/[-\/]/g, '');
      return /^\d{8}$/.test(cleaned) ? { ok: true, v: cleaned } : { ok: false, v: "유효하지 않은 날짜" };
    } else {
      return { ok: true, v: "(FUNCTION — 엔진에서 실행)" };
    }
  };

  const handleRunTestCase = (transformId, tc) => {
    const transform = tdd.transforms.find(t => t.id === transformId);
    const result = runSingleTest(transform, tc.input);
    setTestResults(prev => ({ ...prev, [tc.id]: result }));
  };

  const handleRunAll = (transformId) => {
    const transform = tdd.transforms.find(t => t.id === transformId);
    if (!transform || !transform.testCases) return;
    const results = {};
    transform.testCases.forEach(tc => {
      results[tc.id] = runSingleTest(transform, tc.input);
    });
    setTestResults(prev => ({ ...prev, ...results }));
  };

  if (!hasTransforms) {
    return (
      <>
        <EmptyState
          icon={I.transform}
          title="등록된 Transform이 없습니다"
          description="정의서에 변환 규칙을 추가하면 여기에 표시됩니다"
          action={<Btn variant="primary" onClick={handleAdd}>+ Transform 추가</Btn>}
        />
        {showModal && (
          <TransformEditModal
            transform={editingTransform}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditingTransform(null); }}
          />
        )}
      </>
    );
  }

  const tr = tdd.transforms.find(t => t.id === sel) || tdd.transforms[0];
  const TB = { MAPPING_TABLE: [C.ac, "TABLE"], EXPRESSION: [C.gn, "EXPR"], DATE_FORMAT: [C.or, "DATE"], FUNCTION: [C.pr, "FUNC"] };
  const refs = tr ? tdd.layout.records.flatMap(r => r.fields.filter(f => f.transformRef === tr.id).map(f => ({ ...f, recType: r.recordType }))) : [];

  return (
    <>
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "auto" }}>
        {/* Header with Add button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.txD }}>Transform 목록</span>
          <Btn variant="ghost" size="sm" onClick={handleAdd}>+ 추가</Btn>
        </div>
        {tdd.transforms.map(t => { const [bc, bl] = TB[t.type] || [C.tx, "?"]; const a = sel === t.id; return (
          <div key={t.id} style={{ position: "relative" }} onMouseEnter={() => setHovered(t.id)} onMouseLeave={() => setHovered(null)}>
            <div onClick={() => setSel(t.id)} style={{ padding: "7px 9px", background: a ? C.s3 : C.s2, border: `1px solid ${a ? bc + "38" : C.bd}`, borderRadius: 3, cursor: "pointer", borderLeft: `3px solid ${a ? bc : C.bd}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}><span style={{ fontSize: 10, fontWeight: a ? 600 : 400, color: a ? C.txB : C.tx }}>{t.name}</span><B c={bc} s>{bl}</B></div>
              <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: C.txD }}>{t.id}</div>
            </div>
            {hovered === t.id && (
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 4, paddingLeft: 24, paddingRight: 6, background: `linear-gradient(to right, transparent, ${a ? C.s3 : C.s2} 30%)` }}>
                <ActionButton variant="edit" onClick={(e) => { e.stopPropagation(); handleEdit(t); }} />
                <ActionButton variant="delete" onClick={(e) => { e.stopPropagation(); handleDelete(t); }} />
              </div>
            )}
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
            <Sec icon="▶" right={
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => handleAddTestCase(tr.id)} style={{ padding: "3px 10px", fontSize: 9, fontWeight: 600, background: "transparent", color: C.ac, border: `1px solid ${C.ac}`, borderRadius: 3, cursor: "pointer" }}>+ 추가</button>
                {(tr.testCases?.length > 0) && <button onClick={() => handleRunAll(tr.id)} style={{ padding: "3px 10px", fontSize: 9, fontWeight: 600, background: C.ac, color: "#fff", border: "none", borderRadius: 3, cursor: "pointer" }}>전체 실행</button>}
              </div>
            }>테스트 케이스</Sec>
            {(!tr.testCases || tr.testCases.length === 0) ? (
              <div style={{ padding: 16, textAlign: "center", color: C.txD, fontSize: 10 }}>등록된 테스트 케이스가 없습니다</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Header */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 6, padding: "4px 6px", fontSize: 8, color: C.txD, textTransform: "uppercase", letterSpacing: 0.3 }}>
                  <span>INPUT</span><span>EXPECTED</span><span>RESULT</span><span style={{ width: 76 }}></span>
                </div>
                {/* Test case rows */}
                {tr.testCases.map(tc => {
                  const result = testResults[tc.id];
                  const isEditing = editingTestCase?.tcId === tc.id;
                  const passed = result && result.ok && result.v === tc.expected;
                  // Keyboard handler for edit mode
                  const handleKeyDown = (e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleSaveTestCase(); }
                    else if (e.key === "Escape") { e.preventDefault(); setEditingTestCase(null); }
                  };
                  const focusedField = editingTestCase?.focus;
                  const validation = isEditing ? validateInput(tr, editingTestCase.input) : { valid: true };
                  const inputBorderColor = !validation.valid ? C.or : focusedField === "input" ? C.ac : C.bd;
                  return (
                    <div key={tc.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 6, alignItems: "center", padding: "4px 6px", background: isEditing ? C.ac + "0d" : C.s3, borderRadius: 3, border: `1px solid ${result ? (passed ? C.gn + "38" : C.rd + "38") : C.bd}`, transition: "all 0.15s ease" }}>
                      {isEditing ? (
                        <>
                          <input autoFocus value={editingTestCase.input} onChange={e => setEditingTestCase(prev => ({ ...prev, input: e.target.value }))} onKeyDown={handleKeyDown} onFocus={() => setEditingTestCase(prev => ({ ...prev, focus: "input" }))} onBlur={() => setEditingTestCase(prev => ({ ...prev, focus: null }))} style={{ padding: "3px 5px", background: C.s2, border: `1px solid ${inputBorderColor}`, borderRadius: 2, color: C.txB, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, outline: "none", transition: "border-color 0.1s ease" }} title={validation.valid ? undefined : validation.message} placeholder="입력값" />
                          <input value={editingTestCase.expected} onChange={e => setEditingTestCase(prev => ({ ...prev, expected: e.target.value }))} onKeyDown={handleKeyDown} onFocus={() => setEditingTestCase(prev => ({ ...prev, focus: "expected" }))} onBlur={() => setEditingTestCase(prev => ({ ...prev, focus: null }))} style={{ padding: "3px 5px", background: C.s2, border: `1px solid ${focusedField === "expected" ? C.ac : C.bd}`, borderRadius: 2, color: C.txB, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, outline: "none", transition: "border-color 0.1s ease" }} placeholder="기대값" />
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.txD }}>—</span>
                          <div style={{ display: "flex", gap: 4, width: 76, justifyContent: "flex-end" }}>
                            <button onClick={handleSaveTestCase} title="저장 (Enter)" style={{ width: 22, height: 22, boxSizing: "border-box", background: C.gn, border: "1px solid " + C.gn, borderRadius: 2, color: "#fff", cursor: "pointer", fontSize: 10 }}>✓</button>
                            <button onClick={() => setEditingTestCase(null)} title="취소 (Esc)" style={{ width: 22, height: 22, boxSizing: "border-box", background: "transparent", border: `1px solid ${C.rd}`, borderRadius: 2, color: C.rd, cursor: "pointer", fontSize: 10 }}>✕</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.txB }}>{tc.input || <span style={{ color: C.txD }}>—</span>}</span>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.cy }}>{tc.expected || <span style={{ color: C.txD }}>—</span>}</span>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: result ? (passed ? C.gn : C.rd) : C.txD }}>{result ? (passed ? `✓ ${result.v}` : `✗ ${result.v}`) : "—"}</span>
                          <div style={{ display: "flex", gap: 4, width: 76, justifyContent: "flex-end" }}>
                            <ActionButton variant="run" onClick={() => handleRunTestCase(tr.id, tc)} />
                            <ActionButton variant="edit" onClick={() => handleEditTestCase(tr.id, tc)} />
                            <ActionButton variant="delete" onClick={() => handleDeleteTestCase(tr.id, tc.id)} />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>}
      </div>
    </div>
    {showModal && (
      <TransformEditModal
        transform={editingTransform}
        onSave={handleSave}
        onClose={() => { setShowModal(false); setEditingTransform(null); }}
      />
    )}
    </>
  );
}

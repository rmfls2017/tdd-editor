import { useState } from "react";
import { C, I } from "../constants/theme.js";
import { B, Chip, Sec, EmptyState, Btn } from "./common.jsx";
import { ActionButton } from "./ActionButton.jsx";
import DataSourceEditModal from "./DataSourceEditModal.jsx";

// ═══════════════════════════════════════
//  DataSource Tab
// ═══════════════════════════════════════
export default function DataSourceTab({ tdd, onTddUpdate }) {
  const hasDatasources = tdd.dataSources && tdd.dataSources.length > 0;
  const [sel, setSel] = useState(() => hasDatasources ? tdd.dataSources[0].id : null);
  const [sc, setSc] = useState("default");
  const [showModal, setShowModal] = useState(false);
  const [editingDs, setEditingDs] = useState(null);
  const [hovered, setHovered] = useState(null);
  // Scenario editing state
  const [hoveredScenario, setHoveredScenario] = useState(null);
  const [editingScenario, setEditingScenario] = useState(null);  // { dsId, name, data, isNew }
  const [scenarioJsonError, setScenarioJsonError] = useState(null);

  // CRUD handlers
  const handleAdd = () => {
    setEditingDs(null);
    setShowModal(true);
  };

  const handleEdit = (ds) => {
    setEditingDs(ds);
    setShowModal(true);
  };

  const handleDelete = (ds) => {
    if (!confirm(`'${ds.name}' DataSource를 삭제하시겠습니까?`)) return;
    const updatedTdd = {
      ...tdd,
      dataSources: tdd.dataSources.filter(d => d.id !== ds.id)
    };
    onTddUpdate(updatedTdd);
    if (sel === ds.id) {
      setSel(updatedTdd.dataSources[0]?.id || null);
    }
  };

  const handleSave = (dsData) => {
    let updatedDataSources;
    if (editingDs) {
      // Edit existing
      updatedDataSources = tdd.dataSources.map(d =>
        d.id === editingDs.id ? dsData : d
      );
    } else {
      // Add new
      updatedDataSources = [...(tdd.dataSources || []), dsData];
    }
    const updatedTdd = { ...tdd, dataSources: updatedDataSources };
    onTddUpdate(updatedTdd);
    setShowModal(false);
    setEditingDs(null);
    setSel(dsData.id);
  };

  // Scenario CRUD handlers
  const handleAddScenario = (dsId) => {
    setEditingScenario({ dsId, name: "", data: "{}", isNew: true });
    setScenarioJsonError(null);
  };

  const handleEditScenario = (dsId, name) => {
    const ds = tdd.dataSources.find(d => d.id === dsId);
    if (!ds) return;
    setEditingScenario({ dsId, name, data: JSON.stringify(ds.stub.scenarios[name], null, 2), isNew: false, originalName: name });
    setScenarioJsonError(null);
  };

  const handleDeleteScenario = (dsId, name) => {
    if (!confirm(`'${name}' 시나리오를 삭제하시겠습니까?`)) return;
    const ds = tdd.dataSources.find(d => d.id === dsId);
    if (!ds) return;
    const newScenarios = { ...ds.stub.scenarios };
    delete newScenarios[name];
    const updatedDs = { ...ds, stub: { ...ds.stub, scenarios: newScenarios } };
    const updatedTdd = { ...tdd, dataSources: tdd.dataSources.map(d => d.id === dsId ? updatedDs : d) };
    onTddUpdate(updatedTdd);
    if (sc === name) setSc(Object.keys(newScenarios)[0] || "default");
  };

  const handleSaveScenario = () => {
    if (!editingScenario) return;
    const { dsId, name, data, isNew, originalName } = editingScenario;
    if (!name.trim()) { setScenarioJsonError("시나리오 이름을 입력하세요"); return; }
    let parsedData;
    try { parsedData = JSON.parse(data); } catch (e) { setScenarioJsonError("유효하지 않은 JSON: " + e.message); return; }
    const ds = tdd.dataSources.find(d => d.id === dsId);
    if (!ds) return;
    const newScenarios = { ...ds.stub.scenarios };
    if (!isNew && originalName !== name) delete newScenarios[originalName];
    newScenarios[name] = parsedData;
    const updatedDs = { ...ds, stub: { ...ds.stub, scenarios: newScenarios } };
    const updatedTdd = { ...tdd, dataSources: tdd.dataSources.map(d => d.id === dsId ? updatedDs : d) };
    onTddUpdate(updatedTdd);
    setSc(name);
    setEditingScenario(null);
    setScenarioJsonError(null);
  };

  if (!hasDatasources) {
    return (
      <>
        <EmptyState
          icon={I.dataSource}
          title="등록된 DataSource가 없습니다"
          description="정의서에 데이터소스를 추가하면 여기에 표시됩니다"
          action={<Btn variant="primary" onClick={handleAdd}>+ DataSource 추가</Btn>}
        />
        {showModal && (
          <DataSourceEditModal
            ds={editingDs}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditingDs(null); }}
          />
        )}
      </>
    );
  }

  const ds = tdd.dataSources.find(d => d.id === sel) || tdd.dataSources[0];

  return (
    <>
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "auto" }}>
        {/* Header with Add button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.txD }}>DataSource 목록</span>
          <Btn variant="ghost" size="sm" onClick={handleAdd}>+ 추가</Btn>
        </div>
        {tdd.dataSources.map(d => { const a = sel === d.id; return (
          <div key={d.id} style={{ position: "relative" }} onMouseEnter={() => setHovered(d.id)} onMouseLeave={() => setHovered(null)}>
            <div onClick={() => { setSel(d.id); setSc("default") }} style={{ padding: "7px 9px", background: a ? C.s3 : C.s2, border: `1px solid ${a ? C.cy + "38" : C.bd}`, borderRadius: 3, cursor: "pointer", borderLeft: `3px solid ${a ? C.cy : C.bd}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}><span style={{ fontSize: 10, fontWeight: a ? 600 : 400, color: a ? C.txB : C.tx }}>{d.name}</span><B c={C.cy} s>QUERY</B></div>
              <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", color: C.txD }}>{d.id}</div>
            </div>
            {hovered === d.id && (
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, display: "flex", alignItems: "center", gap: 4, paddingLeft: 24, paddingRight: 6, background: `linear-gradient(to right, transparent, ${a ? C.s3 : C.s2} 30%)` }}>
                <ActionButton variant="edit" onClick={(e) => { e.stopPropagation(); handleEdit(d); }} />
                <ActionButton variant="delete" onClick={(e) => { e.stopPropagation(); handleDelete(d); }} />
              </div>
            )}
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
            <Sec icon="🧪" right={<button onClick={() => handleAddScenario(ds.id)} style={{ padding: "3px 10px", fontSize: 9, fontWeight: 600, background: "transparent", color: C.ac, border: `1px solid ${C.ac}`, borderRadius: 3, cursor: "pointer" }}>+ 추가</button>}>Stub</Sec>
            <div style={{ display: "flex", gap: 3, marginBottom: 8, flexWrap: "wrap" }}>
              {Object.keys(ds.stub.scenarios).map(s => (
                <div key={s} style={{ position: "relative", display: "inline-block" }} onMouseEnter={() => setHoveredScenario(s)} onMouseLeave={() => setHoveredScenario(null)}>
                  <Chip on={sc === s} onClick={() => setSc(s)}>{s}</Chip>
                  {hoveredScenario === s && (
                    <div style={{ position: "absolute", top: -2, right: -2, display: "flex", gap: 2 }}>
                      <ActionButton variant="edit" size="sm" onClick={(e) => { e.stopPropagation(); handleEditScenario(ds.id, s); }} />
                      <ActionButton variant="delete" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteScenario(ds.id, s); }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <pre style={{ background: "#070810", borderRadius: 3, border: `1px solid ${C.bd}`, padding: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: C.txB, margin: 0, overflow: "auto", maxHeight: 160, lineHeight: 1.4 }}>{JSON.stringify(ds.stub.scenarios[sc], null, 2)}</pre>
          </div>
        </>}
      </div>
    </div>
    {showModal && (
      <DataSourceEditModal
        ds={editingDs}
        onSave={handleSave}
        onClose={() => { setShowModal(false); setEditingDs(null); }}
      />
    )}
    {editingScenario && (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setEditingScenario(null)}>
        <div style={{ background: C.s1, border: `1px solid ${C.bd}`, borderRadius: 6, padding: 16, width: 400, maxHeight: "80vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.txB }}>{editingScenario.isNew ? "시나리오 추가" : "시나리오 편집"}</span>
            <button onClick={() => setEditingScenario(null)} style={{ background: "transparent", border: "none", color: C.txD, cursor: "pointer", fontSize: 16 }}>×</button>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 9, color: C.txD, display: "block", marginBottom: 3 }}>시나리오 이름</label>
            <input value={editingScenario.name} onChange={e => setEditingScenario(prev => ({ ...prev, name: e.target.value }))} style={{ width: "100%", padding: "6px 8px", background: C.s3, border: `1px solid ${C.bd}`, borderRadius: 3, color: C.txB, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, outline: "none", boxSizing: "border-box" }} placeholder="default" />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 9, color: C.txD, display: "block", marginBottom: 3 }}>JSON 데이터</label>
            <textarea value={editingScenario.data} onChange={e => { setEditingScenario(prev => ({ ...prev, data: e.target.value })); setScenarioJsonError(null); }} style={{ width: "100%", height: 200, padding: "6px 8px", background: C.s3, border: `1px solid ${scenarioJsonError ? C.rd : C.bd}`, borderRadius: 3, color: C.txB, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, outline: "none", boxSizing: "border-box", resize: "vertical" }} placeholder="{}" />
            {scenarioJsonError && <div style={{ fontSize: 9, color: C.rd, marginTop: 3 }}>{scenarioJsonError}</div>}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
            <button onClick={() => setEditingScenario(null)} style={{ padding: "6px 12px", fontSize: 10, background: "transparent", border: `1px solid ${C.bd}`, borderRadius: 3, color: C.tx, cursor: "pointer" }}>취소</button>
            <button onClick={handleSaveScenario} style={{ padding: "6px 12px", fontSize: 10, background: C.ac, border: "none", borderRadius: 3, color: "#fff", cursor: "pointer", fontWeight: 600 }}>저장</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

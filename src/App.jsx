import { useState, useMemo, useEffect } from "react";
import CreateWizard from "./CreateWizard.jsx";

// Theme and constants
import { C, SC, I } from "./constants/theme.js";

// API client
import { api } from "./utils/api.js";

// Common components
import { B, Btn, ActionMenu } from "./components/common.jsx";

// Tab components
import LayoutTab from "./components/LayoutTab.jsx";
import TransformTab from "./components/TransformTab.jsx";
import DataSourceTab from "./components/DataSourceTab.jsx";
import PipelineTab from "./components/PipelineTab.jsx";
import ParserTab from "./components/ParserTab.jsx";

// Import utility
import { importTDDFile, openFileDialog } from "./utils/tddImporter.js";

// ═══════════════════════════════════════
//  Main App
// ═══════════════════════════════════════
export default function App() {
  const [tddList, setTddList] = useState([]);
  const [tddId, setTddId] = useState(null);
  const [sidebar, setSidebar] = useState(true);
  const [tab, setTab] = useState("layout");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("view"); // "view" | "create" | "edit"
  const [toast, setToast] = useState(null);
  const [template, setTemplate] = useState(null); // 복제할 TDD
  const [editTarget, setEditTarget] = useState(null); // 편집할 TDD
  const [showStatusDropdown, setShowStatusDropdown] = useState(false); // 상태 드롭다운
  const [loading, setLoading] = useState(true);
  const [parserStates, setParserStates] = useState({}); // Parser 탭 상태를 TDD별로 저장
  const tdd = tddList.find(t => t.id === tddId);

  // Parser 상태 업데이트 헬퍼
  const updateParserState = (tddId, state) => {
    setParserStates(prev => ({
      ...prev,
      [tddId]: { ...prev[tddId], ...state }
    }));
  };

  // Parser 상태 가져오기 헬퍼
  const getParserState = (tddId) => parserStates[tddId] || {};

  // Load data from API
  useEffect(() => {
    api.getTddList().then(tdds => {
      setTddList(tdds);
      if (tdds.length > 0 && !tddId) {
        setTddId(tdds[0].id);
      }
      setLoading(false);
    }).catch(err => {
      console.error('Failed to load TDD list:', err);
      setLoading(false);
    });
  }, []);

  const cats = useMemo(() => { const m = {}; tddList.forEach(t => { if (!m[t.category]) m[t.category] = []; m[t.category].push(t); }); return m; }, [tddList]);
  const filtered = search ? tddList.filter(t => t.name.includes(search) || t.code.includes(search.toUpperCase()) || t.id.toLowerCase().includes(search.toLowerCase())) : null;

  const tabs = [
    { id: "layout", label: "Layout", icon: I.layout },
    { id: "transform", label: "Transform", icon: I.transform },
    { id: "datasource", label: "DataSource", icon: I.dataSource },
    { id: "pipeline", label: "Pipeline", icon: I.pipeline },
    { id: "parser", label: "Parser", icon: I.parser },
  ];

  const recInfo = tdd ? tdd.layout.records.map(r => `${r.recordType}(${r.fields.length}f/${r.length}B)`).join(" + ") : "";

  // Toast helper
  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), type === "rd" ? 5000 : 2500);
  };

  // Import handler
  const handleImport = async () => {
    openFileDialog(async (file) => {
      const result = await importTDDFile(file, tddList);
      if (result.success) {
        try {
          await api.createTdd(result.tdd);
          setTddList(prev => [...prev, result.tdd]);
          setTddId(result.tdd.id);
          showToast(`'${result.tdd.name}' 가져오기 완료`, "gn");
        } catch (err) {
          console.error('Failed to save imported TDD:', err);
          showToast("가져오기 저장 실패", "rd");
        }
      } else {
        showToast(result.error, "rd");
      }
    });
  };

  // Clone handler
  const handleClone = (tddToClone) => {
    setTemplate(tddToClone);
    setMode("create");
  };

  // Status update handler
  const handleUpdateStatus = async (id, newStatus) => {
    const targetTdd = tddList.find(t => t.id === id);
    if (targetTdd) {
      const updated = { ...targetTdd, status: newStatus };
      await api.updateTdd(id, updated);
      setTddList(prev => prev.map(t => t.id === id ? updated : t));
    }
    setShowStatusDropdown(false);
  };

  // Edit handler
  const handleEdit = (tddToEdit) => {
    setEditTarget(tddToEdit);
    setMode("edit");
  };

  // TDD Update handler (for Transform/DataSource/Pipeline tabs)
  const handleTddUpdate = async (updatedTdd) => {
    try {
      await api.updateTdd(updatedTdd.id, updatedTdd);
      setTddList(prev => prev.map(t => t.id === updatedTdd.id ? updatedTdd : t));
      showToast("저장 완료", "gn");
    } catch (err) {
      console.error('Failed to update TDD:', err);
      showToast("저장 실패", "rd");
    }
  };

  // Delete handler
  const handleDelete = async (tddToDelete) => {
    if (!confirm(`'${tddToDelete.name}' TDD를 삭제하시겠습니까?`)) return;

    try {
      await api.deleteTdd(tddToDelete.id);
      setTddList(prev => prev.filter(t => t.id !== tddToDelete.id));

      // 삭제된 TDD가 선택된 상태였으면 다른 TDD 선택
      if (tddId === tddToDelete.id) {
        const remaining = tddList.filter(t => t.id !== tddToDelete.id);
        setTddId(remaining[0]?.id || null);
      }

      showToast("TDD 삭제 완료", "gn");
    } catch (err) {
      console.error('Failed to delete TDD:', err);
      showToast("삭제 실패", "rd");
    }
  };

  const renderList = (items) => items.map((t, i, arr) => {
    const active = tddId === t.id;
    const showCat = !filtered && (i === 0 || t.category !== arr[i - 1]?.category);
    return (
      <div key={t.id}>
        {showCat && <div style={{ fontSize: 8, color: C.txD, textTransform: "uppercase", letterSpacing: .4, padding: "8px 3px 3px", fontWeight: 600 }}>{t.category}</div>}
        <div onClick={() => setTddId(t.id)} style={{ padding: "7px 8px", background: active ? C.acD : C.s2, border: `1px solid ${active ? C.ac + "38" : C.bd}`, borderRadius: 3, cursor: "pointer", borderLeft: `3px solid ${active ? C.ac : SC[t.status] || C.bd}`, marginBottom: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.ac, fontFamily: "'JetBrains Mono',monospace" }}>{t.code}</span>
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? C.txB : C.tx, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
          </div>
          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
            <B c={SC[t.status] || C.tx} s>{t.status}</B>
            <span style={{ fontSize: 8, color: C.txD }}>v{t.version}</span>
            <span style={{ fontSize: 8, color: C.txD, marginLeft: "auto" }}>{t.protocol.type === "TCP_SOCKET" ? "TCP" : "FILE"}</span>
          </div>
        </div>
      </div>
    );
  });

  // Loading state
  if (loading) {
    return (
      <div style={{ width: "100%", height: "100vh", background: C.bg, color: C.tx, fontFamily: "'Pretendard','Noto Sans KR',sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 12, animation: "spin 1s linear infinite" }}>⟳</div>
          <div style={{ fontSize: 12, color: C.txD }}>Loading TDD data...</div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh", background: C.bg, color: C.tx, fontFamily: "'Pretendard','Noto Sans KR',sans-serif", display: "flex", overflow: "hidden" }}>
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.bd};border-radius:2px}
        @keyframes spin{to{transform:rotate(360deg)}}
        input:focus{border-color:${C.ac}!important;outline:none}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 16, right: 16, padding: "8px 16px", background: toast.type === "gn" ? C.gnD : toast.type === "rd" ? C.rdD : C.s3, border: `1px solid ${toast.type === "gn" ? C.gn : toast.type === "rd" ? C.rd : C.ac}40`, borderRadius: 4, fontSize: 11, color: toast.type === "gn" ? C.gn : toast.type === "rd" ? C.rd : C.ac, zIndex: 100 }}>
          {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      {sidebar && <div style={{ width: 240, flexShrink: 0, background: C.s, borderRight: `1px solid ${C.bd}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header - 접기만 유지 */}
        <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.bd}`, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 20, height: 20, borderRadius: 3, background: `linear-gradient(135deg,${C.ac},${C.pr})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>T</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.txB, flex: 1 }}>TDD Registry</span>
          <button onClick={() => setSidebar(false)} style={{ background: "none", border: "none", color: C.txD, cursor: "pointer", fontSize: 12, padding: 1 }}>◁</button>
        </div>
        {/* Search */}
        <div style={{ padding: "6px 10px" }}><input value={search} onChange={e => setSearch(e.target.value)} placeholder="전문코드 / 이름 검색..." style={{ width: "100%", padding: "5px 7px", background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 3, color: C.txB, fontSize: 10, fontFamily: "inherit", boxSizing: "border-box" }} /></div>
        {/* List */}
        <div style={{ flex: 1, overflow: "auto", padding: "0 8px 8px" }}>
          {renderList(filtered || Object.values(cats).flat())}
        </div>
        {/* Action buttons */}
        <div style={{ padding: "8px 10px", borderTop: `1px solid ${C.bd}`, display: "flex", gap: 6 }}>
          <Btn variant="primary" size="sm" icon="＋" onClick={() => setMode("create")}>새 TDD</Btn>
          <Btn variant="ghost" size="sm" icon="↑" onClick={handleImport}>가져오기</Btn>
        </div>
        {/* Footer (stats) */}
        <div style={{ padding: "6px 10px", borderTop: `1px solid ${C.bd}`, fontSize: 9, color: C.txD, display: "flex", justifyContent: "space-between" }}>
          <span>{tddList.length} defs</span><span>{tddList.filter(t => t.status === "ACTIVE").length} active</span>
        </div>
      </div>}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {(mode === "create" || mode === "edit") ? (
          <CreateWizard
            template={template}
            editTarget={editTarget}
            onComplete={async (newTdd) => {
              try {
                if (editTarget) {
                  // 편집: API로 업데이트
                  await api.updateTdd(newTdd.id, newTdd);
                  setTddList(prev => prev.map(t => t.id === newTdd.id ? newTdd : t));
                } else {
                  // 생성: API로 생성
                  await api.createTdd(newTdd);
                  setTddList(prev => [...prev, newTdd]);
                }
                setTddId(newTdd.id);
                setMode("view");
                setTemplate(null);
                setEditTarget(null);
                showToast(editTarget ? "TDD 수정 완료" : "TDD 생성 완료", "gn");
              } catch (err) {
                console.error('Failed to save TDD:', err);
                showToast("저장 실패", "rd");
              }
            }}
            onCancel={() => { setMode("view"); setTemplate(null); setEditTarget(null); }}
          />
        ) : (<>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", height: 40, background: C.s, borderBottom: `1px solid ${C.bd}`, flexShrink: 0 }}>
            {!sidebar && <button onClick={() => setSidebar(true)} style={{ background: "none", border: "none", color: C.txD, cursor: "pointer", fontSize: 12, padding: "1px 3px" }}>▷</button>}
            <span style={{ fontSize: 13, fontWeight: 700, color: C.ac, fontFamily: "'JetBrains Mono',monospace" }}>{tdd?.code}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.txB }}>{tdd?.name}</span>
            {/* Status dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 7px", borderRadius: 3, fontSize: 10, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", background: (SC[tdd?.status] || C.tx) + "14", color: SC[tdd?.status] || C.tx, border: `1px solid ${SC[tdd?.status] || C.tx}25`, cursor: "pointer", letterSpacing: .2 }}
              >
                {tdd?.status} <span style={{ fontSize: 8, opacity: 0.7 }}>▼</span>
              </button>
              {showStatusDropdown && (
                <>
                  {/* Backdrop */}
                  <div
                    onClick={() => setShowStatusDropdown(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 49 }}
                  />
                  <div style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.3)", zIndex: 50, minWidth: 120 }}>
                    {["ACTIVE", "DRAFT", "DEPRECATED"].map(status => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(tdd.id, status)}
                        style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "6px 10px", background: tdd?.status === status ? C.s3 : "transparent", border: "none", cursor: "pointer", fontSize: 10, color: SC[status], fontFamily: "'JetBrains Mono',monospace", fontWeight: tdd?.status === status ? 700 : 400 }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: SC[status] }} />
                        {status}
                        {tdd?.status === status && <span style={{ marginLeft: "auto", fontSize: 9 }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Action Menu */}
            <ActionMenu
              items={[
                { icon: "✎", label: "편집", onClick: () => handleEdit(tdd) },
                { icon: "⧉", label: "복제하여 생성", onClick: () => handleClone(tdd) },
                { divider: true },
                { icon: "×", label: "삭제", onClick: () => handleDelete(tdd), danger: true },
              ]}
            />
            <B c={C.ac}>v{tdd?.version}</B>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 9, color: C.txD }}>{tdd?.protocol.encoding} · {tdd?.protocol.type}</span>
          </div>
          <div style={{ display: "flex", gap: 12, padding: "4px 14px", background: C.s, borderBottom: `1px solid ${C.bd}`, flexShrink: 0, fontSize: 9, color: C.txD, flexWrap: "wrap" }}>
            <span>Records: <span style={{ color: C.tx }}>{recInfo}</span></span>
            <span>Transforms: <span style={{ color: C.tx }}>{tdd?.transforms.length || 0}</span></span>
            <span>DataSources: <span style={{ color: C.tx }}>{tdd?.dataSources.length || 0}</span></span>
            <span>Pipeline: <span style={{ color: C.tx }}>{tdd?.pipeline?.steps?.length || 0} steps</span></span>
            <span>Tests: <span style={{ color: C.tx }}>{tdd?.testCases?.length || 0}</span></span>
          </div>
          <div style={{ display: "flex", gap: 0, padding: "0 14px", background: C.s, borderBottom: `1px solid ${C.bd}`, flexShrink: 0 }}>
            {tabs.map(t => { const a = tab === t.id; return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 16px", fontSize: 10, fontWeight: a ? 600 : 400, color: a ? C.txB : C.txD, background: a ? C.s2 : "transparent", border: "none", borderBottom: a ? `2px solid ${C.ac}` : "2px solid transparent", cursor: "pointer", fontFamily: "inherit", transition: "all .08s" }}>
                <span style={{ fontSize: 11 }}>{t.icon}</span>{t.label}
              </button>);
            })}
          </div>

          {/* KEY FIX: key={tdd.id} forces full remount on TDD switch */}
          <div style={{ flex: 1, padding: 12, overflow: "hidden" }}>
            {tdd && <>
              {tab === "layout" && <LayoutTab tdd={tdd} key={"L_" + tdd.id} />}
              {tab === "transform" && <TransformTab tdd={tdd} onTddUpdate={handleTddUpdate} key={"T_" + tdd.id} />}
              {tab === "datasource" && <DataSourceTab tdd={tdd} onTddUpdate={handleTddUpdate} key={"D_" + tdd.id} />}
              {tab === "pipeline" && <PipelineTab tdd={tdd} onTddUpdate={handleTddUpdate} key={"P_" + tdd.id} />}
              {tab === "parser" && <ParserTab tdd={tdd} key={"P_" + tdd.id} savedState={getParserState(tdd.id)} onStateChange={(state) => updateParserState(tdd.id, state)} />}
            </>}
          </div>
        </>)}
      </div>
    </div>
  );
}

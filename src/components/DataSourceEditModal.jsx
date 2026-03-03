import { useState } from "react";
import { C, T } from "../constants/theme.js";
import { Modal, Btn, Input, TextArea, Sec, Chip } from "./common.jsx";

// ═══════════════════════════════════════
//  DataSource Edit Modal
// ═══════════════════════════════════════
export default function DataSourceEditModal({ ds, onSave, onClose }) {
  const isNew = !ds;

  const [id, setId] = useState(ds?.id || "ds_");
  const [name, setName] = useState(ds?.name || "");
  const [query, setQuery] = useState(ds?.query || "SELECT * FROM table WHERE :param = :param");

  // Params state
  const [params, setParams] = useState(() => {
    if (ds?.params && ds.params.length > 0) {
      return ds.params.map(p => ({ name: p.name, source: p.source }));
    }
    return [{ name: "", source: "" }];
  });

  // Stub scenarios state
  const [scenarios, setScenarios] = useState(() => {
    if (ds?.stub?.scenarios) {
      return Object.entries(ds.stub.scenarios).map(([key, value]) => ({
        key,
        value: JSON.stringify(value, null, 2)
      }));
    }
    return [{ key: "default", value: "[]" }];
  });
  const [activeScenario, setActiveScenario] = useState("default");
  const [newScenarioName, setNewScenarioName] = useState("");

  // Param handlers
  const addParam = () => setParams([...params, { name: "", source: "" }]);
  const removeParam = (index) => setParams(params.filter((_, i) => i !== index));
  const updateParam = (index, field, value) => {
    const updated = [...params];
    updated[index][field] = value;
    setParams(updated);
  };

  // Scenario handlers
  const addScenario = () => {
    const scenarioName = newScenarioName.trim() || `scenario_${scenarios.length}`;
    if (scenarios.some(s => s.key === scenarioName)) {
      alert("이미 존재하는 시나리오 이름입니다.");
      return;
    }
    setScenarios([...scenarios, { key: scenarioName, value: "[]" }]);
    setActiveScenario(scenarioName);
    setNewScenarioName("");
  };

  const removeScenario = (key) => {
    if (key === "default") {
      alert("default 시나리오는 삭제할 수 없습니다.");
      return;
    }
    if (!confirm(`'${key}' 시나리오를 삭제하시겠습니까?`)) return;
    setScenarios(scenarios.filter(s => s.key !== key));
    if (activeScenario === key) {
      setActiveScenario("default");
    }
  };

  const updateScenarioValue = (key, value) => {
    setScenarios(scenarios.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = () => {
    // Parse scenarios back to object
    const scenariosObj = {};
    for (const s of scenarios) {
      try {
        scenariosObj[s.key] = JSON.parse(s.value);
      } catch (e) {
        alert(`'${s.key}' 시나리오의 JSON이 올바르지 않습니다.`);
        return;
      }
    }

    onSave({
      id,
      name,
      query,
      params: params.filter(p => p.name),
      stub: { scenarios: scenariosObj }
    });
  };

  const isValid = () => {
    if (!id || !name || !id.startsWith("ds_")) return false;
    if (!query.trim()) return false;
    // Check all scenarios are valid JSON
    for (const s of scenarios) {
      try {
        JSON.parse(s.value);
      } catch {
        return false;
      }
    }
    return true;
  };

  const activeScenarioData = scenarios.find(s => s.key === activeScenario) || scenarios[0];

  return (
    <Modal title={isNew ? "DataSource 추가" : "DataSource 편집"} onClose={onClose} width={650}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Basic Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: T.xs, color: C.txD, marginBottom: 4 }}>ID</div>
            <Input value={id} onChange={setId} mono placeholder="ds_xxx" />
          </div>
          <div>
            <div style={{ fontSize: T.xs, color: C.txD, marginBottom: 4 }}>이름</div>
            <Input value={name} onChange={setName} placeholder="데이터소스 이름" />
          </div>
        </div>

        {/* SQL Query */}
        <div style={{ background: C.s3, border: `1px solid ${C.bd}`, borderRadius: 4, padding: 12 }}>
          <Sec icon="📄">SQL 쿼리</Sec>
          <TextArea
            value={query}
            onChange={setQuery}
            mono
            rows={5}
            placeholder="SELECT ... FROM ... WHERE :param = :value"
          />
        </div>

        {/* Parameters */}
        <div style={{ background: C.s3, border: `1px solid ${C.bd}`, borderRadius: 4, padding: 12 }}>
          <Sec icon="⚙" right={<Btn size="sm" variant="ghost" onClick={addParam}>+ 추가</Btn>}>파라미터</Sec>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 150, overflow: "auto" }}>
            {params.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  value={p.name}
                  onChange={e => updateParam(i, "name", e.target.value)}
                  placeholder=":param명"
                  style={{
                    flex: 1,
                    padding: "5px 8px",
                    background: C.s2,
                    border: `1px solid ${C.bd}`,
                    borderRadius: 3,
                    color: C.or,
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: T.sm
                  }}
                />
                <span style={{ color: C.txD }}>←</span>
                <input
                  value={p.source}
                  onChange={e => updateParam(i, "source", e.target.value)}
                  placeholder="FIELD.ID 또는 값"
                  style={{
                    flex: 2,
                    padding: "5px 8px",
                    background: C.s2,
                    border: `1px solid ${C.bd}`,
                    borderRadius: 3,
                    color: C.cy,
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: T.sm
                  }}
                />
                <button
                  onClick={() => removeParam(i)}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.rd,
                    cursor: "pointer",
                    fontSize: 14,
                    padding: 4
                  }}
                >×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Stub Scenarios */}
        <div style={{ background: C.s3, border: `1px solid ${C.bd}`, borderRadius: 4, padding: 12 }}>
          <Sec icon="🧪">Stub 시나리오</Sec>

          {/* Scenario tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
            {scenarios.map(s => (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Chip on={activeScenario === s.key} onClick={() => setActiveScenario(s.key)}>
                  {s.key}
                </Chip>
                {s.key !== "default" && (
                  <button
                    onClick={() => removeScenario(s.key)}
                    style={{
                      background: "none",
                      border: "none",
                      color: C.rd,
                      cursor: "pointer",
                      fontSize: 10,
                      padding: 2,
                      opacity: 0.7
                    }}
                  >×</button>
                )}
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
              <input
                value={newScenarioName}
                onChange={e => setNewScenarioName(e.target.value)}
                placeholder="새 시나리오명"
                onKeyDown={e => e.key === "Enter" && addScenario()}
                style={{
                  padding: "4px 8px",
                  background: C.s2,
                  border: `1px solid ${C.bd}`,
                  borderRadius: 3,
                  color: C.txB,
                  fontSize: T.xs,
                  width: 100
                }}
              />
              <Btn size="sm" variant="ghost" onClick={addScenario}>+</Btn>
            </div>
          </div>

          {/* Active scenario JSON editor */}
          {activeScenarioData && (
            <div>
              <div style={{ fontSize: T.xs, color: C.txD, marginBottom: 4 }}>
                {activeScenarioData.key} (JSON 배열)
              </div>
              <TextArea
                value={activeScenarioData.value}
                onChange={(v) => updateScenarioValue(activeScenarioData.key, v)}
                mono
                rows={6}
                placeholder='[{"column1": "value1", "column2": "value2"}]'
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
          <Btn variant="ghost" onClick={onClose}>취소</Btn>
          <Btn variant="primary" onClick={handleSave} disabled={!isValid()}>
            {isNew ? "추가" : "저장"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

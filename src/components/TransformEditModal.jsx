import { useState } from "react";
import { C, T } from "../constants/theme.js";
import { Modal, Btn, Input, TextArea, Select, B, Sec } from "./common.jsx";

// ═══════════════════════════════════════
//  Transform Edit Modal
// ═══════════════════════════════════════
export default function TransformEditModal({ transform, onSave, onClose }) {
  const isNew = !transform;

  const [id, setId] = useState(transform?.id || "tr_");
  const [name, setName] = useState(transform?.name || "");
  const [type, setType] = useState(transform?.type || "MAPPING_TABLE");

  // MAPPING_TABLE state
  const [mappings, setMappings] = useState(() => {
    if (transform?.type === "MAPPING_TABLE" && transform?.mappings) {
      return Object.entries(transform.mappings).map(([k, v]) => ({ key: k, value: v }));
    }
    return [{ key: "", value: "" }];
  });
  const [fallback, setFallback] = useState(transform?.fallback || "ERROR");

  // EXPRESSION state
  const [expression, setExpression] = useState(transform?.expression || "");

  // DATE_FORMAT state
  const [inputFormats, setInputFormats] = useState(transform?.inputFormats || ["yyyy-MM-dd"]);
  const [outputFormat, setOutputFormat] = useState(transform?.outputFormat || "yyyyMMdd");

  // FUNCTION state
  const [functionName, setFunctionName] = useState(transform?.functionName || "");

  // Test state
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState(null);

  const typeOptions = [
    { value: "MAPPING_TABLE", label: "MAPPING_TABLE" },
    { value: "EXPRESSION", label: "EXPRESSION" },
    { value: "DATE_FORMAT", label: "DATE_FORMAT" },
    { value: "FUNCTION", label: "FUNCTION" }
  ];

  const fallbackOptions = [
    { value: "ERROR", label: "ERROR - 에러 발생" },
    { value: "KEEP", label: "KEEP - 원본 유지" },
    { value: "EMPTY", label: "EMPTY - 빈 값" }
  ];

  const functionOptions = [
    { value: "formatAccountNumber", label: "formatAccountNumber" },
    { value: "calculateCheckDigit", label: "calculateCheckDigit" },
    { value: "padLeft", label: "padLeft" },
    { value: "padRight", label: "padRight" },
    { value: "toUpperCase", label: "toUpperCase" },
    { value: "toLowerCase", label: "toLowerCase" }
  ];

  const addMapping = () => setMappings([...mappings, { key: "", value: "" }]);
  const removeMapping = (index) => setMappings(mappings.filter((_, i) => i !== index));
  const updateMapping = (index, field, value) => {
    const updated = [...mappings];
    updated[index][field] = value;
    setMappings(updated);
  };

  const addInputFormat = () => setInputFormats([...inputFormats, ""]);
  const removeInputFormat = (index) => setInputFormats(inputFormats.filter((_, i) => i !== index));
  const updateInputFormat = (index, value) => {
    const updated = [...inputFormats];
    updated[index] = value;
    setInputFormats(updated);
  };

  const runTest = () => {
    if (type === "MAPPING_TABLE") {
      const mappingsObj = Object.fromEntries(mappings.filter(m => m.key).map(m => [m.key, m.value]));
      const result = mappingsObj[testInput];
      if (result !== undefined) {
        setTestOutput({ ok: true, v: result });
      } else {
        if (fallback === "KEEP") setTestOutput({ ok: true, v: testInput });
        else if (fallback === "EMPTY") setTestOutput({ ok: true, v: "" });
        else setTestOutput({ ok: false, v: `'${testInput}' 매핑 없음` });
      }
    } else if (type === "EXPRESSION") {
      try {
        const value = testInput;
        setTestOutput({ ok: true, v: String(eval(expression)) });
      } catch (e) {
        setTestOutput({ ok: false, v: e.message });
      }
    } else if (type === "DATE_FORMAT") {
      const cleaned = testInput.replace(/[-\/]/g, '');
      setTestOutput(/^\d{8}$/.test(cleaned) ? { ok: true, v: cleaned } : { ok: false, v: "유효하지 않은 날짜" });
    } else {
      setTestOutput({ ok: true, v: "(FUNCTION - 엔진에서 실행)" });
    }
  };

  const handleSave = () => {
    const base = { id, name, type };

    if (type === "MAPPING_TABLE") {
      const mappingsObj = Object.fromEntries(mappings.filter(m => m.key).map(m => [m.key, m.value]));
      onSave({ ...base, mappings: mappingsObj, fallback });
    } else if (type === "EXPRESSION") {
      onSave({ ...base, expression });
    } else if (type === "DATE_FORMAT") {
      onSave({ ...base, inputFormats: inputFormats.filter(f => f), outputFormat });
    } else if (type === "FUNCTION") {
      onSave({ ...base, functionName });
    }
  };

  const isValid = () => {
    if (!id || !name || !id.startsWith("tr_")) return false;
    if (type === "MAPPING_TABLE" && mappings.filter(m => m.key).length === 0) return false;
    if (type === "EXPRESSION" && !expression) return false;
    if (type === "DATE_FORMAT" && (!outputFormat || inputFormats.filter(f => f).length === 0)) return false;
    if (type === "FUNCTION" && !functionName) return false;
    return true;
  };

  return (
    <Modal title={isNew ? "Transform 추가" : "Transform 편집"} onClose={onClose} width={600}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Basic Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: T.xs, color: C.txD, marginBottom: 4 }}>ID</div>
            <Input value={id} onChange={setId} mono placeholder="tr_xxx" />
          </div>
          <div>
            <div style={{ fontSize: T.xs, color: C.txD, marginBottom: 4 }}>이름</div>
            <Input value={name} onChange={setName} placeholder="변환 이름" />
          </div>
        </div>

        {/* Type */}
        <div>
          <div style={{ fontSize: T.xs, color: C.txD, marginBottom: 4 }}>타입</div>
          <Select value={type} onChange={setType} options={typeOptions} />
        </div>

        {/* Type-specific UI */}
        {type === "MAPPING_TABLE" && (
          <div style={{ background: C.s3, border: `1px solid ${C.bd}`, borderRadius: 4, padding: 12 }}>
            <Sec icon="⚙" right={<Btn size="sm" variant="ghost" onClick={addMapping}>+ 추가</Btn>}>매핑 테이블</Sec>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflow: "auto" }}>
              {mappings.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    value={m.key}
                    onChange={e => updateMapping(i, "key", e.target.value)}
                    placeholder="키"
                    style={{
                      flex: 1,
                      padding: "5px 8px",
                      background: C.s2,
                      border: `1px solid ${C.bd}`,
                      borderRadius: 3,
                      color: C.txB,
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: T.sm
                    }}
                  />
                  <span style={{ color: C.txD }}>→</span>
                  <input
                    value={m.value}
                    onChange={e => updateMapping(i, "value", e.target.value)}
                    placeholder="값"
                    style={{
                      flex: 1,
                      padding: "5px 8px",
                      background: C.s2,
                      border: `1px solid ${C.bd}`,
                      borderRadius: 3,
                      color: C.gn,
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: T.sm
                    }}
                  />
                  <button
                    onClick={() => removeMapping(i)}
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
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: T.xs, color: C.txD, marginBottom: 4 }}>Fallback 동작</div>
              <Select value={fallback} onChange={setFallback} options={fallbackOptions} />
            </div>
          </div>
        )}

        {type === "EXPRESSION" && (
          <div style={{ background: C.s3, border: `1px solid ${C.bd}`, borderRadius: 4, padding: 12 }}>
            <Sec icon="⚡">표현식</Sec>
            <div style={{ fontSize: T.xs, color: C.txD, marginBottom: 4 }}>JavaScript 표현식 (변수: value)</div>
            <TextArea
              value={expression}
              onChange={setExpression}
              mono
              rows={3}
              placeholder="value.toUpperCase()"
            />
          </div>
        )}

        {type === "DATE_FORMAT" && (
          <div style={{ background: C.s3, border: `1px solid ${C.bd}`, borderRadius: 4, padding: 12 }}>
            <Sec icon="📅" right={<Btn size="sm" variant="ghost" onClick={addInputFormat}>+ 추가</Btn>}>날짜 포맷</Sec>
            <div style={{ fontSize: T.xs, color: C.txD, marginBottom: 4 }}>입력 포맷</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
              {inputFormats.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    value={f}
                    onChange={e => updateInputFormat(i, e.target.value)}
                    placeholder="yyyy-MM-dd"
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
                  {inputFormats.length > 1 && (
                    <button
                      onClick={() => removeInputFormat(i)}
                      style={{ background: "none", border: "none", color: C.rd, cursor: "pointer", fontSize: 14, padding: 4 }}
                    >×</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ fontSize: T.xs, color: C.txD, marginBottom: 4 }}>출력 포맷</div>
            <Input value={outputFormat} onChange={setOutputFormat} mono placeholder="yyyyMMdd" />
          </div>
        )}

        {type === "FUNCTION" && (
          <div style={{ background: C.s3, border: `1px solid ${C.bd}`, borderRadius: 4, padding: 12 }}>
            <Sec icon="ƒ">내장 함수</Sec>
            <Select value={functionName} onChange={setFunctionName} options={functionOptions} placeholder="함수 선택..." />
          </div>
        )}

        {/* Test */}
        <div style={{ background: C.s3, border: `1px solid ${C.bd}`, borderRadius: 4, padding: 12 }}>
          <Sec icon="▶" right={<Btn size="sm" onClick={runTest}>테스트</Btn>}>테스트</Sec>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.xs, color: C.txD, marginBottom: 2 }}>INPUT</div>
              <input
                value={testInput}
                onChange={e => { setTestInput(e.target.value); setTestOutput(null); }}
                onKeyDown={e => e.key === "Enter" && runTest()}
                style={{
                  width: "100%",
                  padding: "5px 8px",
                  background: C.s2,
                  border: `1px solid ${C.bd}`,
                  borderRadius: 3,
                  color: C.txB,
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: T.sm,
                  boxSizing: "border-box"
                }}
              />
            </div>
            <span style={{ color: C.txD, paddingTop: 16 }}>→</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: T.xs, color: C.txD, marginBottom: 2 }}>OUTPUT</div>
              <div style={{
                padding: "5px 8px",
                background: testOutput ? (testOutput.ok ? C.gnD : C.rdD) : C.s2,
                border: `1px solid ${testOutput ? (testOutput.ok ? C.gn + "28" : C.rd + "28") : C.bd}`,
                borderRadius: 3,
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: T.sm,
                color: testOutput ? (testOutput.ok ? C.gn : C.rd) : C.txD,
                minHeight: 14
              }}>
                {testOutput ? testOutput.v : "—"}
              </div>
            </div>
          </div>
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

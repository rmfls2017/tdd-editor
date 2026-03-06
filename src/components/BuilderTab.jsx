// ═══════════════════════════════════════
//  Builder Tab
//  Generate telegram files from field inputs
// ═══════════════════════════════════════
import { useState, useMemo, useEffect } from "react";
import { C, RC, fc, T, S } from "../constants/theme.js";
import { Btn, Sec, EmptyState } from "./common.jsx";
import {
  buildTelegram,
  createEmptyDataRecord,
  validateDataRecord,
  calculateComputed
} from "../utils/dataBuilder.js";

export default function BuilderTab({ tdd, savedState, onStateChange }) {
  // Data records state
  const [dataRecords, setDataRecords] = useState(savedState?.dataRecords || []);
  const [selectedIndex, setSelectedIndex] = useState(savedState?.selectedIndex ?? 0);

  // Context state (for HEADER)
  const [context, setContext] = useState(savedState?.context || {
    sendDate: new Date().toISOString().slice(0, 10),
  });

  // Preview state
  const [preview, setPreview] = useState(null);

  // Save state to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      onStateChange?.({ dataRecords, selectedIndex, context });
    }, 300);
    return () => clearTimeout(timer);
  }, [dataRecords, selectedIndex, context]);

  // Get DATA record definition
  const dataRecordDef = useMemo(() =>
    tdd.layout.records.find(r => r.recordType === "DATA"),
    [tdd]
  );

  // Editable fields (not fixed, not computed)
  const editableFields = useMemo(() => {
    if (!dataRecordDef) return [];
    return dataRecordDef.fields.filter(f =>
      f.fixedValue == null && !f.sourceRef?.startsWith("computed.")
    );
  }, [dataRecordDef]);

  // Computed summary
  const computed = useMemo(() =>
    calculateComputed(dataRecords, tdd),
    [dataRecords, tdd]
  );

  // Record validation status
  const recordValidations = useMemo(() =>
    dataRecords.map(r => validateDataRecord(r, tdd)),
    [dataRecords, tdd]
  );

  // Handlers
  const handleAddRecord = () => {
    const newRecord = createEmptyDataRecord(tdd);
    setDataRecords([...dataRecords, newRecord]);
    setSelectedIndex(dataRecords.length);
    setPreview(null);
  };

  const handleDeleteRecord = (idx) => {
    if (dataRecords.length <= 1) return;
    const newRecords = dataRecords.filter((_, i) => i !== idx);
    setDataRecords(newRecords);
    if (selectedIndex >= newRecords.length) {
      setSelectedIndex(newRecords.length - 1);
    }
    setPreview(null);
  };

  const handleCloneRecord = (idx) => {
    const cloned = { ...dataRecords[idx] };
    const newRecords = [...dataRecords];
    newRecords.splice(idx + 1, 0, cloned);
    setDataRecords(newRecords);
    setSelectedIndex(idx + 1);
    setPreview(null);
  };

  const handleFieldChange = (fieldId, value) => {
    const newRecords = [...dataRecords];
    newRecords[selectedIndex] = {
      ...newRecords[selectedIndex],
      [fieldId]: value
    };
    setDataRecords(newRecords);
    setPreview(null);
  };

  const handleGeneratePreview = () => {
    const result = buildTelegram(tdd, dataRecords, context, tdd.protocol?.encoding || "EUC-KR");
    setPreview(result);
  };

  const handleDownload = () => {
    const result = preview || buildTelegram(tdd, dataRecords, context, tdd.protocol?.encoding || "EUC-KR");

    const content = result.lines.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
    a.href = url;
    a.download = `${tdd.code}_${timestamp}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = () => {
    const result = preview || buildTelegram(tdd, dataRecords, context, tdd.protocol?.encoding || "EUC-KR");
    navigator.clipboard.writeText(result.lines.join("\n"));
  };

  // Empty state
  if (!dataRecordDef) {
    return (
      <EmptyState
        icon="📝"
        title="DATA 레코드 정의가 없습니다"
        description="이 TDD에는 DATA 레코드 정의가 없어 Builder를 사용할 수 없습니다."
      />
    );
  }

  const selectedRecord = dataRecords[selectedIndex];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S[3], height: "100%", overflow: "hidden" }}>
      {/* Main content area */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: S[3], flex: 1, overflow: "hidden" }}>
        {/* Left panel: Record list + Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: S[3], overflow: "hidden" }}>
          {/* Record list */}
          <div style={{ background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, padding: S[2], flex: 1, overflow: "auto" }}>
            <Sec icon="📋" right={<Btn size="sm" variant="ghost" onClick={handleAddRecord}>+ 추가</Btn>}>
              DATA 레코드 ({dataRecords.length}건)
            </Sec>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {dataRecords.length === 0 ? (
                <div style={{ padding: S[3], textAlign: "center", color: C.txD, fontSize: T.sm }}>
                  레코드를 추가하세요
                </div>
              ) : (
                dataRecords.map((record, idx) => {
                  const validation = recordValidations[idx];
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 8px",
                        background: isSelected ? C.acD : C.s3,
                        border: `1px solid ${isSelected ? C.ac + "40" : C.bd}`,
                        borderRadius: 3,
                        cursor: "pointer",
                        borderLeft: `3px solid ${validation.valid ? C.gn : C.or}`
                      }}
                    >
                      <span style={{ fontSize: T.sm, color: isSelected ? C.txB : C.tx }}>
                        건 #{idx + 1}
                      </span>
                      <span style={{ marginLeft: "auto", fontSize: T.xs }}>
                        {validation.valid ? "✓" : "⚠"}
                      </span>
                      {dataRecords.length > 1 && isSelected && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCloneRecord(idx); }}
                            style={{ background: "none", border: "none", color: C.ac, cursor: "pointer", fontSize: 10, padding: 2 }}
                            title="복제"
                          >⧉</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteRecord(idx); }}
                            style={{ background: "none", border: "none", color: C.rd, cursor: "pointer", fontSize: 10, padding: 2 }}
                            title="삭제"
                          >×</button>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Summary */}
          <div style={{ background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, padding: S[2], flexShrink: 0 }}>
            <Sec icon="📊">요약 정보</Sec>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: T.sm }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.txD }}>총 건수</span>
                <span style={{ color: C.txB, fontFamily: "'JetBrains Mono',monospace" }}>{computed.totalDataCount}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.txD }}>총 금액</span>
                <span style={{ color: C.txB, fontFamily: "'JetBrains Mono',monospace" }}>{computed.totalAmount.toLocaleString()}</span>
              </div>
              {computed.newCount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: C.txD }}>신규</span>
                  <span style={{ color: C.gn }}>{computed.newCount}</span>
                </div>
              )}
              {computed.cancelCount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: C.txD }}>해지</span>
                  <span style={{ color: C.rd }}>{computed.cancelCount}</span>
                </div>
              )}
              {computed.changeCount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: C.txD }}>변경</span>
                  <span style={{ color: C.or }}>{computed.changeCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel: Field input form */}
        <div style={{ display: "flex", flexDirection: "column", gap: S[3], overflow: "hidden" }}>
          {/* Context inputs */}
          <div style={{ background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, padding: S[2], flexShrink: 0 }}>
            <Sec icon="⚙">HEADER 컨텍스트</Sec>
            <div style={{ display: "flex", gap: S[3], flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: T.xs, color: C.txD, marginBottom: 2 }}>전송일자</div>
                <input
                  type="date"
                  value={context.sendDate}
                  onChange={(e) => { setContext({ ...context, sendDate: e.target.value }); setPreview(null); }}
                  style={{
                    padding: "4px 8px",
                    background: C.s3,
                    border: `1px solid ${C.bd}`,
                    borderRadius: 3,
                    color: C.txB,
                    fontSize: T.sm
                  }}
                />
              </div>
            </div>
          </div>

          {/* Field input form */}
          <div style={{ background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, padding: S[2], flex: 1, overflow: "auto" }}>
            <Sec icon="✏️">
              필드 입력 {selectedRecord && `(건 #${selectedIndex + 1})`}
            </Sec>
            {!selectedRecord ? (
              <div style={{ padding: S[4], textAlign: "center", color: C.txD, fontSize: T.sm }}>
                레코드를 추가하거나 선택하세요
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: S[2] }}>
                {editableFields.map((field, idx) => {
                  const value = selectedRecord[field.id] || "";
                  const col = fc[idx % fc.length];
                  const transform = field.transformRef
                    ? tdd.transforms?.find(t => t.id === field.transformRef)
                    : null;

                  return (
                    <div key={field.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 2, background: col }} />
                        <span style={{ fontSize: T.xs, color: C.txD }}>{field.name}</span>
                        {field.required && <span style={{ color: C.rd, fontSize: T.xs }}>*</span>}
                      </div>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={field.description || ""}
                          style={{
                            flex: 1,
                            padding: "5px 8px",
                            background: C.s3,
                            border: `1px solid ${C.bd}`,
                            borderRadius: 3,
                            color: C.txB,
                            fontSize: T.sm,
                            fontFamily: "'JetBrains Mono',monospace"
                          }}
                        />
                        {transform && transform.type === "MAPPING_TABLE" && value && (
                          <span style={{ fontSize: T.xs, color: transform.mappings?.[value] ? C.gn : C.or }}>
                            → {transform.mappings?.[value] || "?"}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 9, color: C.txD, marginTop: 2 }}>
                        {field.length}B · {field.type} · {field.pad || "NONE"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview area */}
      <div style={{ background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, padding: S[2], flexShrink: 0, maxHeight: 200, overflow: "auto" }}>
        <Sec
          icon="👁"
          right={
            <div style={{ display: "flex", gap: 4 }}>
              <Btn size="sm" variant="ghost" onClick={handleGeneratePreview}>미리보기</Btn>
              <Btn size="sm" variant="ghost" onClick={handleCopyToClipboard}>복사</Btn>
              <Btn size="sm" variant="primary" onClick={handleDownload} disabled={dataRecords.length === 0}>다운로드</Btn>
            </div>
          }
        >
          미리보기
        </Sec>
        {preview ? (
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, whiteSpace: "pre", overflow: "auto" }}>
            {preview.header && <div style={{ color: RC.HEADER }}>{preview.header}</div>}
            {preview.data.map((line, idx) => (
              <div key={idx} style={{ color: RC.DATA }}>{line}</div>
            ))}
            {preview.trailer && <div style={{ color: RC.TRAILER }}>{preview.trailer}</div>}
          </div>
        ) : (
          <div style={{ padding: S[2], color: C.txD, fontSize: T.sm, textAlign: "center" }}>
            "미리보기" 버튼을 클릭하면 생성될 전문을 확인할 수 있습니다
          </div>
        )}
      </div>
    </div>
  );
}

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
import { parseLines } from "../utils/dataParser.js";
import { api } from "../utils/api.js";

export default function BuilderTab({ tdd, tddList, savedState, onStateChange }) {
  // Data records state
  const [dataRecords, setDataRecords] = useState(savedState?.dataRecords || []);
  const [selectedIndex, setSelectedIndex] = useState(savedState?.selectedIndex ?? 0);

  // Context state (for HEADER)
  const [context, setContext] = useState(savedState?.context || {
    sendDate: new Date().toISOString().slice(0, 10),
    headerFields: {},
  });

  // Preview state
  const [preview, setPreview] = useState(null);

  // Import state (for response TDD)
  const [importText, setImportText] = useState("");

  // Error codes data source
  const [errorCodes, setErrorCodes] = useState(null);

  // Response TDD detection
  const isResponseTdd = !!tdd.responseOf;
  const requestTdd = isResponseTdd ? tddList?.find(t => t.id === tdd.responseOf) : null;

  // Load error codes for response TDDs
  useEffect(() => {
    if (isResponseTdd) {
      api.getDataSource("ds_error_codes").then(setErrorCodes).catch(() => {});
    }
  }, [isResponseTdd]);

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

  // HEADER에서 DataSource 참조 필드 추출
  const headerEditableFields = useMemo(() => {
    const headerDef = tdd.layout.records.find(r => r.recordType === "HEADER");
    if (!headerDef) return [];
    return headerDef.fields.filter(f =>
      f.fixedValue == null &&
      !f.sourceRef?.startsWith("computed.") &&
      f.sourceRef?.startsWith("ds_")
    );
  }, [tdd]);

  // Computed summary
  const computed = useMemo(() =>
    calculateComputed(dataRecords, tdd, context),
    [dataRecords, tdd, context]
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
    const record = { ...newRecords[selectedIndex], [fieldId]: value };

    // 응답 TDD: 결과코드 변경 시 불능코드 자동 처리
    if (isResponseTdd && fieldId === "d_result_code") {
      if (value === "Y") {
        record.d_error_code = "0000";
      } else if (value === "N") {
        record.d_error_code = "";
      }
    }

    newRecords[selectedIndex] = record;
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

  // Import from request telegram
  const handleImportFromRequest = () => {
    if (!requestTdd || !importText.trim()) return;

    const lines = importText.split("\n").filter(l => l.trim());
    const encoding = requestTdd.protocol?.encoding || "EUC-KR";
    const parsed = parseLines(lines, requestTdd.layout, encoding);

    // Get response DATA field definitions
    const resDataDef = tdd.layout.records.find(r => r.recordType === "DATA");
    if (!resDataDef) return;

    // Get request DATA field definitions
    const reqDataDef = requestTdd.layout.records.find(r => r.recordType === "DATA");
    if (!reqDataDef) return;

    // Map request data records to response data records
    const newRecords = parsed.data.map(parsedRecord => {
      const record = {};

      for (const resField of resDataDef.fields) {
        // Skip fixed and computed fields
        if (resField.fixedValue != null) {
          record[resField.id] = resField.fixedValue;
          continue;
        }
        if (resField.sourceRef?.startsWith("computed.")) continue;

        // Try to match by field.id from request
        const matchedParsed = parsedRecord.fields?.find(pf => pf.id === resField.id);
        if (matchedParsed) {
          record[resField.id] = matchedParsed.value;
        } else if (resField.id === "d_result_code") {
          record[resField.id] = "Y"; // 기본: 정상
        } else if (resField.id === "d_error_code") {
          record[resField.id] = "0000"; // 기본: 정상처리
        } else {
          record[resField.id] = "";
        }
      }

      return record;
    });

    // Extract header institution_code from parsed header
    if (parsed.header.length > 0) {
      const headerRecord = parsed.header[0];
      const instField = headerRecord.fields?.find(f => f.id === "h_institution_code");
      if (instField) {
        setContext(prev => ({
          ...prev,
          headerFields: { ...prev.headerFields, h_institution_code: instField.value }
        }));
      }
    }

    if (newRecords.length > 0) {
      setDataRecords(newRecords);
      setSelectedIndex(0);
      setPreview(null);
    }
  };

  // Render select for result_code / error_code fields
  const renderResponseField = (field, value) => {
    if (field.id === "d_result_code" && errorCodes) {
      return (
        <select
          value={value}
          onChange={(e) => handleFieldChange(field.id, e.target.value)}
          style={{
            flex: 1,
            padding: "5px 8px",
            background: C.s3,
            border: `1px solid ${C.bd}`,
            borderRadius: 3,
            color: value === "N" ? C.rd : C.gn,
            fontSize: T.sm,
            fontFamily: "'JetBrains Mono',monospace"
          }}
        >
          {Object.entries(errorCodes.resultCodes).map(([code, info]) => (
            <option key={code} value={code}>{code} - {info.label}</option>
          ))}
        </select>
      );
    }

    if (field.id === "d_error_code" && errorCodes) {
      const resultCode = selectedRecord?.d_result_code;
      const isNormal = resultCode === "Y" || resultCode !== "N";

      // Group error codes by category
      const categories = errorCodes.categories || {};
      const codes = errorCodes.errorCodes || {};

      if (isNormal) {
        return (
          <select
            value="0000"
            disabled
            style={{
              flex: 1,
              padding: "5px 8px",
              background: C.s3,
              border: `1px solid ${C.bd}`,
              borderRadius: 3,
              color: C.gn,
              fontSize: T.sm,
              fontFamily: "'JetBrains Mono',monospace",
              opacity: 0.7
            }}
          >
            <option value="0000">0000 - 정상처리</option>
          </select>
        );
      }

      // 불능일 때: 불능코드만 필터링
      const failCodes = Object.entries(codes).filter(([code]) => code !== "0000");
      const grouped = {};
      for (const [code, info] of failCodes) {
        const cat = info.category || "OTHER";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push([code, info]);
      }

      return (
        <select
          value={value}
          onChange={(e) => handleFieldChange(field.id, e.target.value)}
          style={{
            flex: 1,
            padding: "5px 8px",
            background: C.s3,
            border: `1px solid ${C.bd}`,
            borderRadius: 3,
            color: C.or,
            fontSize: T.sm,
            fontFamily: "'JetBrains Mono',monospace"
          }}
        >
          <option value="">-- 불능코드 선택 --</option>
          {Object.entries(grouped).map(([cat, entries]) => (
            <optgroup key={cat} label={categories[cat]?.label || cat}>
              {entries.map(([code, info]) => (
                <option key={code} value={code}>{code} - {info.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      );
    }

    return null;
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
                  {isResponseTdd ? "요청 전문을 가져오거나 레코드를 추가하세요" : "레코드를 추가하세요"}
                </div>
              ) : (
                dataRecords.map((record, idx) => {
                  const validation = recordValidations[idx];
                  const isSelected = idx === selectedIndex;
                  const isFail = isResponseTdd && record.d_result_code === "N";
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedIndex(idx)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 8px",
                        background: isSelected ? C.acD : isFail ? C.rdD : C.s3,
                        border: `1px solid ${isSelected ? C.ac + "40" : C.bd}`,
                        borderRadius: 3,
                        cursor: "pointer",
                        borderLeft: `3px solid ${validation.valid ? C.gn : C.or}`
                      }}
                    >
                      <span style={{ fontSize: T.sm, color: isSelected ? C.txB : C.tx }}>
                        건 #{idx + 1}
                      </span>
                      {isFail && (
                        <span style={{ fontSize: 9, color: C.rd, fontWeight: 600 }}>
                          불능
                        </span>
                      )}
                      <span style={{ flex: 1 }} />
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
              {/* 불능 집계 (응답 TDD일 때만) */}
              {isResponseTdd && (computed.failNewCount > 0 || computed.failCancelCount > 0 || computed.failVoluntaryCancelCount > 0) && (
                <>
                  <div style={{ borderTop: `1px solid ${C.bd}`, marginTop: 4, paddingTop: 4 }}>
                    <span style={{ fontSize: 9, color: C.rd, fontWeight: 600 }}>불능 집계</span>
                  </div>
                  {computed.failNewCount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: C.txD }}>불능-신규</span>
                      <span style={{ color: C.rd, fontFamily: "'JetBrains Mono',monospace" }}>{computed.failNewCount}</span>
                    </div>
                  )}
                  {computed.failCancelCount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: C.txD }}>불능-해지</span>
                      <span style={{ color: C.rd, fontFamily: "'JetBrains Mono',monospace" }}>{computed.failCancelCount}</span>
                    </div>
                  )}
                  {computed.failVoluntaryCancelCount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: C.txD }}>불능-임의해지</span>
                      <span style={{ color: C.rd, fontFamily: "'JetBrains Mono',monospace" }}>{computed.failVoluntaryCancelCount}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right panel: Field input form */}
        <div style={{ display: "flex", flexDirection: "column", gap: S[3], overflow: "hidden" }}>
          {/* Import from request (response TDD only) */}
          {isResponseTdd && requestTdd && (
            <div style={{ background: C.s2, border: `1px solid ${C.pr}30`, borderRadius: 4, padding: S[2], flexShrink: 0 }}>
              <Sec icon="↓">
                {requestTdd.code} 요청 전문 가져오기
              </Sec>
              <div style={{ display: "flex", flexDirection: "column", gap: S[2] }}>
                <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={`${requestTdd.code} 전문을 붙여넣으세요 (Header + Data + Trailer)...`}
                    rows={5}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      background: C.s3,
                      border: `1px solid ${C.bd}`,
                      borderRadius: 3,
                      color: C.txB,
                      fontSize: T.sm,
                      fontFamily: "'JetBrains Mono',monospace",
                      resize: "vertical"
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Btn
                      size="sm"
                      variant="primary"
                      onClick={handleImportFromRequest}
                      disabled={!importText.trim()}
                    >
                      가져오기 {importText.trim() && `(${importText.split("\n").filter(l => l.trim()).length}줄)`}
                    </Btn>
                    <span style={{ fontSize: 9, color: C.txD }}>
                      요청 전문의 필드값이 자동 매핑되고, 결과코드는 정상으로 기본 설정됩니다
                    </span>
                  </div>
                </div>
            </div>
          )}

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
              {/* DataSource 필드들 */}
              {headerEditableFields.map(field => (
                <div key={field.id}>
                  <div style={{ fontSize: T.xs, color: C.txD, marginBottom: 2 }}>{field.name}</div>
                  <input
                    type="text"
                    value={context.headerFields?.[field.id] || ""}
                    onChange={(e) => {
                      setContext({
                        ...context,
                        headerFields: { ...context.headerFields, [field.id]: e.target.value }
                      });
                      setPreview(null);
                    }}
                    placeholder={field.description || ""}
                    style={{
                      padding: "4px 8px",
                      background: C.s3,
                      border: `1px solid ${C.bd}`,
                      borderRadius: 3,
                      color: C.txB,
                      fontSize: T.sm,
                      fontFamily: "'JetBrains Mono',monospace",
                      minWidth: 120
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Field input form */}
          <div style={{ background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, padding: S[2], flex: 1, overflow: "auto" }}>
            <Sec icon="✏️">
              필드 입력 {selectedRecord && `(건 #${selectedIndex + 1})`}
            </Sec>
            {!selectedRecord ? (
              <div style={{ padding: S[4], textAlign: "center", color: C.txD, fontSize: T.sm }}>
                {isResponseTdd ? "요청 전문을 가져오거나 레코드를 추가하세요" : "레코드를 추가하거나 선택하세요"}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: S[2] }}>
                {editableFields.map((field, idx) => {
                  const value = selectedRecord[field.id] || "";
                  const col = fc[idx % fc.length];

                  // Check if this field has a special response dropdown
                  const responseSelect = isResponseTdd ? renderResponseField(field, value) : null;

                  return (
                    <div key={field.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 2, background: col }} />
                        <span style={{ fontSize: T.xs, color: C.txD }}>{field.name}</span>
                        {field.required && <span style={{ color: C.rd, fontSize: T.xs }}>*</span>}
                      </div>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {responseSelect || (
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

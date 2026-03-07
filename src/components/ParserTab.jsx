import { useState, useMemo, useEffect } from "react";
import { C, TC, RC, fc, T, S } from "../constants/theme.js";
import { B, Chip, Btn, TextArea, Select, Sec, EmptyState } from "./common.jsx";
import { parseLines, validateParsedData } from "../utils/dataParser.js";

// ═══════════════════════════════════════
//  Parser Tab
//  Parse raw data according to TDD Layout
// ═══════════════════════════════════════
export default function ParserTab({ tdd, savedState, onStateChange }) {
  // 저장된 상태가 있으면 복원, 없으면 초기값
  const [input, setInput] = useState(savedState?.input || "");
  const [encoding, setEncoding] = useState(savedState?.encoding || tdd?.protocol?.encoding || "EUC-KR");
  const [activeRecord, setActiveRecord] = useState(savedState?.activeRecord || "HEADER");
  const [results, setResults] = useState(savedState?.results || null);
  const [validation, setValidation] = useState(savedState?.validation || null);
  const [selectedField, setSelectedField] = useState(null); // UI 일시 상태라 저장 안함

  // 상태 변경 시 parent에 알림 (debounce 적용)
  useEffect(() => {
    const timer = setTimeout(() => {
      onStateChange?.({ input, encoding, activeRecord, results, validation });
    }, 300);
    return () => clearTimeout(timer);
  }, [input, encoding, activeRecord, results, validation]);

  // Parse the input data
  const handleParse = () => {
    if (!input.trim() || !tdd?.layout) return;

    const lines = input.split("\n").filter(l => l.trim());
    const parsed = parseLines(lines, tdd.layout, encoding);
    const validationResult = validateParsedData(parsed, tdd.layout);

    setResults(parsed);
    setValidation(validationResult);

    // Auto-select first available record type
    if (parsed.header.length > 0) {
      setActiveRecord("HEADER");
    } else if (parsed.data.length > 0) {
      setActiveRecord("DATA");
    } else if (parsed.trailer.length > 0) {
      setActiveRecord("TRAILER");
    }
    setSelectedField(null);
  };

  // Clear results
  const handleClear = () => {
    setInput("");
    setResults(null);
    setValidation(null);
    setSelectedField(null);
  };

  // Get current records to display
  const currentRecords = useMemo(() => {
    if (!results) return [];
    return results[activeRecord.toLowerCase()] || [];
  }, [results, activeRecord]);

  // Record counts for tabs
  const recordCounts = useMemo(() => {
    if (!results) return { HEADER: 0, DATA: 0, TRAILER: 0 };
    return {
      HEADER: results.header.length,
      DATA: results.data.length,
      TRAILER: results.trailer.length
    };
  }, [results]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: S[3], height: "100%", overflow: "hidden" }}>
      {/* Input section */}
      <div style={{ background: C.s2, border: `1px solid ${C.bd}`, borderRadius: 4, padding: S[3], flexShrink: 0 }}>
        <Sec icon="🔍" right={<span style={{ fontSize: T.xs, color: C.txD }}>TDD 레이아웃에 따라 원시 데이터를 파싱합니다</span>}>
          데이터 파서
        </Sec>

        <TextArea
          value={input}
          onChange={setInput}
          mono
          rows={4}
          placeholder="파싱할 데이터를 붙여넣기 하세요...&#10;예: H001234567KB홍길동...&#10;    D001234567..."
        />

        <div style={{ display: "flex", alignItems: "center", gap: S[2], marginTop: S[2], flexWrap: "wrap" }}>
          {/* Record type filter buttons */}
          <div style={{ display: "flex", gap: 4 }}>
            {["HEADER", "DATA", "TRAILER"].map(type => (
              <Chip
                key={type}
                on={activeRecord === type}
                onClick={() => setActiveRecord(type)}
                c={RC[type]}
                count={recordCounts[type]}
              >
                {type}
              </Chip>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Encoding selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: T.xs, color: C.txD }}>인코딩:</span>
            <Select
              value={encoding}
              onChange={setEncoding}
              options={[
                { value: "EUC-KR", label: "EUC-KR" },
                { value: "CP949", label: "CP949" },
                { value: "UTF-8", label: "UTF-8" }
              ]}
            />
          </div>

          {/* Action buttons */}
          <Btn variant="ghost" size="sm" onClick={handleClear}>초기화</Btn>
          <Btn variant="primary" size="sm" onClick={handleParse} disabled={!input.trim()}>파싱 실행</Btn>
        </div>
      </div>

      {/* Results section */}
      {results && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: S[3], overflow: "hidden" }}>
          {/* Summary */}
          <div style={{ display: "flex", gap: S[2], alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: T.sm, fontWeight: 600, color: C.txB }}>
              <span style={{ marginRight: 6 }}>📊</span>
              파싱 결과
            </span>
            <B c={C.ac} s>
              H:{validation?.summary.headerCount} D:{validation?.summary.dataCount} T:{validation?.summary.trailerCount}
            </B>
            {validation?.warnings.length > 0 && (
              <B c={C.or} s>{validation.warnings.length} 경고</B>
            )}
          </div>

          {/* Results grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: S[3], flex: 1, overflow: "hidden" }}>
            {/* Main table */}
            <div style={{ border: `1px solid ${C.bd}`, borderRadius: 4, overflow: "auto" }}>
              {currentRecords.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: C.txD, fontSize: T.sm }}>
                  {activeRecord} 레코드가 없습니다
                </div>
              ) : (
                currentRecords.map((record, recIdx) => (
                  <div key={recIdx} style={{ marginBottom: recIdx < currentRecords.length - 1 ? S[3] : 0 }}>
                    {/* Record header */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: S[2],
                      padding: "6px 10px",
                      background: C.s,
                      borderBottom: `1px solid ${C.bd}`,
                      position: "sticky",
                      top: 0,
                      zIndex: 1
                    }}>
                      <B c={RC[record.recordType]} s>{record.recordType}</B>
                      <span style={{ fontSize: T.xs, color: C.txD }}>
                        Record {recIdx + 1}/{currentRecords.length} • {record.length}B
                      </span>
                      {record.warnings.length > 0 && (
                        <B c={C.or} s>{record.warnings.length}</B>
                      )}
                    </div>

                    {/* Fields table */}
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: T.sm }}>
                      <thead>
                        <tr style={{ background: C.s2 }}>
                          {["", "필드명", "위치", "길이", "값"].map(h => (
                            <th key={h} style={{
                              padding: "5px 8px",
                              textAlign: "left",
                              color: C.txD,
                              fontWeight: 500,
                              fontSize: T.xs,
                              textTransform: "uppercase",
                              letterSpacing: .3,
                              borderBottom: `1px solid ${C.bd}`,
                              whiteSpace: "nowrap"
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {record.fields.map((field, i) => {
                          const col = fc[i % fc.length];
                          const sel = selectedField === `${recIdx}-${field.id}`;
                          const hasWarning = record.warnings.some(w => w.fieldId === field.id);

                          return (
                            <tr
                              key={field.id}
                              onClick={() => setSelectedField(`${recIdx}-${field.id}`)}
                              style={{
                                background: sel ? col + "10" : hasWarning ? C.orD + "40" : "transparent",
                                borderLeft: sel ? `2px solid ${col}` : hasWarning ? `2px solid ${C.or}` : "2px solid transparent",
                                cursor: "pointer"
                              }}
                              onMouseEnter={e => { if (!sel) e.currentTarget.style.background = C.s2 }}
                              onMouseLeave={e => { if (!sel) e.currentTarget.style.background = hasWarning ? C.orD + "40" : "transparent" }}
                            >
                              <td style={{ padding: "4px 8px", borderBottom: `1px solid ${C.bd}10`, width: 20 }}>
                                <div style={{ width: 8, height: 8, borderRadius: 2, background: col }} />
                              </td>
                              <td style={{ padding: "4px 8px", borderBottom: `1px solid ${C.bd}10`, color: C.txB, fontWeight: 500 }}>
                                {field.name}
                                {hasWarning && <span style={{ marginLeft: 4, display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: C.or, verticalAlign: "middle" }} />}
                              </td>
                              <td style={{
                                padding: "4px 8px",
                                borderBottom: `1px solid ${C.bd}10`,
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: T.xs,
                                color: C.txD
                              }}>
                                {field.offset}-{field.offset + field.length - 1}
                              </td>
                              <td style={{
                                padding: "4px 8px",
                                borderBottom: `1px solid ${C.bd}10`,
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: T.sm,
                                color: C.txB,
                                textAlign: "center"
                              }}>
                                {field.length}
                              </td>
                              <td style={{
                                padding: "4px 8px",
                                borderBottom: `1px solid ${C.bd}10`,
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: T.sm,
                                color: field.isEmpty ? C.txD : C.txB,
                                maxWidth: 200,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}>
                                {field.isEmpty ? <span style={{ fontStyle: "italic" }}>(empty)</span> : field.value}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>

            {/* Sidebar: Field detail & Warnings */}
            <div style={{ display: "flex", flexDirection: "column", gap: S[3], overflow: "hidden" }}>
              {/* Field detail panel */}
              <div style={{
                background: C.s2,
                border: `1px solid ${C.bd}`,
                borderRadius: 4,
                padding: S[3],
                flex: 1,
                overflow: "auto"
              }}>
                {selectedField ? (() => {
                  const [recIdx, fieldId] = selectedField.split("-");
                  const record = currentRecords[parseInt(recIdx)];
                  const field = record?.fields.find(f => f.id === fieldId);
                  if (!field) return null;

                  const ci = record.fields.indexOf(field);
                  const col = fc[ci % fc.length];

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: S[2] }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: col }} />
                        <span style={{ fontSize: T.base, fontWeight: 600, color: C.txB }}>{field.name}</span>
                      </div>
                      <div style={{ fontSize: T.xs, fontFamily: "'JetBrains Mono',monospace", color: C.txD }}>
                        {field.id}
                      </div>

                      {[
                        ["Offset", `${field.offset} - ${field.offset + field.length - 1}`],
                        ["Length", `${field.length}B`],
                        ["Type", field.type],
                        ["Padding", field.pad || "NONE"],
                        ["Required", field.required ? "Yes" : "No"],
                        ["Raw Value", field.rawValue || "(empty)"],
                        ["Parsed Value", field.value || "(empty)"],
                        field.fixedValue != null && ["Fixed Value", field.fixedValue],
                        field.sourceRef && ["Source", field.sourceRef]
                      ].filter(Boolean).map(([label, value]) => (
                        <div key={label}>
                          <div style={{
                            fontSize: T.xs - 1,
                            color: C.txD,
                            marginBottom: 2,
                            textTransform: "uppercase",
                            letterSpacing: .3
                          }}>{label}</div>
                          <div style={{
                            fontSize: T.sm,
                            color: C.txB,
                            fontFamily: "'JetBrains Mono',monospace",
                            padding: "4px 6px",
                            background: C.s3,
                            borderRadius: 3,
                            border: `1px solid ${C.bd}`,
                            wordBreak: "break-all"
                          }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  );
                })() : (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: C.txD,
                    fontSize: T.sm
                  }}>
                    필드를 선택하세요
                  </div>
                )}
              </div>

              {/* Warnings panel */}
              {validation?.warnings.length > 0 && (
                <div style={{
                  background: C.orD,
                  border: `1px solid ${C.or}40`,
                  borderRadius: 4,
                  padding: S[2],
                  maxHeight: 150,
                  overflow: "auto",
                  flexShrink: 0
                }}>
                  <div style={{ fontSize: T.xs, fontWeight: 600, color: C.or, marginBottom: S[1] }}>
                    경고 ({validation.warnings.length})
                  </div>
                  {validation.warnings.map((w, i) => (
                    <div key={i} style={{
                      fontSize: T.xs,
                      color: C.tx,
                      padding: "4px 0",
                      borderTop: i > 0 ? `1px solid ${C.or}20` : "none"
                    }}>
                      {w.fieldName ? (
                        <><span style={{ color: C.or, fontWeight: 500 }}>{w.fieldName}:</span> {w.message}</>
                      ) : (
                        w.message
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Success indicator */}
              {validation?.warnings.length === 0 && results && (
                <div style={{
                  background: C.gnD,
                  border: `1px solid ${C.gn}40`,
                  borderRadius: 4,
                  padding: S[2],
                  flexShrink: 0
                }}>
                  <div style={{ fontSize: T.sm, color: C.gn, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>✓</span>
                    모든 필드가 정상적으로 파싱되었습니다
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!results && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <EmptyState
            icon="🔍"
            title="데이터를 입력하세요"
            description="위 텍스트 영역에 원시 데이터를 붙여넣고 '파싱 실행' 버튼을 클릭하면 TDD 레이아웃에 따라 파싱된 결과를 확인할 수 있습니다."
          />
        </div>
      )}
    </div>
  );
}

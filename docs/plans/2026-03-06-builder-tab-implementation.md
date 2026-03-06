# Builder Tab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Builder tab that generates telegram files from field inputs, the reverse of Parser functionality.

**Architecture:** New BuilderTab.jsx component + dataBuilder.js utility. Parser parses (telegram→fields), Builder builds (fields→telegram). Shared getByteLength() function.

**Tech Stack:** React 18, Vite 5, inline CSS (no frameworks), JavaScript

---

## Task 1: Add Builder icon to theme.js

**Files:**
- Modify: `src/constants/theme.js:125-129`

**Step 1: Add builder icon to I constant**

```javascript
// In src/constants/theme.js, update I constant:
export const I = {
  layout: "▦", transform: "⇄", dataSource: "↓", pipeline: "▶", parser: "🔍",
  builder: "📝",  // ← ADD THIS
  add: "+", edit: "✎", clone: "⧉", delete: "×", check: "✓",
  up: "▲", down: "▼", dot: "●", circle: "○",
};
```

**Step 2: Verify no syntax errors**

Run: `npm run build 2>&1 | head -20`
Expected: Build starts without immediate errors

**Step 3: Commit**

```bash
git add src/constants/theme.js
git commit -m "feat: add builder icon to theme constants"
```

---

## Task 2: Create dataBuilder.js utility - Core functions

**Files:**
- Create: `src/utils/dataBuilder.js`
- Reference: `src/utils/dataParser.js` (for getByteLength)

**Step 1: Create dataBuilder.js with applyPadding function**

```javascript
// src/utils/dataBuilder.js
import { getByteLength } from './dataParser.js';

/**
 * Apply padding to value to match target byte length
 * @param {string} value - Input value
 * @param {number} length - Target byte length
 * @param {string} padType - Padding type (SPACE_RIGHT, SPACE_LEFT, ZERO_LEFT, ZERO_RIGHT, NONE)
 * @param {string} encoding - Character encoding
 * @returns {string} Padded value
 */
export function applyPadding(value, length, padType, encoding = "EUC-KR") {
  const strValue = String(value ?? "");
  const currentLength = getByteLength(strValue, encoding);

  if (currentLength >= length) {
    // Truncate if too long
    return truncateToByteLength(strValue, length, encoding);
  }

  const padLength = length - currentLength;

  switch (padType) {
    case "SPACE_RIGHT":
      return strValue + " ".repeat(padLength);
    case "SPACE_LEFT":
      return " ".repeat(padLength) + strValue;
    case "ZERO_LEFT":
      return "0".repeat(padLength) + strValue;
    case "ZERO_RIGHT":
      return strValue + "0".repeat(padLength);
    default:
      return strValue + " ".repeat(padLength); // Default to space right
  }
}

/**
 * Truncate string to target byte length
 * @param {string} str - Input string
 * @param {number} maxBytes - Maximum byte length
 * @param {string} encoding - Character encoding
 * @returns {string} Truncated string
 */
export function truncateToByteLength(str, maxBytes, encoding = "EUC-KR") {
  let result = "";
  let bytes = 0;

  for (const char of str) {
    const charBytes = encoding === "UTF-8"
      ? new TextEncoder().encode(char).length
      : (char.charCodeAt(0) > 127 ? 2 : 1);

    if (bytes + charBytes > maxBytes) break;
    result += char;
    bytes += charBytes;
  }

  return result;
}

// Re-export for convenience
export { getByteLength } from './dataParser.js';
```

**Step 2: Verify module loads**

Run: `npm run build 2>&1 | head -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/utils/dataBuilder.js
git commit -m "feat: add dataBuilder utility with applyPadding function"
```

---

## Task 3: Add Transform application to dataBuilder.js

**Files:**
- Modify: `src/utils/dataBuilder.js`

**Step 1: Add applyTransformForBuild function**

Append to `src/utils/dataBuilder.js`:

```javascript
/**
 * Apply transform to value for building telegram
 * @param {string} value - Input value
 * @param {string} transformRef - Transform reference ID
 * @param {Object} tdd - TDD definition with transforms array
 * @returns {string} Transformed value
 */
export function applyTransformForBuild(value, transformRef, tdd) {
  if (!transformRef || !tdd?.transforms) return value;

  const transform = tdd.transforms.find(t => t.id === transformRef);
  if (!transform) return value;

  switch (transform.type) {
    case "MAPPING_TABLE":
      return transform.mappings?.[value] ?? value;

    case "EXPRESSION":
      // Use EXPRESSION_OPS from theme.js
      const { EXPRESSION_OPS } = require('../constants/theme.js');
      const opDef = EXPRESSION_OPS.find(o => o.id === transform.operation);
      if (opDef) {
        try {
          return opDef.fn(value, transform.arg1, transform.arg2);
        } catch (e) {
          return value;
        }
      }
      return value;

    case "DATE_FORMAT":
      // Remove hyphens/slashes for date format
      return value.replace(/[-\/]/g, '');

    default:
      return value;
  }
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/utils/dataBuilder.js
git commit -m "feat: add applyTransformForBuild to dataBuilder"
```

---

## Task 4: Add record building functions to dataBuilder.js

**Files:**
- Modify: `src/utils/dataBuilder.js`

**Step 1: Add buildRecord and calculateComputed functions**

Append to `src/utils/dataBuilder.js`:

```javascript
/**
 * Calculate computed values from data records
 * @param {Array} dataRecords - Array of data record field values
 * @param {Object} tdd - TDD definition
 * @returns {Object} Computed values
 */
export function calculateComputed(dataRecords, tdd) {
  const dataRecordDef = tdd.layout.records.find(r => r.recordType === "DATA");

  // Find field IDs for amount and app_type
  const amountField = dataRecordDef?.fields.find(f =>
    f.id.includes("amount") || f.name.includes("금액")
  );
  const appTypeField = dataRecordDef?.fields.find(f =>
    f.id.includes("app_type") || f.name.includes("신청구분")
  );

  let totalAmount = 0;
  let newCount = 0;
  let cancelCount = 0;
  let changeCount = 0;

  dataRecords.forEach((record, idx) => {
    // Sum amounts
    if (amountField) {
      const amt = parseInt(record[amountField.id] || "0", 10);
      if (!isNaN(amt)) totalAmount += amt;
    }

    // Count by app type
    if (appTypeField) {
      const appType = record[appTypeField.id];
      if (appType === "1") newCount++;
      else if (appType === "3") cancelCount++;
      else if (appType === "7") changeCount++;
    }
  });

  return {
    totalDataCount: dataRecords.length,
    totalAmount,
    newCount,
    cancelCount,
    changeCount,
    // recordSequence is calculated per-record in buildRecord
  };
}

/**
 * Build a single record string from field values
 * @param {Object} recordDef - Record definition from layout
 * @param {Object} fieldValues - Field values keyed by field ID
 * @param {Object} tdd - TDD definition
 * @param {Object} computed - Computed values
 * @param {number} recordIndex - Index for sequence calculation
 * @param {string} encoding - Character encoding
 * @returns {string} Built record string
 */
export function buildRecord(recordDef, fieldValues, tdd, computed, recordIndex, encoding = "EUC-KR") {
  let result = "";

  for (const field of recordDef.fields) {
    let value = "";

    // Determine value source
    if (field.fixedValue != null) {
      value = field.fixedValue;
    } else if (field.sourceRef) {
      if (field.sourceRef.startsWith("computed.")) {
        const computedKey = field.sourceRef.replace("computed.", "");
        if (computedKey === "recordSequence") {
          value = String(recordIndex + 1);
        } else {
          value = String(computed[computedKey] ?? "");
        }
      } else if (field.sourceRef.startsWith("context.")) {
        const contextKey = field.sourceRef.replace("context.", "");
        value = String(fieldValues._context?.[contextKey] ?? "");
      } else {
        // Other sourceRef (ds_*, input.*)
        value = String(fieldValues[field.id] ?? "");
      }
    } else {
      value = String(fieldValues[field.id] ?? "");
    }

    // Apply transform if specified
    if (field.transformRef) {
      value = applyTransformForBuild(value, field.transformRef, tdd);
    }

    // Apply padding
    const paddedValue = applyPadding(value, field.length, field.pad, encoding);
    result += paddedValue;
  }

  return result;
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/utils/dataBuilder.js
git commit -m "feat: add buildRecord and calculateComputed to dataBuilder"
```

---

## Task 5: Add buildTelegram function to dataBuilder.js

**Files:**
- Modify: `src/utils/dataBuilder.js`

**Step 1: Add buildTelegram function**

Append to `src/utils/dataBuilder.js`:

```javascript
/**
 * Build complete telegram (HEADER + DATA[] + TRAILER)
 * @param {Object} tdd - TDD definition
 * @param {Array} dataRecords - Array of data record field values
 * @param {Object} context - Context values (sendDate, institutionId, etc.)
 * @param {string} encoding - Character encoding
 * @returns {Object} { lines: string[], header: string, data: string[], trailer: string, warnings: [] }
 */
export function buildTelegram(tdd, dataRecords, context = {}, encoding = "EUC-KR") {
  const warnings = [];
  const computed = calculateComputed(dataRecords, tdd);

  // Prepare context for all records
  const contextWithDefaults = {
    sendDate: context.sendDate || new Date().toISOString().slice(0, 10).replace(/-/g, ''),
    ...context
  };

  // Build HEADER
  const headerDef = tdd.layout.records.find(r => r.recordType === "HEADER");
  const header = headerDef
    ? buildRecord(headerDef, { _context: contextWithDefaults }, tdd, computed, 0, encoding)
    : "";

  // Build DATA records
  const dataRecordDef = tdd.layout.records.find(r => r.recordType === "DATA");
  const data = dataRecordDef
    ? dataRecords.map((record, idx) =>
        buildRecord(dataRecordDef, { ...record, _context: contextWithDefaults }, tdd, computed, idx, encoding)
      )
    : [];

  // Build TRAILER
  const trailerDef = tdd.layout.records.find(r => r.recordType === "TRAILER");
  const trailer = trailerDef
    ? buildRecord(trailerDef, { _context: contextWithDefaults }, tdd, computed, 0, encoding)
    : "";

  // Combine all lines
  const lines = [];
  if (header) lines.push(header);
  lines.push(...data);
  if (trailer) lines.push(trailer);

  return { lines, header, data, trailer, computed, warnings };
}

/**
 * Create initial empty data record with default values
 * @param {Object} tdd - TDD definition
 * @returns {Object} Empty record with fixedValues pre-filled
 */
export function createEmptyDataRecord(tdd) {
  const dataRecordDef = tdd.layout.records.find(r => r.recordType === "DATA");
  if (!dataRecordDef) return {};

  const record = {};
  for (const field of dataRecordDef.fields) {
    if (field.fixedValue != null) {
      record[field.id] = field.fixedValue;
    } else if (!field.sourceRef?.startsWith("computed.")) {
      record[field.id] = "";
    }
  }
  return record;
}

/**
 * Validate a data record
 * @param {Object} record - Data record field values
 * @param {Object} tdd - TDD definition
 * @returns {Object} { valid: boolean, errors: [] }
 */
export function validateDataRecord(record, tdd) {
  const errors = [];
  const dataRecordDef = tdd.layout.records.find(r => r.recordType === "DATA");
  if (!dataRecordDef) return { valid: true, errors };

  for (const field of dataRecordDef.fields) {
    // Skip computed and fixed fields
    if (field.sourceRef?.startsWith("computed.") || field.fixedValue != null) continue;

    const value = record[field.id];

    // Check required
    if (field.required && (!value || !value.trim())) {
      errors.push({ fieldId: field.id, message: `${field.name} 필수 입력` });
    }
  }

  return { valid: errors.length === 0, errors };
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/utils/dataBuilder.js
git commit -m "feat: add buildTelegram and helper functions to dataBuilder"
```

---

## Task 6: Create BuilderTab.jsx - Basic structure

**Files:**
- Create: `src/components/BuilderTab.jsx`

**Step 1: Create BuilderTab.jsx with basic structure**

```javascript
// src/components/BuilderTab.jsx
import { useState, useMemo, useEffect } from "react";
import { C, TC, RC, fc, T, S } from "../constants/theme.js";
import { B, Btn, Sec, EmptyState } from "./common.jsx";
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
  };

  const handleDeleteRecord = (idx) => {
    if (dataRecords.length <= 1) return;
    const newRecords = dataRecords.filter((_, i) => i !== idx);
    setDataRecords(newRecords);
    if (selectedIndex >= newRecords.length) {
      setSelectedIndex(newRecords.length - 1);
    }
  };

  const handleCloneRecord = (idx) => {
    const cloned = { ...dataRecords[idx] };
    const newRecords = [...dataRecords];
    newRecords.splice(idx + 1, 0, cloned);
    setDataRecords(newRecords);
    setSelectedIndex(idx + 1);
  };

  const handleFieldChange = (fieldId, value) => {
    const newRecords = [...dataRecords];
    newRecords[selectedIndex] = {
      ...newRecords[selectedIndex],
      [fieldId]: value
    };
    setDataRecords(newRecords);
  };

  const handleGeneratePreview = () => {
    const result = buildTelegram(tdd, dataRecords, context, tdd.protocol?.encoding || "EUC-KR");
    setPreview(result);
  };

  const handleDownload = () => {
    if (!preview) {
      handleGeneratePreview();
    }
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
                  onChange={(e) => setContext({ ...context, sendDate: e.target.value })}
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
                          type={field.type === "N" ? "text" : "text"}
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
                        {transform && (
                          <span style={{ fontSize: T.xs, color: C.gn }}>
                            → {transform.type === "MAPPING_TABLE" ? transform.mappings?.[value] || "?" : "..."}
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
              <Btn size="sm" variant="primary" onClick={handleDownload}>다운로드</Btn>
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
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: Build succeeds (component not yet imported)

**Step 3: Commit**

```bash
git add src/components/BuilderTab.jsx
git commit -m "feat: create BuilderTab component with full UI"
```

---

## Task 7: Integrate BuilderTab into App.jsx

**Files:**
- Modify: `src/App.jsx`

**Step 1: Import BuilderTab**

At line ~18 (after ParserTab import), add:

```javascript
import BuilderTab from "./components/BuilderTab.jsx";
```

**Step 2: Add builder tab to tabs array**

Around line ~74, change tabs array:

```javascript
const tabs = [
  { id: "layout", label: "Layout", icon: I.layout },
  { id: "transform", label: "Transform", icon: I.transform },
  { id: "datasource", label: "DataSource", icon: I.dataSource },
  { id: "pipeline", label: "Pipeline", icon: I.pipeline },
  { id: "parser", label: "Parser", icon: I.parser },
  { id: "builder", label: "Builder", icon: I.builder },  // ← ADD THIS
];
```

**Step 3: Add builder state management**

After parserStates state (around line 38), add:

```javascript
const [builderStates, setBuilderStates] = useState({}); // Builder 탭 상태를 TDD별로 저장
```

After getParserState helper (around line 51), add:

```javascript
// Builder 상태 업데이트 헬퍼
const updateBuilderState = (tddId, state) => {
  setBuilderStates(prev => ({
    ...prev,
    [tddId]: { ...prev[tddId], ...state }
  }));
};

// Builder 상태 가져오기 헬퍼
const getBuilderState = (tddId) => builderStates[tddId] || {};
```

**Step 4: Add BuilderTab render**

Around line 336 (after parser tab render), add:

```javascript
{tab === "builder" && <BuilderTab tdd={tdd} key={"B_" + tdd.id} savedState={getBuilderState(tdd.id)} onStateChange={(state) => updateBuilderState(tdd.id, state)} />}
```

**Step 5: Verify build and test**

Run: `npm run build && npm run dev`
Expected: Build succeeds, Builder tab appears and functions

**Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: integrate BuilderTab into main app"
```

---

## Task 8: Fix import issue in dataBuilder.js

**Files:**
- Modify: `src/utils/dataBuilder.js`

**Step 1: Fix EXPRESSION_OPS import (ES module compatible)**

Change the require to import at the top of dataBuilder.js:

```javascript
// At the top of the file, after existing import
import { EXPRESSION_OPS } from '../constants/theme.js';
```

Then update applyTransformForBuild to not use require:

```javascript
export function applyTransformForBuild(value, transformRef, tdd) {
  if (!transformRef || !tdd?.transforms) return value;

  const transform = tdd.transforms.find(t => t.id === transformRef);
  if (!transform) return value;

  switch (transform.type) {
    case "MAPPING_TABLE":
      return transform.mappings?.[value] ?? value;

    case "EXPRESSION":
      const opDef = EXPRESSION_OPS.find(o => o.id === transform.operation);
      if (opDef) {
        try {
          return opDef.fn(String(value), transform.arg1, transform.arg2);
        } catch (e) {
          return value;
        }
      }
      return value;

    case "DATE_FORMAT":
      return String(value).replace(/[-\/]/g, '');

    default:
      return value;
  }
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds without errors

**Step 3: Commit**

```bash
git add src/utils/dataBuilder.js
git commit -m "fix: use ES module import for EXPRESSION_OPS in dataBuilder"
```

---

## Task 9: Final verification and cleanup

**Step 1: Full build test**

Run: `npm run build`
Expected: Build succeeds

**Step 2: Run dev server and test manually**

Run: `npm run dev`

Test checklist:
- [ ] Builder tab appears in tab bar
- [ ] Click "+ 추가" adds a new DATA record
- [ ] Fields are editable in the form
- [ ] Summary shows correct totals
- [ ] "미리보기" shows generated telegram
- [ ] "다운로드" downloads a .txt file
- [ ] "복사" copies to clipboard
- [ ] Transform mappings show preview (e.g., KB → 004)

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Builder tab implementation

- Add dataBuilder.js utility for telegram generation
- Add BuilderTab.jsx component with full UI
- Integrate with App.jsx
- Support DATA record CRUD, field editing, preview, download"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add builder icon | theme.js |
| 2 | Create dataBuilder.js core | dataBuilder.js (new) |
| 3 | Add transform support | dataBuilder.js |
| 4 | Add record building | dataBuilder.js |
| 5 | Add buildTelegram | dataBuilder.js |
| 6 | Create BuilderTab.jsx | BuilderTab.jsx (new) |
| 7 | Integrate into App | App.jsx |
| 8 | Fix ES module import | dataBuilder.js |
| 9 | Final verification | - |

Total estimated steps: ~25 atomic steps across 9 tasks.

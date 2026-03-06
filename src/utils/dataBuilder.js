// ═══════════════════════════════════════
//  Data Builder Utility
//  Build telegram data from field values (reverse of dataParser)
// ═══════════════════════════════════════

import { getByteLength } from './dataParser.js';
import { EXPRESSION_OPS } from '../constants/theme.js';

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
      // Remove hyphens/slashes for date format
      return String(value).replace(/[-\/]/g, '');

    default:
      return value;
  }
}

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

  dataRecords.forEach((record) => {
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

// Re-export getByteLength for convenience
export { getByteLength } from './dataParser.js';

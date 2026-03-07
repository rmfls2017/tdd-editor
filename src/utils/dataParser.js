// ═══════════════════════════════════════
//  Data Parser Utility
//  Parse raw data according to TDD Layout
// ═══════════════════════════════════════

/**
 * Parse multiple lines of data according to the TDD layout
 * @param {string[]} lines - Array of raw data lines
 * @param {Object} layout - TDD layout definition
 * @param {string} encoding - Character encoding (EUC-KR, UTF-8, CP949)
 * @returns {Object} Parsed results grouped by record type
 */
export function parseLines(lines, layout, encoding = "EUC-KR") {
  const results = { header: [], data: [], trailer: [] };

  for (const line of lines) {
    if (!line.trim()) continue;

    const recordType = detectRecordType(line, layout);
    const record = layout.records.find(r => r.recordType === recordType);

    if (record) {
      const parsed = parseRecord(line, record, encoding);
      results[recordType.toLowerCase()].push(parsed);
    }
  }

  return results;
}

/**
 * Parse a single record according to the record definition
 * @param {string} line - Raw data line
 * @param {Object} record - Record definition from TDD layout
 * @param {string} encoding - Character encoding
 * @returns {Object} Parsed record with fields
 */
export function parseRecord(line, record, encoding) {
  const fields = [];
  const warnings = [];

  for (const field of record.fields) {
    const rawValue = extractBytes(line, field.offset, field.length, encoding);
    const trimmedValue = stripPadding(rawValue, field.pad);

    const fieldResult = {
      id: field.id,
      name: field.name,
      offset: field.offset,
      length: field.length,
      rawValue,
      value: trimmedValue,
      type: field.type,
      pad: field.pad,
      required: field.required,
      isEmpty: !trimmedValue.trim(),
      fixedValue: field.fixedValue,
      transformRef: field.transformRef,
      sourceRef: field.sourceRef
    };

    // Check for validation issues
    if (field.required && fieldResult.isEmpty) {
      warnings.push({
        fieldId: field.id,
        fieldName: field.name,
        type: "empty_required",
        message: `Required field '${field.name}' is empty`
      });
    }

    if (field.fixedValue != null && trimmedValue !== field.fixedValue) {
      warnings.push({
        fieldId: field.id,
        fieldName: field.name,
        type: "fixed_mismatch",
        message: `Field '${field.name}' expected '${field.fixedValue}' but got '${trimmedValue}'`
      });
    }

    fields.push(fieldResult);
  }

  return {
    recordType: record.recordType,
    length: record.length,
    fields,
    warnings,
    rawLine: line
  };
}

/**
 * Extract bytes from string with encoding consideration
 * @param {string} str - Input string
 * @param {number} offset - Start byte offset
 * @param {number} length - Number of bytes to extract
 * @param {string} encoding - Character encoding
 * @returns {string} Extracted value
 */
function extractBytes(str, offset, length, encoding) {
  if (encoding === "EUC-KR" || encoding === "CP949") {
    return extractEucKrBytes(str, offset, length);
  }
  // UTF-8 or simple substring for ASCII
  return str.substring(offset, offset + length);
}

/**
 * Extract bytes assuming EUC-KR encoding
 * Korean characters are 2 bytes, ASCII is 1 byte
 * @param {string} str - Input string
 * @param {number} offset - Start byte offset
 * @param {number} length - Number of bytes to extract
 * @returns {string} Extracted value
 */
function extractEucKrBytes(str, offset, length) {
  let bytePos = 0;
  let charStart = 0;

  // Find the character index for the start byte offset
  for (let i = 0; i < str.length && bytePos < offset; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode > 127) {
      bytePos += 2; // Korean or extended char
    } else {
      bytePos += 1; // ASCII
    }
    charStart = i + 1;
  }

  // Handle case where offset is in the middle of a multi-byte character
  if (bytePos > offset) {
    charStart--;
    bytePos -= 2;
  }

  // Extract characters until we've consumed 'length' bytes
  let result = "";
  let bytesConsumed = bytePos - offset < 0 ? bytePos - offset : 0;

  for (let i = charStart; i < str.length && bytesConsumed < length; i++) {
    const charCode = str.charCodeAt(i);
    const charBytes = charCode > 127 ? 2 : 1;

    if (bytesConsumed + charBytes <= length) {
      result += str[i];
      bytesConsumed += charBytes;
    } else {
      break;
    }
  }

  return result;
}

/**
 * Strip padding from value based on padding type
 * @param {string} value - Padded value
 * @param {string} pad - Padding type (SPACE_RIGHT, SPACE_LEFT, ZERO_LEFT, ZERO_RIGHT, NONE)
 * @returns {string} Value with padding removed
 */
function stripPadding(value, pad) {
  switch (pad) {
    case "SPACE_RIGHT":
      return value.trimEnd();
    case "SPACE_LEFT":
      return value.trimStart();
    case "ZERO_LEFT":
      return value.replace(/^0+/, "") || "0";
    case "ZERO_RIGHT":
      return value.replace(/0+$/, "") || "0";
    default:
      return value;
  }
}

/**
 * Detect record type from the first character(s) of the line
 * @param {string} line - Raw data line
 * @param {Object} layout - TDD layout definition
 * @returns {string} Record type (HEADER, DATA, TRAILER)
 */
function detectRecordType(line, layout) {
  const firstChar = line[0];

  // Common conventions: H=Header, D=Data, T=Trailer
  const commonMappings = { H: "HEADER", D: "DATA", T: "TRAILER" };

  // First try to match by fixed value in record type field
  for (const record of layout.records) {
    const typeField = record.fields.find(
      f =>
        f.name.includes("레코드") ||
        f.name.toLowerCase().includes("record") ||
        f.id.includes("record_type") ||
        f.id.includes("rec_type")
    );
    if (typeField?.fixedValue === firstChar) {
      return record.recordType;
    }
  }

  // Try common mapping
  if (commonMappings[firstChar]) {
    const mappedType = commonMappings[firstChar];
    if (layout.records.some(r => r.recordType === mappedType)) {
      return mappedType;
    }
  }

  // Default to DATA
  return "DATA";
}

/**
 * Get byte length of string in given encoding
 * @param {string} str - Input string
 * @param {string} encoding - Character encoding
 * @returns {number} Byte length
 */
export function getByteLength(str, encoding = "EUC-KR") {
  if (encoding === "EUC-KR" || encoding === "CP949") {
    let length = 0;
    for (let i = 0; i < str.length; i++) {
      length += str.charCodeAt(i) > 127 ? 2 : 1;
    }
    return length;
  }
  // UTF-8
  return new TextEncoder().encode(str).length;
}

/**
 * Validate parsed data against TDD definition
 * @param {Object} results - Parsed results from parseLines
 * @param {Object} layout - TDD layout definition
 * @returns {Object} Validation result with errors and warnings
 */
export function validateParsedData(results, layout) {
  const errors = [];
  const warnings = [];

  // Collect all warnings from parsed records
  for (const type of ["header", "data", "trailer"]) {
    for (const record of results[type]) {
      for (const warning of record.warnings) {
        warnings.push({
          recordType: record.recordType,
          ...warning
        });
      }
    }
  }

  // Check record counts if expected
  const headerCount = results.header.length;
  const dataCount = results.data.length;
  const trailerCount = results.trailer.length;

  if (headerCount > 1) {
    warnings.push({
      type: "multiple_headers",
      message: `Multiple HEADER records found (${headerCount})`
    });
  }

  if (trailerCount > 1) {
    warnings.push({
      type: "multiple_trailers",
      message: `Multiple TRAILER records found (${trailerCount})`
    });
  }

  return { errors, warnings, summary: { headerCount, dataCount, trailerCount } };
}

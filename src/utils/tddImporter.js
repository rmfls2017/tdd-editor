// ═══════════════════════════════════════
//  TDD Import Utility
// ═══════════════════════════════════════

/**
 * Validates a TDD object structure
 * @param {object} tdd - The TDD object to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateTDD(tdd) {
  const errors = [];

  // Required fields
  if (!tdd.id || typeof tdd.id !== "string") {
    errors.push("필수 필드 'id'가 없거나 유효하지 않습니다");
  }
  if (!tdd.name || typeof tdd.name !== "string") {
    errors.push("필수 필드 'name'이 없거나 유효하지 않습니다");
  }
  if (!tdd.code || typeof tdd.code !== "string") {
    errors.push("필수 필드 'code'가 없거나 유효하지 않습니다");
  }

  // Layout validation
  if (!tdd.layout || typeof tdd.layout !== "object") {
    errors.push("필수 필드 'layout'이 없거나 유효하지 않습니다");
  } else if (!Array.isArray(tdd.layout.records) || tdd.layout.records.length === 0) {
    errors.push("'layout.records' 배열이 없거나 비어 있습니다");
  } else {
    // Validate each record
    tdd.layout.records.forEach((rec, idx) => {
      if (!rec.id) {
        errors.push(`레코드 ${idx + 1}: 'id'가 없습니다`);
      }
      if (!rec.recordType) {
        errors.push(`레코드 ${idx + 1}: 'recordType'이 없습니다`);
      }
      if (typeof rec.length !== "number" || rec.length <= 0) {
        errors.push(`레코드 ${idx + 1}: 'length'가 유효하지 않습니다`);
      }
      if (!Array.isArray(rec.fields)) {
        errors.push(`레코드 ${idx + 1}: 'fields' 배열이 없습니다`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Checks if a TDD id already exists in the list
 * @param {string} id - The TDD id to check
 * @param {object[]} existingList - The existing TDD list
 * @returns {boolean}
 */
export function isDuplicateId(id, existingList) {
  return existingList.some(tdd => tdd.id === id);
}

/**
 * Reads and parses a JSON file
 * @param {File} file - The file to read
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function readTDDFile(file) {
  return new Promise((resolve) => {
    if (!file.name.endsWith(".json")) {
      resolve({ success: false, error: "JSON 파일만 지원됩니다" });
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve({ success: true, data });
      } catch (err) {
        resolve({ success: false, error: `JSON 파싱 오류: ${err.message}` });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, error: "파일 읽기 오류" });
    };

    reader.readAsText(file, "utf-8");
  });
}

/**
 * Full import workflow: read, validate, check duplicates
 * @param {File} file - The file to import
 * @param {object[]} existingList - The existing TDD list
 * @returns {Promise<{success: boolean, tdd?: object, error?: string}>}
 */
export async function importTDDFile(file, existingList) {
  // 1. Read file
  const readResult = await readTDDFile(file);
  if (!readResult.success) {
    return { success: false, error: readResult.error };
  }

  const tdd = readResult.data;

  // 2. Validate structure
  const validation = validateTDD(tdd);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join("\n") };
  }

  // 3. Check duplicate ID
  if (isDuplicateId(tdd.id, existingList)) {
    return { success: false, error: `중복된 ID입니다: ${tdd.id}` };
  }

  // 4. Add default fields if missing
  const normalizedTdd = {
    ...tdd,
    version: tdd.version || "1.0.0",
    status: tdd.status || "DRAFT",
    updatedAt: tdd.updatedAt || new Date().toISOString().slice(0, 10),
    category: tdd.category || "기타",
    protocol: tdd.protocol || { type: "FILE_BATCH", encoding: "EUC-KR" },
    transforms: tdd.transforms || [],
    dataSources: tdd.dataSources || [],
    pipeline: tdd.pipeline || { steps: [] },
    testCases: tdd.testCases || [],
    validationRules: tdd.validationRules || [],
  };

  return { success: true, tdd: normalizedTdd };
}

/**
 * Creates a file input element and triggers file selection
 * @param {function} onFileSelected - Callback when file is selected
 */
export function openFileDialog(onFileSelected) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };
  input.click();
}

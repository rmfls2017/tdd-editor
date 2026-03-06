// ═══════════════════════════════════════
//  Theme Constants (shared across app)
// ═══════════════════════════════════════

// Color palette (Soft Dark theme)
export const C = {
  bg: "#1e2128",      // 부드러운 다크 배경
  s: "#252931",       // 사이드바 배경
  s2: "#2c313a",      // 컴포넌트 배경
  s3: "#343a45",      // 요소 배경
  bd: "#3d4451",      // 테두리
  bdL: "#4d5564",     // 밝은 테두리
  tx: "#a0a8b4",      // 기본 텍스트 - 낮은 대비
  txD: "#6b7280",     // 흐린 텍스트
  txB: "#d1d5db",     // 밝은 텍스트
  ac: "#6b9fdb",      // 부드러운 블루 액센트
  acD: "#2d4a6d",
  gn: "#5cb99d",      // 부드러운 그린
  gnD: "#1a3d32",
  rd: "#d98080",      // 부드러운 레드
  rdD: "#3d2020",
  or: "#d9a06a",      // 부드러운 오렌지
  orD: "#3d3020",
  pr: "#9b8ac4",      // 부드러운 퍼플
  prD: "#2d2848",
  yl: "#d4b05a",      // 부드러운 옐로우
  cy: "#5ab4c4",      // 부드러운 시안
  cyD: "#1a3038"
};

// Type colors (for field types)
export const TC = { A: C.cy, AN: C.ac, N: C.or, H: "#f070b0", HAN: C.pr };

// Action colors (for pipeline actions)
export const AC = {
  FETCH_DATA: C.cy,
  COMPUTE: C.pr,
  VALIDATE: C.or,
  TRANSFORM_ALL: C.gn,
  BUILD_BATCH_FILE: C.ac,
  OUTPUT_FILE: C.yl,
  READ_FILE: C.cy,
  PARSE_TELEGRAM: C.pr,
  UPDATE_DB: C.or
};

// Status colors
export const SC = { ACTIVE: C.gn, DRAFT: C.or, DEPRECATED: C.rd };

// Record type colors (soft tones)
export const RC = { HEADER: C.ac, DATA: C.gn, TRAILER: C.or, SINGLE: C.pr };

// Field colors (cycle through for field visualization - soft tones)
export const fc = [
  C.ac, C.gn, C.or, C.pr, C.cy,
  C.yl, C.rd, "#7aa8d8", "#8b8fd4", "#c88da8",
  "#68c4b0", "#b094d8"
];

// ═══════════════════════════════════════
//  CreateWizard specific constants
// ═══════════════════════════════════════

// Auto padding rules by type
export const AUTO_PAD = {
  A: "SPACE_RIGHT",
  AN: "SPACE_RIGHT",
  N: "ZERO_LEFT",
  H: "SPACE_RIGHT",
  HAN: "SPACE_RIGHT"
};

// Padding display labels
export const PAD_LABELS = {
  NONE: "없음",
  SPACE_RIGHT: "Space(우측)",
  ZERO_LEFT: "0(좌측)",
  SPACE_LEFT: "Space(좌측)",
  ZERO_RIGHT: "0(우측)"
};

// Type descriptions
export const TYPE_DESC = {
  A: "영문 1Byte",
  AN: "영숫자 1Byte",
  N: "숫자 1Byte",
  H: "한글 2Byte",
  HAN: "한글+영숫자 혼합"
};

// Category options
export const CATEGORIES = ["출금이체", "입금이체", "실시간이체", "자동납부", "원장조회", "기타"];

// Encoding options
export const ENCODINGS = ["EUC-KR", "UTF-8", "CP949"];

// Protocol options
export const PROTOCOLS = ["FILE_BATCH", "TCP_SOCKET"];

// ═══════════════════════════════════════
//  Typography Scale
// ═══════════════════════════════════════
export const T = {
  h1: 18,      // 페이지 제목
  h2: 15,      // 섹션 헤더
  base: 13,    // 본문 기본
  sm: 11,      // 보조 텍스트, 뱃지
  xs: 10,      // 메타데이터
};

// ═══════════════════════════════════════
//  Spacing Scale
// ═══════════════════════════════════════
export const S = {
  1: 4,   // 아이콘-텍스트 간격
  2: 8,   // 컴포넌트 내부 패딩
  3: 12,  // 요소 간 간격
  4: 16,  // 섹션 패딩
  6: 24,  // 섹션 간 간격
};

// ═══════════════════════════════════════
//  Icon Set
// ═══════════════════════════════════════
export const I = {
  layout: "▦", transform: "⇄", dataSource: "↓", pipeline: "▶", parser: "🔍",
  builder: "📝",
  add: "+", edit: "✎", clone: "⧉", delete: "×", check: "✓",
  up: "▲", down: "▼", dot: "●", circle: "○",
};

// ═══════════════════════════════════════
//  Expression Operations (safe eval replacement)
// ═══════════════════════════════════════
export const EXPRESSION_OPS = [
  { id: "UPPER", label: "대문자 변환", fn: (v) => v.toUpperCase() },
  { id: "LOWER", label: "소문자 변환", fn: (v) => v.toLowerCase() },
  { id: "TRIM", label: "공백 제거", fn: (v) => v.trim() },
  { id: "TRIM_ALL", label: "모든 공백 제거", fn: (v) => v.replace(/\s/g, '') },
  { id: "PAD_LEFT", label: "왼쪽 패딩", hasArgs: true, fn: (v, len, ch) => v.padStart(Number(len) || 0, ch || '0') },
  { id: "PAD_RIGHT", label: "오른쪽 패딩", hasArgs: true, fn: (v, len, ch) => v.padEnd(Number(len) || 0, ch || '0') },
  { id: "SUBSTRING", label: "부분 문자열", hasArgs: true, fn: (v, start, end) => v.substring(Number(start) || 0, end ? Number(end) : undefined) },
  { id: "REPLACE", label: "문자열 치환", hasArgs: true, fn: (v, from, to) => from ? v.replace(new RegExp(from, 'g'), to || '') : v },
];

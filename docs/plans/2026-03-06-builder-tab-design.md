# Builder Tab Design

## Overview

Builder 탭은 TDD Layout 정의를 기반으로 테스트용 전문 파일을 생성하는 기능입니다.
Parser 탭의 역방향 기능으로, 필드 값 입력 → 고정길이 전문 생성을 담당합니다.

## Goals

1. CMS 전문 테스트 데이터 생성 과정 단순화
2. 수동으로 바이트 계산하며 파일 만드는 수고 제거
3. Transform 규칙 자동 적용으로 변환 오류 방지
4. HEADER/TRAILER 자동 생성으로 집계 오류 방지

## Requirements Summary

| 항목 | 선택 |
|------|------|
| DATA 입력 방식 | 수동 입력 (필드별 폼) |
| HEADER/TRAILER | 자동 생성 (총건수, 총금액 계산) |
| 출력 형식 | 파일 다운로드 (.txt) |
| Transform 적용 | 자동 적용 |
| UI 방식 | 새로운 Builder 탭 추가 |

## UI Design

```
┌─────────────────────────────────────────────────────────────────────┐
│ Builder 탭                                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┌─ 좌측 패널 (220px) ─┐  ┌─── 메인 영역 ──────────────────────────┐ │
│ │                     │  │                                        │ │
│ │ DATA 레코드 목록     │  │ 필드 입력 폼 (선택된 DATA 레코드)       │ │
│ │ ────────────────    │  │ ┌──────────────────────────────────┐ │ │
│ │ ○ 건 #1 ✓          │  │ │ 은행코드   [KB     ] → 004       │ │ │
│ │ ○ 건 #2 ✓          │  │ │ 계좌번호   [123-456-789        ] │ │ │
│ │ ● 건 #3 (선택)      │  │ │ 출금금액   [50000  ]            │ │ │
│ │ ○ 건 #4 ⚠          │  │ │ 예금주명   [홍길동              ] │ │ │
│ │                     │  │ │ ...                              │ │ │
│ │ [+ 레코드 추가]      │  │ └──────────────────────────────────┘ │ │
│ │                     │  │                                        │ │
│ └─────────────────────┘  │ 유효성 검사 결과                        │ │
│                          │ ✓ 모든 필수 필드 입력 완료               │ │
│ ┌─ 요약 정보 ─────────┐  │                                        │ │
│ │ 총 건수: 4          │  └────────────────────────────────────────┘ │
│ │ 총 금액: 150,000    │                                             │
│ │ 신규: 3 / 해지: 1   │                                             │
│ └─────────────────────┘                                             │
│                                                                     │
│ ┌─ 미리보기 영역 ───────────────────────────────────────────────────┐ │
│ │ H EB13 A123456789 20260306 01 0000004 테스트기관          ... │ │
│ │ R 0000001 004 123-456-789      0000000050000 홍길동       ... │ │
│ │ R 0000002 088 987-654-321      0000000030000 김철수       ... │ │
│ │ T 0000004 0000000150000 0000003 0000001 0000000           ... │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ [미리보기 갱신]  [클립보드 복사]  [파일 다운로드]                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Components

### BuilderTab.jsx (신규)

메인 컴포넌트. 다음 상태를 관리:

```javascript
const [dataRecords, setDataRecords] = useState([]);  // DATA 레코드 배열
const [selectedIndex, setSelectedIndex] = useState(0);  // 선택된 레코드 인덱스
const [contextData, setContextData] = useState({});  // HEADER용 컨텍스트 (기관코드, 날짜 등)
const [previewData, setPreviewData] = useState(null);  // 생성된 전문 미리보기
```

### dataBuilder.js (신규)

핵심 유틸리티 함수:

```javascript
// 전체 전문 생성
export function buildTelegram(tdd, dataRecords, context, encoding)

// 단일 레코드 생성
export function buildRecord(recordDef, fieldValues, tdd, encoding)

// HEADER 자동 생성
export function buildHeader(tdd, computed, context, encoding)

// TRAILER 자동 생성
export function buildTrailer(tdd, computed, encoding)

// computed 값 계산 (총건수, 총금액 등)
export function calculateComputed(dataRecords, tdd)

// 패딩 적용 (stripPadding의 역방향)
export function applyPadding(value, length, padType, encoding)

// Transform 적용
export function applyTransformForBuild(value, transformRef, tdd)

// EUC-KR 바이트 길이 계산 (기존 dataParser.js 재사용)
export { getByteLength } from './dataParser.js'
```

## Data Flow

```
User Input (필드값)
    │
    ▼
┌─────────────────────────────────────────┐
│ 1. 입력값 유효성 검사                    │
│    - 필수 필드 체크                      │
│    - 길이 체크                          │
│    - 타입 체크 (숫자 필드에 문자 등)      │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 2. Transform 적용                       │
│    - transformRef가 있는 필드            │
│    - 예: 은행코드 "KB" → "004"          │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 3. Computed 값 계산                     │
│    - totalCount: DATA 레코드 수          │
│    - totalAmount: 금액 합계             │
│    - newCount, cancelCount, changeCount │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│ 4. 레코드 생성                          │
│    - applyPadding() 적용                │
│    - EUC-KR 바이트 길이 맞춤             │
│    - HEADER, DATA[], TRAILER 조립       │
└─────────────────────────────────────────┘
    │
    ▼
Preview / Download
```

## File Structure

```
src/
├── components/
│   ├── App.jsx                ← 수정 (Builder 탭 추가)
│   ├── BuilderTab.jsx         ← 신규
│   ├── ParserTab.jsx          ← 기존
│   └── ...
├── utils/
│   ├── dataParser.js          ← 기존 (getByteLength 재사용)
│   └── dataBuilder.js         ← 신규
└── constants/
    └── theme.js               ← 수정 (Builder 아이콘 추가)
```

## Features

### 1. DATA 레코드 관리

- 추가: 빈 레코드 추가, fixedValue 필드는 기본값 설정
- 선택: 클릭하면 오른쪽에 입력 폼 표시
- 복제: 선택된 레코드 복사
- 삭제: 선택된 레코드 삭제
- 상태 표시: ✓ 유효, ⚠ 필수 필드 누락

### 2. 필드 입력 폼

- Layout 기반 자동 생성
- fixedValue 필드는 읽기 전용으로 표시
- sourceRef가 computed.* 인 필드는 자동 계산 표시
- transformRef가 있으면 변환 결과 실시간 표시
- 타입별 입력 컨트롤:
  - N (숫자): number input
  - A/AN: text input
  - H/HAN: text input (한글 지원)

### 3. 자동 계산 (computed)

Layout의 sourceRef를 분석하여 자동 계산:

| sourceRef | 계산 방식 |
|-----------|----------|
| computed.totalDataCount | DATA 레코드 수 |
| computed.recordSequence | 1부터 순차 증가 |
| computed.totalAmount | d_withdraw_amount 합계 |
| computed.newCount | d_app_type === "1" 건수 |
| computed.cancelCount | d_app_type === "3" 건수 |
| computed.changeCount | d_app_type === "7" 건수 |

### 4. HEADER 컨텍스트 입력

HEADER에 필요한 context 값 입력 UI:

- context.sendDate: 전송일자 (DatePicker)
- context.institutionId: 기관 ID (추후 DataSource 연동 가능)

### 5. 미리보기

- 실시간 전문 형태로 렌더링
- 바이트 맵 컬러링 (Layout 탭과 동일한 스타일)
- 레코드별 구분선

### 6. 파일 다운로드

- 파일명: `{TDD_CODE}_{YYYYMMDD}_{HHmmss}.txt`
- 인코딩: TDD의 protocol.encoding (기본 EUC-KR)
- 줄바꿈: `\n` (LF)

## Edge Cases

1. **DATA 레코드 0건**: HEADER/TRAILER만 생성, 경고 표시
2. **필수 필드 누락**: 해당 레코드 ⚠ 표시, 다운로드 시 확인 팝업
3. **바이트 길이 초과**: 자동 truncate + 경고
4. **한글 바이트 계산**: EUC-KR 기준 2바이트로 계산

## Testing

1. 빈 레코드 추가 → 필드 입력 → 미리보기 확인
2. 여러 건 추가 → 총건수/총금액 자동 계산 확인
3. Transform 적용 확인 (은행코드 등)
4. 파일 다운로드 → Parser로 역파싱 → 일치 확인

## Future Enhancements

1. CSV/엑셀 붙여넣기 지원
2. 테스트 시나리오 저장/불러오기
3. DataSource stub 데이터 연동
4. 서버 API 연동 (기관 마스터 조회 등)

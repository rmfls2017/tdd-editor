# TDD Editor - 작업 리스트

> 최종 업데이트: 2026-03-04

---

## 완료된 작업

### Phase 1: Parser 탭 UI 일관성 복원
- [x] 상세 패널 너비 `280px` → `260px` 통일
- [x] 커스텀 섹션 헤더 → `<Sec>` 컴포넌트 적용
- [x] 커스텀 Empty State → `<EmptyState>` 컴포넌트 적용

### Phase 2: 탭 상태 유지 (Parser 탭)
- [x] App 레벨에서 `parserStates` 상태 관리
- [x] Parser 탭에 `savedState`, `onStateChange` props 전달
- [x] 탭 전환 시 입력값, 파싱 결과, 인코딩, activeRecord 유지

### Phase 3: Transform 탭 CRUD 기능
- [x] Transform 추가/수정/삭제 기능 (`TransformEditModal` 활용)
- [x] 테스트 케이스 CRUD (추가/수정/삭제/실행)
- [x] Transform 수정 시 testCases 보존 버그 수정

### Phase 4: Transform 테스트 케이스 인라인 편집 UX 개선
- [x] 키보드 지원: `Enter` 저장, `Escape` 취소
- [x] 편집 모드 시각적 하이라이트 (row 배경색 변경)
- [x] 포커스 상태 추적: 실제 커서가 있는 input만 파란 테두리
- [x] 버튼 툴팁 추가 ("저장 (Enter)", "취소 (Esc)")

### Phase 5: 버튼 스타일 및 사이즈 통일
- [x] 인라인 편집 취소 버튼 스타일 통일 (회색 → 빨간색, ActionButton delete variant 일치)
- [x] ActionButton에 `boxSizing: "border-box"` 추가 (border 포함 정확한 크기 보장)
- [x] 테스트 케이스 헤더-바디 컬럼 정렬 (`width: 60` → `76`)
- [x] 편집 모드 저장/취소 버튼 border 통일 및 gap/width 일관성 확보
- [x] DataSource 시나리오 호버 버튼 gap 개선 (`1` → `2`)
- [x] Pipeline DryRun 버튼 `minWidth` 추가 (텍스트 변동 레이아웃 시프트 방지)

### Phase 6: CreateWizard 트랜지션 개선
- [x] CreateWizard 완료 시 이전 탭 유지 (`setTab("layout")` 제거)

---

## 미구현 작업

### 1. Parser Transform 타입 불일치 수정 [Bug]
- `dataParser.js`의 `applyTransform`이 `CODE_MAP`/`NUMBER_FORMAT` 타입 사용
- 실제 TDD 스키마는 `MAPPING_TABLE`/`EXPRESSION` 타입 사용
- Parser "변환 후" 컬럼이 항상 원본값 그대로 표시되는 버그
- **파일:** `src/utils/dataParser.js`

### 2. DataSource 시나리오 삭제 후 fallback 오류 [Bug]
- "default" 시나리오 없을 때 `setSc("default")` → `undefined` 표시
- **파일:** `src/components/DataSourceTab.jsx`

### 3. 테스트 케이스 추가 시 빈 데이터 즉시 저장 방지 [Bug]
- `handleAddTestCase`가 빈 테스트 케이스를 즉시 API 저장
- 사용자가 값을 입력한 후 저장하도록 변경
- **파일:** `src/components/TransformTab.jsx`

### 4. eval() → 안전한 대안 교체 [Security]
- `TransformTab.jsx` (141행), `TransformEditModal.jsx` (90행)
- `new Function("value", expression)(input)` 또는 safe evaluator로 교체
- **파일:** `src/components/TransformTab.jsx`, `src/components/TransformEditModal.jsx`

### 5. 에러 피드백 패턴 통일 [UX 일관성]
- `alert()` → toast 또는 Modal (DataSourceEditModal)
- `confirm()` → 확인 Modal (TransformTab, DataSourceTab, CreateWizard, App)
- **파일:** 다수

### 6. TransformEditModal ID 검증 피드백 [UX]
- `tr_` 접두사 필수이나 저장 버튼만 비활성화, 이유 없음
- 인라인 에러 메시지 추가
- **파일:** `src/components/TransformEditModal.jsx`

### 7. 컴포넌트 중복 정리 [코드 품질]
- CreateWizard 내 B/Input/Select/Btn을 common.jsx로 통합
- API 불일치 해소 (boolean props vs string variant)
- **파일:** `src/CreateWizard.jsx`, `src/components/common.jsx`

---

## 구현 우선순위 요약

| 순위 | 작업 | 분류 | 예상 난이도 |
|------|------|------|------------|
| 1 | Parser Transform 타입 불일치 수정 | Bug | Medium |
| 2 | DataSource 시나리오 삭제 후 fallback 오류 | Bug | Easy |
| 3 | 테스트 케이스 추가 시 빈 데이터 즉시 저장 방지 | Bug | Easy |
| 4 | eval() → 안전한 대안 교체 | Security | Medium |
| 5 | 에러 피드백 패턴 통일 | UX 일관성 | Medium |
| 6 | TransformEditModal ID 검증 피드백 | UX | Easy |
| 7 | 컴포넌트 중복 정리 | 코드 품질 | Medium |

---

## 파일 구조 참고

```
src/
├── App.jsx                    # 메인 앱 (탭 상태 관리)
├── CreateWizard.jsx           # TDD 생성/편집 위자드
├── constants/
│   └── theme.js               # 테마 상수
├── components/
│   ├── common.jsx             # 공통 컴포넌트 (B, Sec, EmptyState, etc.)
│   ├── ActionButton.jsx       # 액션 버튼 (edit, delete, run)
│   ├── LayoutTab.jsx          # 레이아웃 탭 (읽기 전용)
│   ├── TransformTab.jsx       # 변환 규칙 탭 (CRUD + 테스트 케이스)
│   ├── TransformEditModal.jsx # Transform 편집 모달
│   ├── DataSourceTab.jsx      # 데이터소스 탭
│   ├── DataSourceEditModal.jsx # DataSource 편집 모달
│   ├── PipelineTab.jsx        # 파이프라인 탭
│   └── ParserTab.jsx          # 파서 탭 (상태 유지 구현됨)
└── utils/
    ├── api.js                 # API 클라이언트
    ├── dataParser.js          # 데이터 파싱 유틸
    └── tddImporter.js         # TDD 가져오기 유틸
```

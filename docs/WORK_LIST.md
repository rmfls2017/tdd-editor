# TDD Editor - 작업 리스트

> 최종 업데이트: 2026-03-03

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

---

## 미구현 작업

### 1. CreateWizard 트랜지션 개선
**우선순위: Medium**

**현재 동작:**
```
CreateWizard 완료 → 무조건 Layout 탭으로 이동
```

**개선 방향:**
- CreateWizard 완료 시 이동할 탭 선택 옵션 제공
- 사용자가 바로 Transform, DataSource, Pipeline, Parser 탭으로 이동 가능

**구현 예상:**
```jsx
// CreateWizard.jsx - Step 3 (검토 & 저장)
<Select
  label="완료 후 이동할 탭"
  value={targetTab}
  onChange={setTargetTab}
  options={[
    { value: "layout", label: "Layout" },
    { value: "transform", label: "Transform" },
    { value: "datasource", label: "DataSource" },
    { value: "pipeline", label: "Pipeline" },
    { value: "parser", label: "Parser" },
  ]}
/>

// onComplete 호출 시 targetTab 전달
onComplete(newTdd, targetTab);
```

**파일 변경:**
- `src/CreateWizard.jsx` - targetTab 상태 및 선택 UI 추가
- `src/App.jsx` - onComplete 콜백에서 탭 이동 처리

---

### 2. 다른 탭들 상태 유지 확장
**우선순위: Low**

현재 Parser 탭만 상태 유지가 구현됨. 일관성을 위해 다른 탭들도 동일하게 적용 가능:

#### 2.1 Transform 탭
| 유지할 상태 | 설명 |
|------------|------|
| `sel` | 선택된 Transform ID |
| `ti` | 테스트 입력값 |
| `to` | 변환 결과 |

#### 2.2 DataSource 탭
| 유지할 상태 | 설명 |
|------------|------|
| `sel` | 선택된 DataSource ID |
| `sc` | 선택된 Stub 시나리오 |

#### 2.3 Pipeline 탭
| 유지할 상태 | 설명 |
|------------|------|
| `drs` | DryRun 상태 ("run" | "done" | null) |
| `rs` | 현재 실행 중인 step 인덱스 |

**참고:** 이 작업들은 Parser 탭과 동일한 패턴으로 구현하면 됨:
1. App.jsx에 각 탭별 상태 관리 추가
2. 각 탭 컴포넌트에 `savedState`, `onStateChange` props 추가

---

### 3. 추가 개선 사항 (Optional)
**우선순위: Low**

#### 3.1 Layout 탭 읽기 전용 표시
- 현재 Layout 탭은 CreateWizard에서만 편집 가능
- 읽기 전용임을 명확히 표시하거나, 인라인 편집 기능 추가 고려

#### 3.2 TDD 검색 기능 개선
- 현재: 이름, 코드, ID로 검색
- 개선: 카테고리 필터, 상태(ACTIVE/DRAFT/DEPRECATED) 필터 추가

#### 3.3 Export 기능
- 현재 TDD를 JSON 파일로 내보내기 기능
- Import는 이미 구현됨

#### 3.4 Keyboard Shortcuts
- `Ctrl/Cmd + S`: 현재 TDD 저장 (Transform/DataSource/Pipeline 탭에서)
- `Ctrl/Cmd + N`: 새 TDD 생성
- `1-5`: 탭 전환 (Layout, Transform, DataSource, Pipeline, Parser)

---

## 기술 부채 (Tech Debt)

### 1. TransformTab의 eval() 사용
```jsx
// TransformTab.jsx:41
try { const value = ti; setTo({ ok: true, v: String(eval(tr.expression)) }); }
```
- 보안 경고 발생 (빌드 시)
- 안전한 expression evaluator로 교체 권장

### 2. 컴포넌트 분리
- `CreateWizard.jsx`에 Micro Components(B, Input, Select, Check, Btn) 중복 정의
- `common.jsx`로 통합 권장

### 3. TypeScript 마이그레이션
- 현재 모든 파일이 JSX
- 타입 안정성을 위해 TSX 마이그레이션 고려

---

## 구현 우선순위 요약

| 순위 | 작업 | 예상 난이도 | 비고 |
|------|------|------------|------|
| 1 | CreateWizard 트랜지션 개선 | Easy | 사용자 경험 개선 |
| 2 | Transform 탭 상태 유지 | Easy | 일관성 |
| 3 | DataSource 탭 상태 유지 | Easy | 일관성 |
| 4 | Pipeline 탭 상태 유지 | Easy | 일관성 |
| 5 | Layout 탭 읽기 전용 표시 | Easy | UX 명확성 |
| 6 | Export 기능 | Medium | 기능 완성도 |
| 7 | Keyboard Shortcuts | Medium | 파워 유저 지원 |
| 8 | eval() 제거 | Medium | 보안 |
| 9 | 컴포넌트 통합 | Low | 코드 정리 |
| 10 | TypeScript 마이그레이션 | High | 장기 과제 |

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
│   ├── LayoutTab.jsx          # 레이아웃 탭 (읽기 전용)
│   ├── TransformTab.jsx       # 변환 규칙 탭
│   ├── DataSourceTab.jsx      # 데이터소스 탭
│   ├── PipelineTab.jsx        # 파이프라인 탭
│   ├── ParserTab.jsx          # 파서 탭 (상태 유지 구현됨)
│   └── TransformEditModal.jsx # Transform 편집 모달
└── utils/
    ├── api.js                 # API 클라이언트
    ├── dataParser.js          # 데이터 파싱 유틸
    └── tddImporter.js         # TDD 가져오기 유틸
```

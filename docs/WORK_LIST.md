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

### 2. 인라인 편집 기능 확장
**우선순위: High**

#### 2.1 Transform 탭 (부분 완료)
| 기능 | 상태 | 비고 |
|------|------|------|
| Transform CRUD | ✅ 완료 | 모달 기반 |
| 테스트 케이스 CRUD | ✅ 완료 | 인라인 편집 |
| 키보드 지원 | ✅ 완료 | Enter/Escape |
| 포커스 시각화 | ✅ 완료 | 개별 input 하이라이트 |
| 입력값 검증 | ✅ 완료 | MAPPING_TABLE 키 검증, DATE_FORMAT 8자리 체크 |
| Tab 키 필드 이동 | ⚠️ 기본 동작 | 개선 필요시 P3 |

#### 2.2 DataSource 탭 (부분 완료)
| 기능 | 상태 | 비고 |
|------|------|------|
| DataSource CRUD | ✅ 완료 | 모달 기반 (DataSourceEditModal) |
| 시나리오 CRUD | ✅ 완료 | 모달 기반, 탭 전환 방식 |
| 파라미터 편집 | ⚠️ 모달 내 편집 | 인라인 편집 미지원 |

#### 2.3 LayoutTab 인라인 편집 (미구현)
- 현재 읽기 전용
- 필드 속성(offset, length, type 등) 직접 편집 기능 필요시 구현

**파일 변경 예상:**
- `src/components/DataSourceTab.jsx` - CRUD UI 추가
- `src/components/DataSourceEditModal.jsx` - 이미 존재, 활용 가능

---

### 3. 다른 탭들 상태 유지 확장 (Low Priority)
**우선순위: Low**

현재 Parser 탭만 상태 유지가 구현됨. 일관성을 위해 다른 탭들도 동일하게 적용 가능:

#### 3.1 Transform 탭
| 유지할 상태 | 설명 |
|------------|------|
| `sel` | 선택된 Transform ID |
| `ti` | 테스트 입력값 |
| `to` | 변환 결과 |

#### 3.2 DataSource 탭
| 유지할 상태 | 설명 |
|------------|------|
| `sel` | 선택된 DataSource ID |
| `sc` | 선택된 Stub 시나리오 |

#### 3.3 Pipeline 탭
| 유지할 상태 | 설명 |
|------------|------|
| `drs` | DryRun 상태 ("run" | "done" | null) |
| `rs` | 현재 실행 중인 step 인덱스 |

**참고:** 이 작업들은 Parser 탭과 동일한 패턴으로 구현하면 됨:
1. App.jsx에 각 탭별 상태 관리 추가
2. 각 탭 컴포넌트에 `savedState`, `onStateChange` props 추가

---

### 4. 추가 개선 사항 (Optional)
**우선순위: Low**

#### 4.1 Layout 탭 읽기 전용 표시
- 현재 Layout 탭은 CreateWizard에서만 편집 가능
- 읽기 전용임을 명확히 표시하거나, 인라인 편집 기능 추가 고려

#### 4.2 TDD 검색 기능 개선
- 현재: 이름, 코드, ID로 검색
- 개선: 카테고리 필터, 상태(ACTIVE/DRAFT/DEPRECATED) 필터 추가

#### 4.3 Export 기능
- 현재 TDD를 JSON 파일로 내보내기 기능
- Import는 이미 구현됨

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

| 순위 | 작업 | 예상 난이도 | 상태 | 비고 |
|------|------|------------|------|------|
| 1 | Transform 탭 인라인 편집 | High | ✅ 완료 | CRUD + 테스트 케이스 |
| 2 | DataSource 탭 CRUD | Medium | ✅ 완료 | 모달 기반 구현됨 |
| 3 | 테스트 케이스 입력값 검증 | Easy | ✅ 완료 | 기존 검증으로 충분 |
| 4 | CreateWizard 트랜지션 개선 | Easy | ✅ 완료 | 이전 탭 유지 |
| 5 | **Transform 탭 상태 유지** | **Easy** | **🔜 다음** | **일관성** |
| 6 | DataSource 탭 상태 유지 | Easy | 대기 | 일관성 |
| 7 | Pipeline 탭 상태 유지 | Easy | 대기 | 일관성 |
| 8 | Layout 탭 읽기 전용 표시 | Easy | 대기 | UX 명확성 |
| 9 | Export 기능 | Medium | 대기 | 기능 완성도 |
| 10 | eval() 제거 | Medium | 대기 | 보안 |
| 11 | 컴포넌트 통합 | Low | 대기 | 코드 정리 |
| 12 | TypeScript 마이그레이션 | High | 대기 | 장기 과제 |

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

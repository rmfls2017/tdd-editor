# TDD Editor - 작업 리스트

> 최종 업데이트: 2026-03-08 (Parser 경고 오탐 이슈 추가)

---

## 현재 기능 현황

| 탭 | 상태 | 핵심 기능 |
|----|------|-----------|
| **Layout** | 읽기 전용 뷰어 | 바이트맵 시각화, 필드 테이블, 상세 패널 (편집 기능 미구현) |
| **Parser** | 완료 | 전문 파싱, 인코딩 선택 (EUC-KR/CP949/UTF-8), 유효성 검사, 탭 전환 시 상태 유지 |
| **Builder** | 완료 | DATA 레코드 CRUD, 전문 생성/미리보기/다운로드/클립보드 복사, 응답 TDD 지원 (요청 전문 임포트, 에러코드 드롭다운, 불능 추적) |
| **CreateWizard** | 완료 | 4단계 위자드, 생성/편집/복제, CMS 템플릿 지원 |

---

## 완료된 작업

### Phase 10: 신규 TDD 추가
- [x] CMS_EB11_WITHDRAW_APP (은행접수 출금이체신청) TDD 생성
- [x] CMS_EB12_WITHDRAW_RES (은행접수 결과통보) TDD 생성
- [x] CMS_EB13, EB14 v2.0.0 업데이트 (필드 재구조화, transform 참조 제거)
- [x] ds_error_codes.json 에러코드 데이터소스 추가 (결과코드 + 39종 에러코드)

### Phase 9: BuilderTab 응답 TDD 지원
- [x] responseOf 감지 및 요청 TDD 자동 매칭
- [x] 요청 전문 붙여넣기 → 응답 DATA 레코드 자동 매핑
- [x] 에러코드 드롭다운 (ds_error_codes 연동, 카테고리별 분류)
- [x] 결과코드 Y/N 전환 시 불능코드 자동 처리
- [x] 불능 레코드 빨간 배경 표시 + 불능 집계 섹션
- [x] HEADER DataSource 필드 입력 UI
- [x] dataBuilder에 context/fileName/failure 추적 추가

### Phase 8: Transform/DataSource/Pipeline 탭 제거 및 아키텍처 단순화
- [x] 6개 컴포넌트 삭제 (ActionButton, TransformTab/EditModal, DataSourceTab/EditModal, PipelineTab)
- [x] 16개 데이터 파일 삭제 (transforms, dataSources, pipelines)
- [x] App.jsx, api.js, vite.config.js, theme.js 등 전체 정리
- [x] ParserTab: applyTransform 제거, "변환 후" 컬럼 제거, 경고 아이콘 도트로 변경
- [x] DataSource 읽기 전용 엔드포인트 유지 (에러코드 조회용)

### Phase 7: Builder 탭 구현
- [x] Builder 아이콘 추가 (`theme.js`)
- [x] 데이터 빌더 유틸리티 (`dataBuilder.js`)
- [x] BuilderTab 컴포넌트 (`BuilderTab.jsx`)
- [x] App.jsx에 BuilderTab 통합

### Phase 6.5: eval() 보안 취약점 수정
- [x] `EXPRESSION_OPS` 상수 추가 (이후 Phase 8에서 제거됨)

### Phase 1-6: 초기 구현
- [x] Parser 탭 UI 일관성 복원
- [x] 탭 상태 유지 (Parser/Builder)
- [x] Transform 탭 CRUD 기능 (이후 Phase 8에서 제거됨)
- [x] Transform 테스트 케이스 인라인 편집 UX (이후 Phase 8에서 제거됨)
- [x] 버튼 스타일 및 사이즈 통일
- [x] CreateWizard 트랜지션 개선

---

## 미완료 작업 (우선순위순)

### Parser fixedValue 경고 오탐 수정
**심각도:** HIGH
**파일:** `src/utils/dataParser.js:72`

**근본 원인:** `fixedValue` 비교 시 패딩 제거 후 값(`trimmedValue`)을 사용하는데, `fixedValue`는 패딩 포함 원시 값으로 정의되어 있어 불일치 발생.

**오탐 시나리오:**
- ZERO_LEFT 패딩 필드: `"00000000"` → stripPadding → `"0"` ≠ fixedValue `"00000000"` (EB13/EB14 h_seq_no, t_change_count 등)
- SPACE_RIGHT 패딩 필드: `" "` → stripPadding → `""` ≠ fixedValue `" "` (EB13 d_result_code)

**수정 방안:** `trimmedValue` 대신 `rawValue`로 fixedValue와 비교
```js
// 현재
if (field.fixedValue != null && trimmedValue !== field.fixedValue)
// 수정
if (field.fixedValue != null && rawValue !== field.fixedValue)
```

### DRAFT TDD → ACTIVE 전환 작업

#### EB21 (자금이체)
- [ ] FILLER 필드를 실제 비즈니스 필드로 교체
- [ ] 테스트케이스 정의
- [ ] validationRules 생성
- [ ] version 1.0.0 + status ACTIVE 변경

#### EC21 (실시간 출금)
- [ ] TCP_SOCKET 프로토콜 필드 완성
- [ ] SINGLE 레코드 구조화
- [ ] 테스트케이스/validationRules 추가
- [ ] version 1.0.0 + status ACTIVE 변경

### UX 개선

#### CreateWizard 취소 시 데이터 손실
**심각도:** HIGH

- 변경사항 있을 때 확인 다이얼로그 표시
- localStorage에 자동 저장 구현

#### API 실패 시 복구 불가
**심각도:** HIGH

- 실패 시 롤백 로직 추가
- 에러 토스트 메시지 표시

#### 로딩 상태 피드백 부재
**심각도:** MEDIUM

- 저장 버튼 disabled + 로딩 스피너
- 요청 중복 방지 (debounce)

#### 키보드 접근성 부족
**심각도:** MEDIUM

- 드롭다운 메뉴 키보드 탐색
- ARIA 레이블 추가

#### 코드 중복 제거
**심각도:** LOW

- Toast, JSON Export 등 공통 로직 추출

---

## 보류된 작업

| 작업 | 보류 사유 |
|------|----------|
| TypeScript 마이그레이션 | 장기 과제, 현재 기능 개발에 영향 없음 |
| Layout 탭 필드 편집 기능 | 읽기 전용 뷰어로 충분, 편집은 CreateWizard에서 처리 |
| Record & Replay | 프로덕션 장애 재현, 필요성 미확인 |
| Echo Server | 은행 모의 서버, 필요성 미확인 |
| JSON Schema 검증 + DB 저장 | 현재 파일 기반으로 충분 |

---

## 파일 구조 참고

```
src/
├── App.jsx                    # 메인 앱 (탭 상태 관리)
├── CreateWizard.jsx           # TDD 생성/편집 위자드
├── constants/
│   └── theme.js               # 테마 상수
├── components/
│   ├── common.jsx             # 공통 컴포넌트 (Btn, Sec, EmptyState, etc.)
│   ├── LayoutTab.jsx          # 레이아웃 탭 (읽기 전용)
│   ├── ParserTab.jsx          # 파서 탭 (전문→필드 파싱)
│   └── BuilderTab.jsx         # 빌더 탭 (필드→전문 생성, 응답 TDD 지원)
└── utils/
    ├── api.js                 # API 클라이언트
    ├── dataParser.js          # 데이터 파싱 유틸 (전문→필드)
    ├── dataBuilder.js         # 데이터 빌더 유틸 (필드→전문)
    └── tddImporter.js         # TDD 가져오기 유틸
```

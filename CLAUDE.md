# TDD Editor - Project Guide

## 프로젝트 개요
CMS(Cash Management Service) 전문 정의 편집기. 고정길이 EUC-KR 전문의 정의, 파싱, 생성을 지원하는 React + Vite 앱.

## 기술 스택 & 명령어
- **React 18 + Vite 5**, JSX only (TypeScript 없음)
- `npm run dev` — 개발 서버
- `npm run build` — 프로덕션 빌드

## 아키텍처
- **프론트엔드**: React 함수형 컴포넌트, 인라인 스타일 (CSS 파일 없음)
- **백엔드**: `vite.config.js` 미들웨어 — 파일 기반 JSON API
- **데이터**: `data/` 디렉토리 (tdd, validationRules, dataSources, templates)
- **3개 탭**: Layout (읽기 전용), Parser (전문 파싱), Builder (전문 생성)

### 주요 파일
- `src/App.jsx` — 메인 앱, 탭 라우팅, TDD 목록/상세
- `src/CreateWizard.jsx` — TDD 생성/편집/복제 위자드
- `src/components/LayoutTab.jsx` — 레코드/필드 레이아웃 뷰어
- `src/components/ParserTab.jsx` — 전문 파싱
- `src/components/BuilderTab.jsx` — 전문 생성
- `src/components/common.jsx` — 공유 styled 컴포넌트
- `src/constants/theme.js` — 테마 상수
- `src/utils/api.js` — API 클라이언트
- `src/utils/dataBuilder.js` — 전문 생성 로직
- `src/utils/dataParser.js` — 전문 파싱 로직
- `src/utils/tddImporter.js` — TDD JSON 임포트/검증

## 코딩 컨벤션

### 컴포넌트
- 함수형 컴포넌트만 사용, 클래스 컴포넌트 금지
- 인라인 CSS만 사용 — CSS 파일/CSS-in-JS 라이브러리 없음

### 테마 상수 약어 (`src/constants/theme.js`)
- `C` — 색상 (Color): `C.bg`, `C.ac`, `C.gn`, `C.rd` 등
- `T` — 타이포그래피: `T.h1`, `T.h2`, `T.base`, `T.sm`, `T.xs`
- `S` — 간격 (Spacing): `S[1]`=4, `S[2]`=8, `S[3]`=12, `S[4]`=16, `S[6]`=24
- `I` — 아이콘: `I.layout`, `I.parser`, `I.builder`
- `TC` — 필드 타입 색상, `SC` — 상태 색상, `RC` — 레코드 타입 색상

### 공통 컴포넌트 (`src/components/common.jsx`)
- `B` — Badge, `Btn` — Button (3단계: primary/secondary/ghost)
- `Chip` — 토글 태그, `Sec` — 섹션 헤더, `EmptyState` — 빈 상태
- `TextArea`, `Select`, `ActionMenu` — 입력/메뉴 컴포넌트

### 네이밍
- 이벤트 핸들러: `handle*` (handleSave, handleDelete 등)
- UI 라벨: 한국어

### 도메인 용어
- 레코드 타입: HEADER, DATA, TRAILER, SINGLE
- 필드 타입: A (alpha), AN (alphanumeric), N (numeric), H (hangul), HAN (mixed)
- 인코딩: EUC-KR, CP949, UTF-8

## UI 디자인 원칙

### 상태 표현
- 색상, 테두리, 배경으로 상태를 전달 — 유니코드/이모지 아이콘 의존 최소화
- 섹션 헤더 아이콘(장식적 목적)은 허용, 상태 아이콘은 시각적 요소로 대체
- **Exception-based signaling**: 정상은 표시하지 않음, 이상(에러/경고)만 표시

### 시각적 코딩
- `borderLeft` — 입력 완성도 전용 (green=완성, orange=미완성)
- 배경 틴트 — 비즈니스 상태 (예: `C.rdD` = 불능/비활성)

## 파일 정리 규칙
- 미사용 export 유지 금지
- 삭제된 기능의 상수/아이콘은 즉시 제거

## 작업리스트 관리
- `docs/WORK_LIST.md`가 프로젝트의 공식 작업리스트
- 모든 작업은 이 리스트를 기준으로 진행
- 작업 완료/변경 시 WORK_LIST.md를 반드시 최신화
- 새 작업 추가 시에도 WORK_LIST.md에 기록

## Git 워크플로우
- 기능 추가/삭제/수정은 feature 브랜치 단위로 진행
- 브랜치 네이밍: `feat/`, `fix/`, `refactor/`, `chore/` 등 conventional prefix
- 작업 완료 후 main 머지 전 사용자 확인 필수

## 작업 방식
- 한국어로 소통
- 리팩토링 전 영향 분석 필수
- **서브에이전트 교차 검증**: 설계/리팩토링/UI 변경 시 3인 역할로 검토
  - 기획자: 사용자 관점 요구사항 정합성, 예외 케이스
  - 디자이너: 시각적 일관성, 접근성, 사용성
  - 프론트엔드 개발자: 구현 가능성, 기존 코드 영향, 성능
  - 3인 검토 결과를 종합하여 최종 계획 수립

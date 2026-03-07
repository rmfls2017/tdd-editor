# TDD Editor — Telegram Definition Document Editor

금융권 전문(Telegram) 레이아웃을 JSON 정의서(TDD)로 관리하고 시각화하는 웹 에디터입니다.

## Quick Start

```bash
npm install
npm run dev
```

## 핵심 개념

하나의 TDD JSON이 **전문 레이아웃, 유효성 검사 규칙, 테스트 케이스**를 포함합니다.
코드 변경 없이 JSON만 추가/수정하면 새로운 전문 유형을 처리할 수 있는 **메타데이터 기반** 구조입니다.

## 화면 구성

| 영역 | 기능 |
|------|------|
| **사이드바** | TDD Registry — 카테고리별 전문 목록, 검색, 상태/버전 표시, CreateWizard (생성/편집/복제) |
| **Layout** | Record별 탭 분리, 바이트맵 시각화, 필드 테이블 + 누적 길이, 필드 상세 패널 (읽기 전용) |
| **Parser** | 전문 텍스트 → 필드별 파싱, 인코딩 선택 (EUC-KR/CP949/UTF-8), 유효성 검사, 탭 전환 시 상태 유지 |
| **Builder** | DATA 레코드 CRUD, 전문 생성/미리보기/다운로드/클립보드 복사, 응답 TDD 지원 (요청 전문 임포트, 에러코드 드롭다운) |

## 데이터 모델

```
TDD Definition
├── protocol          { type: FILE_BATCH|TCP_SOCKET, encoding: EUC-KR }
├── layout
│   └── records[]     각 record마다 독립적인 length
│       └── fields[]  { offset, length, type, pad, fixedValue, sourceRef }
├── validationRules[] ERROR | WARNING level
└── testCases[]       assertion 기반
```

## 설계 원칙

- **유연성**: 레코드 길이는 record별 독립, 레코드 타입도 고정이 아님 (SINGLE 등)
- **하드코딩 최소화**: 모든 UI가 정의서 데이터에서 동적 생성
- **코드 무변경 배포**: JSON 정의서만 추가하면 새 전문 처리 가능

## 샘플 정의서

| Code | Name | Status | Protocol |
|------|------|--------|----------|
| EB11 | 출금이체신청 (은행접수) | ACTIVE | FILE_BATCH |
| EB12 | 결과통보 (은행접수) | ACTIVE | FILE_BATCH |
| EB13 | 출금이체신청 (기관접수) | ACTIVE | FILE_BATCH |
| EB14 | 결과통보 (기관접수) | ACTIVE | FILE_BATCH |
| EB21 | 자금이체 | DRAFT | FILE_BATCH |
| EC21 | 실시간 출금 | DRAFT | TCP_SOCKET |

## Tech Stack

- React 18 + Vite 5
- Inline CSS (외부 CSS 의존성 없음)

## 장기 로드맵 (보류)

- [ ] Layout 탭 필드 편집 기능 (추가/수정/삭제)
- [ ] DRAFT TDD 완성 (EB21 자금이체, EC21 실시간 출금)
- [ ] Record & Replay (프로덕션 장애 재현)
- [ ] Echo Server (은행 모의 서버)
- [ ] JSON Schema 검증 + DB 저장 + 엔진 hot reload
- [ ] 통합 테이블 뷰 (의사소통용 텍스트 복사)

## License

MIT

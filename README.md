# TDD Editor — Telegram Definition Document Editor

금융권 전문(Telegram) 레이아웃을 JSON 정의서(TDD)로 관리하고 시각화하는 웹 에디터입니다.

## Quick Start

```bash
npm install
npm run dev
```

## 핵심 개념

하나의 TDD JSON이 **전문 레이아웃, 변환 규칙, 데이터소스, 파이프라인, 테스트 케이스**를 모두 포함합니다.  
코드 변경 없이 JSON만 추가/수정하면 새로운 전문 유형을 처리할 수 있는 **메타데이터 기반 런타임 엔진**을 목표합니다.

## 화면 구성

| 영역 | 기능 |
|------|------|
| **사이드바** | TDD Registry — 카테고리별 전문 목록, 검색, 상태/버전 표시 |
| **Layout** | Record별 탭 분리, 바이트맵 시각화, 필드 테이블 + 누적 길이, 필드 추가/수정/삭제 |
| **Transform** | 변환 규칙 뷰어 + 즉석 테스트 실행기, 참조 필드 추적 |
| **DataSource** | SQL 구문 강조, 파라미터 바인딩, Stub 시나리오 전환 |
| **Pipeline** | 실행 흐름 시각화, DryRun 애니메이션, Validation Rules, Test Cases |

## 데이터 모델

```
TDD Definition
├── protocol          { type: FILE_BATCH|TCP_SOCKET, encoding: EUC-KR }
├── layout
│   └── records[]     각 record마다 독립적인 length
│       └── fields[]  { offset, length, type, pad, fixedValue, sourceRef, transformRef }
├── transforms[]      MAPPING_TABLE | EXPRESSION | DATE_FORMAT | FUNCTION
├── dataSources[]     DB_QUERY + params[] + stub.scenarios{}
├── pipeline.steps[]  FETCH_DATA → COMPUTE → VALIDATE → TRANSFORM_ALL → BUILD → OUTPUT
├── validationRules[] ERROR | WARNING level
└── testCases[]       DryRun assertion 기반
```

## 설계 원칙

- **유연성**: 레코드 길이는 record별 독립, 레코드 타입도 고정이 아님 (SINGLE 등)
- **하드코딩 최소화**: 모든 UI가 정의서 데이터에서 동적 생성
- **코드 무변경 배포**: JSON 정의서만 추가하면 새 전문 처리 가능

## 샘플 정의서

| Code | Name | Status | Protocol | Records |
|------|------|--------|----------|---------|
| EB13 | 출금이체신청 | ACTIVE | FILE_BATCH | H:120B + D:120B + T:120B |
| EB14 | 결과통보 | ACTIVE | FILE_BATCH | H:100B + D:150B + T:80B |
| EB21 | 자금이체 | DRAFT | FILE_BATCH | H:200B + D:300B + T:100B |
| EC21 | 실시간 출금 | DRAFT | TCP_SOCKET | SINGLE:500B |

## Tech Stack

- React 18 + Vite 5
- Inline CSS (외부 CSS 의존성 없음)

## 추후 구현 예정

- [ ] Transform / DataSource / Pipeline 편집 기능
- [ ] DryRun Results 탭 (Step Trace, HEX diff)
- [ ] Record & Replay (프로덕션 장애 재현)
- [ ] Echo Server (은행 모의 서버)
- [ ] JSON Schema 검증 + DB 저장 + 엔진 hot reload
- [ ] 통합 테이블 뷰 (의사소통용 텍스트 복사)

## License

MIT

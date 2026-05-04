# 다비치 재무팀 분석 툴

엑셀 재무 데이터를 업로드해 월별·연도별 비용 증감을 자동으로 분석하고, 신규/소멸 항목과 주요 변동 사항을 PDF·PPTX 보고서로 출력하는 React + Vite SPA.

## 주요 기능

- **두 가지 비교 모드**
  - **월별 비교** (`MODE_MONTHLY`): 한 시트 내에서 월/기간 단위 비교
  - **시트별 비교** (`MODE_SHEET`): 시트마다 다른 연도 데이터를 담은 파일에서 연도 간 비교
- **컬럼 자동 감지**: 날짜·차변/대변·금액·계정과목·적요·거래처 컬럼을 헤더 키워드로 추론 후 사용자 수정 가능
- **암호 걸린 xlsx 지원**: Vercel Python serverless(`/api/decrypt`)에서 `msoffcrypto-tool`로 복호화
- **분석 리포트**: 카테고리/거래처별 증감, 신규·소멸 항목, 차트(막대/파이), 정렬/검색 가능한 상세 테이블
- **내보내기**: 한글 폰트가 임베드된 PDF, 다중 슬라이드 PPTX

## 개발

```bash
npm install
npm run dev      # 개발 서버 (Vite, http://localhost:5173)
npm run lint     # ESLint
npm run build    # 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

## 디렉터리 구조

```
src/
├── App.jsx                    # 단계별(Landing→Upload→Mapping→Select→Result) 흐름 제어
├── components/                # UI 컴포넌트
├── utils/excel/
│   ├── parser.js              # 엑셀 읽기, 날짜·금액 정규화
│   ├── detector.js            # 컬럼 자동 감지
│   └── analyzer.js            # 비교/집계 로직
├── utils/exportPdf.js         # jsPDF + 한글 폰트(NanumGothic) PDF 생성
├── utils/exportPptx.js        # PptxGenJS PPTX 생성
├── services/decryptService.js # /api/decrypt 호출
├── hooks/useWindowSize.js     # matchMedia 기반 모바일 분기
└── constants/                 # 단계/모드 상수, 기본값, 색상

api/decrypt.py                 # Vercel Python: 암호 걸린 xlsx 복호화
```

## 데이터 처리 메모

- 엑셀 일련번호와 ISO 형식 날짜를 모두 UTC 자정으로 정규화하여 월 키 분류 시 타임존 어긋남이 없도록 처리합니다.
- 날짜 파싱이 실패한 행은 `skippedRowCount`로 집계되어 결과 화면에 표시됩니다 (원본 엑셀 합계와의 차이 설명용).
- 한국 회계 표기인 △/▲ 음수 마커와 괄호 음수 표기 `(1,000)`을 모두 인식합니다.

## 배포

Vercel에 정적 빌드 + Python serverless function으로 배포되며, `vercel.json`에서 `/api/*` 라우팅과 SPA fallback을 설정합니다.

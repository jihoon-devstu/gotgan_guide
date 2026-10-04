# 곳간(GOTGAN) 프로젝트 문서 사이트

곳간 멀티 스토어 오픈마켓 MSA 프로젝트의 문서를 파트별로 찾아볼 수 있게 묶은 React 사이트입니다.

| 문서 | 경로 | 답하는 질문 |
|---|---|---|
| 가이드라인 | `/guideline` | 왜 — 설계 배경과 결정 이유 |
| 스펙 상세 | `/spec` | 무엇을 — 요구사항 · 파트별 스펙 · 파일 구조 |
| 컨벤션 | `/convention` | 어떻게 — 코드 · DB · 프론트 · 인프라 규칙 |

홈(`/`)에는 배포된 **목업 화면**(https://mockup-page-sable.vercel.app/) 영역별 바로가기가 있고, **파트별로 보기**에서 백엔드 · 프론트엔드 · AWS · CI/CD · Logging · 요구사항 · 일정/회의를 고르면 세 문서에서 봐야 할 장만 모아 보여 줍니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/
```

## 구조

```
content/                    문서 원본 — 사이트는 이 파일을 그대로 읽어 보여 줌
├── project-guideline.html
├── project-spec.html
├── project-convention.md   컨벤션 원본 (수정은 여기서)
└── project-convention.html npm run convention 으로 MD에서 생성
scripts/
├── md2html.mjs             컨벤션 MD → HTML 변환
└── conv-template.html      변환 HTML 틀
src/
├── docs.js                 문서 등록 · 파트별 바로가기 목록
├── pages/                  HomePage · DocPage
├── components/             TopNav · Toc · ThemeToggle
├── lib/                    parseDoc(본문 · 목차 추출) · enhanceSpec(스펙 우선순위 필터)
└── styles/                 base(디자인 토큰) · shell(레이아웃) · doc-guideline · doc-spec
vercel.json                 SPA 새로고침 404 방지 rewrite
```

## 문서 수정 방법

1. `content/`의 HTML(가이드라인 · 스펙) 또는 `content/project-convention.md`(컨벤션)를 수정
2. 컨벤션을 고쳤다면 `npm run convention`으로 HTML 재생성
3. 새 장을 추가했다면 원본 HTML의 `nav.toc`에도 항목 추가 (사이트 왼쪽 목차가 여기서 만들어짐)
4. 파트별 바로가기에 넣으려면 `src/docs.js`의 `PARTS`에 `[문서, 앵커 id, 장 번호, 제목, 설명]` 추가
5. PR → main 머지 → Vercel 자동 배포

## 배포 (Vercel)

- Framework Preset: Vite · Build Command: `npm run build` · Output: `dist`
- 저장소 루트가 이 폴더이면 Root Directory 설정 불필요

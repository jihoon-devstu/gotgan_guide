import guidelineRaw from '../content/project-guideline.html?raw';
import specRaw from '../content/project-spec.html?raw';
import conventionRaw from '../content/project-convention.html?raw';
import { enhanceSpec } from './lib/enhanceSpec';

// 문서 등록부. 순서 = 상단 메뉴 순서 = 권장 읽는 순서
export const DOCS = [
  {
    slug: 'guideline',
    name: '가이드라인',
    question: '왜',
    summary: '설계 배경과 결정 이유',
    points: ['서비스 분할 · 업무 분장 판단 자료', 'AWS · DB · Saga · 결제 · 인증 결정', '6주 일정 · 회의 안건 · 위험 요소'],
    scope: 'doc-g',
    raw: guidelineRaw,
  },
  {
    slug: 'spec',
    name: '스펙 상세',
    question: '무엇을',
    summary: '요구사항 · 파트별 스펙 · 파일 구조',
    points: ['최종 아키텍처', '파트별 스펙 · 전체 파일 역할', '도메인별 요구사항 103건 · 우선순위'],
    scope: 'doc-s',
    raw: specRaw,
    enhance: enhanceSpec,
  },
  {
    slug: 'convention',
    name: '컨벤션',
    question: '어떻게',
    summary: '코드 · DB · 프론트 · 인프라 규칙',
    points: ['확정 컨벤션 요약 8개', '백엔드 · DB · 프론트 규칙', '리뷰 체크리스트'],
    scope: 'doc-s doc-c',
    raw: conventionRaw,
  },
];

export const MOCKUP_URL = 'https://mockup-page-sable.vercel.app/';

// 목업 화면 영역별 시작 경로 (MockupPage README "사용자별 진입 경로")
export const MOCKUP_AREAS = [
  { name: '쇼핑몰', path: '/', who: '구매자', desc: '메인 · 상품 목록/상세 · 스토어 · 장바구니 · 주문서 · 입점 신청' },
  { name: '마이페이지', path: '/mypage/orders', who: '구매자', desc: '주문/배송 · 클레임 · 리뷰 · 회원정보 · 배송지' },
  { name: '판매자센터', path: '/seller', who: '판매자', desc: '대시보드 · 상품 · 주문 · 클레임 · 정산 · 스토어 설정' },
  { name: '관리자', path: '/admin', who: '스토어 관리자', desc: '대시보드 · 입점 심사 · 스토어 · 정산 · 회원 · 카테고리' },
];
export const mockupUrl = (path) => new URL(path, MOCKUP_URL).href;

// 파트별 바로가기: [문서 slug, 앵커 id, 장 번호, 제목, 설명]
export const PARTS = [
  {
    key: 'backend',
    name: '백엔드',
    desc: 'Spring Boot 서비스 6개 · DB · Saga · 인증',
    links: [
      ['spec', 'p-be', '2-1', '백엔드 스펙', '스택 · 서비스 구성 · 공통 규칙 · 패키지 구조'],
      ['spec', 'f-svc', '03-2', 'services/ 파일 역할', '빌드 파일 · Java 패키지 · resources · 테스트'],
      ['convention', 'c2', '02', '백엔드 컨벤션', '네이밍 · API 규격 · 예외 · 트랜잭션 · MSA 규칙'],
      ['convention', 'c3', '03', 'DB 컨벤션', '테이블 · 컬럼 · 시간 · 제약조건 · Flyway'],
      ['guideline', 's5', '06', '서비스별 DB · Flyway · Saga', '스키마 예시 · Saga 오케스트레이터 코드'],
      ['guideline', 's-pay', '07', '포트원 결제 연동', '결제 흐름 · 서버 검증 · 취소'],
      ['guideline', 's6', '08', '인증 · 인가', '게이트웨이 JWT · 역할 · 토큰 쿠키'],
      ['guideline', 's8', '10', 'EDA · 스케줄러', '이벤트 목록 · ShedLock · 멱등'],
      ['guideline', 's-backend', '15', '백엔드 구조 · 저장소 폴더', 'build.gradle · Dockerfile · YAML 예시'],
    ],
  },
  {
    key: 'frontend',
    name: '프론트엔드',
    desc: 'React · TanStack Query/Table · Zustand · Vercel',
    mockup: true, // 파트 패널에 목업 화면 바로가기 표시
    links: [
      ['spec', 'p-fe', '2-2', '프론트엔드 스펙', '스택 · 화면 영역 · 규칙 · 폴더 구조'],
      ['spec', 'f-fe', '03-3', 'frontend/ 파일 역할', '설정 파일 · src 하위 역할'],
      ['convention', 'c4', '04', '프론트엔드 컨벤션', '구조 · 인증 · TanStack Query · Table 규칙'],
      ['guideline', 's12', '14', '프론트엔드 가이드', '상태 관리 기준 · 폴더 · 배포'],
      ['guideline', 's-domain', '05', '서빙 도메인', 'Vercel rewrite · 같은 출처 구성'],
      ['spec', 'd-ord', 'ORD', '장바구니 · 주문 · 결제 요구사항', '포트원 결제창 흐름 포함'],
    ],
  },
  {
    key: 'aws',
    name: 'AWS',
    desc: 'Terraform · EKS · S3 · SNS/SQS · 서버리스',
    links: [
      ['spec', 'p-aws', '2-3', 'AWS · 서버리스 스펙', '자원 목록 · IRSA · Lambda 3종'],
      ['spec', 'f-tf', '03-4', 'infra/terraform/ 파일 역할', '폴더별 .tf · apply 순서'],
      ['convention', 'c5', '05', '인프라 · 배포 네이밍', 'AWS · Terraform · K8s 이름 규칙'],
      ['guideline', 's4', '04', 'AWS 인프라 · EC2 사이징', '노드 크기 · 비용 · 팀원 접근'],
      ['guideline', 's-domain', '05', 'DuckDNS · EIP', 'API 주소 고정 · 삭제 순서'],
      ['guideline', 's7', '09', 'Redis · DynamoDB', '활용처 · 테이블 설계'],
      ['guideline', 's9', '11', '서버리스', 'Lambda 3종 · serverless.yml'],
    ],
  },
  {
    key: 'cicd',
    name: 'CI/CD',
    desc: 'GitHub Actions · ArgoCD · Helm',
    links: [
      ['spec', 'p-cicd', '2-4', 'CI/CD 스펙', '워크플로 · 협업 규칙 · 폴더 구조'],
      ['spec', 'f-deploy', '03-5', 'deploy/ 파일 역할', 'k8s · Helm · ArgoCD YAML'],
      ['spec', 'f-sls', '03-6', 'serverless/ · .github/', '워크플로 파일별 역할'],
      ['convention', 'c1', '01', 'Git · 협업 컨벤션', '브랜치 · 커밋 · PR · 소유권'],
      ['guideline', 's10', '12', 'CI/CD 가이드', 'Actions 선택 이유 · 파이프라인 설계'],
    ],
  },
  {
    key: 'logging',
    name: 'Logging',
    desc: 'Prometheus · Loki · Grafana · Zipkin',
    links: [
      ['spec', 'p-log', '2-5', 'Logging · 관측성 스펙', '수집 방식 · 규칙 · 대시보드 · 알림'],
      ['guideline', 's11', '13', '관측성 가이드', '공통 규칙 · 진행 순서 · 실무와의 차이'],
      ['convention', 'c2-8', '2-8', '로깅 컨벤션', '레벨 기준 · 남기면 안 되는 값'],
    ],
  },
  {
    key: 'requirements',
    name: '요구사항',
    desc: '도메인별 기능 · 우선순위 · 업무 규칙',
    mockup: true,
    links: [
      ['spec', 's1', '01', '최종 아키텍처', '구성도 · 동기 호출 · 이벤트 흐름'],
      ['spec', 's3', '04', '도메인별 요구사항', '103건 · 우선순위 필터'],
      ['spec', 's4', '05', '업무 규칙', '상태 전이 · 정산 · 배송비'],
      ['spec', 's5', '06', '범위 요약', 'P0 완료 기준 E2E 시나리오'],
    ],
  },
  {
    key: 'plan',
    name: '일정 · 회의',
    desc: '6주 계획 · 회의 안건 · 사전 학습',
    links: [
      ['convention', 'c0-3', '0-3', '확정 컨벤션 요약', '회의에서 확정한 8가지'],
      ['guideline', 's15', '18', '팀 회의 안건', '결정할 것 + 추천 기본값'],
      ['guideline', 's3', '03', '업무 분장 판단 자료', '숙련도 · 난이도 · 참고안'],
      ['guideline', 's13', '16', '6주 일정 · 범위', '주차별 계획 · 완료 기준'],
      ['guideline', 's14', '17', '사전 학습', '입문 트랙 · 영역 · 도메인별 체크리스트'],
      ['guideline', 's16', '19', '위험 요소', '자주 막히는 곳'],
    ],
  },
];


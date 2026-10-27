# 곳간(GOTGAN) 코드 컨벤션

> 이 문서는 **규칙** 문서입니다. 규칙을 바꾸려면 팀 합의 후 이 문서를 수정하는 PR을 올립니다.
> 기반: 팀이 이전 프로젝트에서 쓰던 컨벤션(`convention/` 폴더 6종) + 이번 프로젝트의 MSA · AWS 구조에 맞춘 추가 규칙
> 관련 문서: `project-spec.html`(무엇을 만드나) · `project-guideline.html`(왜 이렇게 만드나)

---

## 0. 개요

### 0-1. 판단 원칙

- **"어떻게 쓰나"는 팀 기존 규칙 우선** — 코드 스타일 · 네이밍 · 응답 형식 · 예외 구조 · DB 규칙
- **"무엇을 만드나"는 프로젝트 스펙 유지** — 서비스 10개(10/27 chat 추가) + Keycloak · 엔드포인트 · 이벤트 · 인프라 구성
- **MSA 전용 규칙 추가** — 서비스 간 호출 · Resilience4j · 대시보드 조합 · 이벤트 · Saga · 멱등성 · 인프라 네이밍
- 규칙끼리 충돌하면 이 문서가 우선, 다른 문서는 이 문서에 맞춰 수정

### 0-2. 기존 컨벤션 대비 변경 사항

| 항목 | 기존(따숨) | 곳간 | 이유 |
|---|---|---|---|
| 패키지 | 도메인형, 엔티티는 `domain/` | 도메인형, 엔티티는 **`entity/`**, 서비스 호출용 **`client/`** 추가 | 팀 합의(엔티티 패키지명) · 서비스 간 HTTP 호출 |
| 보안 위치 | 각 앱 `common/security` | **게이트웨이에만** Spring Security, 업무 서비스는 공통 모듈 `libs/common-web`의 `auth`(헤더 → 사용자) | 토큰 발급은 Keycloak, JWT 검증은 게이트웨이 한 곳 |
| 로그인 사용자 | `SecurityUtil.getMemberId()` | `@CurrentUser AuthUser` (게이트웨이가 넣은 `X-User-*` 헤더) | 업무 서비스에 SecurityContext 없음 |
| FK 제약 | 참조 컬럼 FK 필수 | **같은 서비스 안에서만 FK 필수**, 다른 서비스 ID는 논리 참조 + 인덱스 | DB per Service |
| 회원 테이블 · 패키지 | `member` · `member/` | **`users` · `user/`** | 서비스(user-service) · 스키마(userdb) 이름과 일치 |
| 테이블명 예외 | 단수형 | 단수형 유지, **`orders`**(예약어 `order`) · **`users`**(키워드 `user`)만 예외 | MySQL 예약어 · 키워드 |
| 에러 코드 | 번호형 `ORDER_003` | **의미형 `ORDER_OUT_OF_STOCK`** | 코드만 봐도 의미 · 로그 검색 |
| 시드 데이터 | `db/seed` V100~ | `db/seed/R__*.sql` (반복 실행) | 내용 수정 시 체크섬 오류 없음 |
| 프론트 언어 | TypeScript | **JavaScript** (`.js` / `.jsx`) | 목업 그대로 이식 · 입문자 부담 최소화 |
| 프론트 UI 키트 | shadcn/ui · recharts · sonner | **목업 컴포넌트 · 목업 SVG 차트 · 목업 토스트** | 목업 디자인 원칙 유지 |
| 프론트 관리자 | `features/admin` 공유 도메인 | **`features/admin`** — admin-service(`/api/admin/**`)만 호출, 담당 구지훈 | 백엔드 admin-service와 1:1 대칭, 담당 = 폴더 담당 |
| 프론트 페이지 | — | `pages/{shop,mypage,seller,admin}` | 4개 화면 영역 |

### 0-3. 확정 컨벤션 요약

팀 회의에서 확정한 8가지입니다. `project-spec.html`과 다르면 이 표가 우선합니다.

| # | 항목 | 확정 규칙 | 관련 절 |
|---|---|---|---|
| 1 | API 응답 형식 | 모든 응답을 `ApiResponse<T>` 봉투 `{ code, message, data }` 하나로 | 2-4 · 2-5 |
| 2 | 시간대 | DB · JDBC · JVM 모두 Asia/Seoul, 서비스 밖으로 나가는 이벤트 시각만 오프셋 포함 | 3-5 |
| 3 | 회원 테이블 · 패키지명 | 테이블 `users`, 패키지 `user/`, 엔티티 `User` | 2-1 · 3-2 |
| 4 | 생성 · 수정 시각 관리 | DB `DEFAULT` · `ON UPDATE`로 기록, 엔티티는 `@Generated`로 읽기만 | 3-5 |
| 5 | 에러 코드 형식 | 의미형 `{도메인}_{상황}` — `ORDER_OUT_OF_STOCK` | 2-5 |
| 6 | 프론트 언어 | JavaScript (`.js` / `.jsx`) — 목업 그대로 | 4-1 |
| 7 | 프론트 페이지 위치 | `pages/{shop · mypage · seller · admin}/` — 로직은 `features/` | 4-2 |
| 8 | Redis 키 이름 | `{용도}:{식별자}` — `cart:{userId}`(캐시, 원본은 `orderdb.cart_item`) · `blacklist:{jti}`(Could). 리프레시 토큰 키는 폐지(Keycloak이 관리) | 2-2 |

### 0-4. 10/12 추가 확정

| 항목 | 확정 규칙 | 관련 절 |
|---|---|---|
| 서비스 구성 | Spring 10개(gateway · user · store · product · order · payment · review · settlement · admin · chat — chat 은 10/27 추가) + Keycloak | 2-1 · 3-2 |
| admin-service | 조합 계층 — 관리자 API 진입점, 각 서비스 `/internal/**`을 호출해 조합. 자기 DB는 신고 · 조치 이력(admindb, ADR-0001 예외 10/26)만 · 실시간 알림 센터(10/27) | 2-1 · 2-4 · 2-7 |
| 카테고리 · 수수료 | 카테고리는 product-service, 카테고리별 수수료는 settlement-service | 2-1 · 3-2 |
| 대시보드 | 판매자는 store, 관리자는 admin 안에서 조합 — 병렬 호출 + 실패 영역만 빼고 부분 응답 | 2-7 |
| 서비스 간 호출 | Resilience4j 표준 (타임아웃 · 서킷 브레이커 · 멱등 GET만 재시도 · 폴백) | 2-7 |
| 동적 검색 | QueryDSL | 2-6 |
| XSS | 사용자 입력 HTML은 OWASP Java HTML Sanitizer로 저장 전 정화 | 2-6 |
| 코드 품질 | SonarQube Cloud — main 대상 PR에 품질 게이트 | 1-3 |
| (10/13) 저장소 3개 | `gotgan-backend`(services · serverless · docker-compose · docs/api) · `gotgan-frontend`(React 루트) · `gotgan-config`(deploy · infra/terraform · scripts · docs). 모노레포 폐지. 각 저장소 `docs/CONVENTION.md`는 이 문서의 발췌본(자동 생성) — 이 문서만 고친다 | 1-4 · 5-5 |
| (10/13) 시크릿 | **GitHub Secrets 단일 소스**(클러스터 · CI) · Vercel 환경 변수(프론트). Secrets Manager · KMS · ESO 없음. `secrets-sync` 워크플로가 K8s Secret 생성 | 1-5 · 5-3 |
| (10/13) 인프라 일일 스케줄 | `infra/terraform/cluster/`는 `infra-schedule` 워크플로가 매일 KST 08:00 apply(→ `bootstrap`) · 22:00 destroy. 나머지 폴더는 상시. apply/destroy는 워크플로 또는 구지훈 | 5-2 |
| (10/13) Redis 폴백 | 장바구니 원본은 MySQL `orderdb.cart_item`, Redis `cart:{userId}`는 캐시. Redis 호출은 서킷 인스턴스 `redisCart` + 폴백(MySQL) | 2-2 · 2-7 · 3-2 |
| (10/13 3차) 3티어(db 노드 분리 · NetworkPolicy) | 프론트(Vercel) → 백(EKS `app` 노드 그룹 t3.xlarge ×2 — 10/14 t3.large에서 조정) → DB(EKS `db` 노드 그룹 t3.medium ×1, 테인트 `tier=db:NoSchedule`, MySQL · Redis만). `02-networkpolicy.yaml`로 DB 3306 · 6379는 `tier=backend` 파드만. blackbox exporter 없음. 파일 업로드만 presigned URL로 브라우저 → S3 직접(예외) | 5-3 |

---

## 1. 공통 — Git · 협업

### 1-1. 브랜치

- `main` — 보호 브랜치. 직접 push 금지, PR + 승인 1명 + CI 통과 후 Squash merge
- 작업 브랜치: `feat/{도메인}-{작업}` (예: `feat/order-payment-verify`, `feat/infra-eks-cluster`)
- 그 외: `fix/` · `refactor/` · `docs/` · `chore/`(빌드 · 설정)
- 도메인 값: `auth` `user` `store` `product` `order` `payment` `review` `settlement` `admin` `chat`(10/27) `gateway` `front`(프론트 공통) `infra`(Keycloak 설정 포함, 예: `feat/infra-keycloak-realm`) `cicd` `obs`(관측성) `sls`(서버리스)

### 1-2. 커밋 메시지

- Conventional Commits: `{type}({scope}): {요약}`
- type: `feat` `fix` `refactor` `docs` `test` `chore` `ci` `infra`
- scope: 서비스 · 영역 이름 (`order` `gateway` `front` `terraform` `helm` …)
- 요약은 한국어 명사형 종결, 50자 이내
- 예: `feat(order): 포트원 결제 검증 API` · `fix(front): 장바구니 무료배송 금액 계산` · `infra(terraform): NLB용 EIP 추가`

### 1-3. 이슈 · PR

- 이슈 제목: `[요구사항 ID] 작업` — 예: `[ORD-06] 결제 검증`
- PR 제목: 커밋 메시지 형식과 동일
- PR 본문 템플릿:
  - 개요 — 관련 요구사항 ID · 이슈 링크
  - 작업 내용 — 변경 사항 개조식
  - 테스트 — 확인 방법 (curl · 화면 · 테스트 코드)
  - 팀원 확인 사항 — 다른 팀원이 알아야 할 것
- **프론트 · 다른 서비스에 영향 있는 변경(응답 형식 · 에러 코드 · 이벤트 payload · API 경로)은 PR 제목에 `[영향]` 표시**, 영향받는 담당자 리뷰 필수
- PR 하나에 기능 하나, 변경 300줄 이하 권장
- main 대상 PR은 CI에서 **SonarQube Cloud 품질 게이트**를 통과해야 머지 (이슈는 PR 코멘트로 확인)

### 1-4. 폴더 소유권

- **다른 사람이 맡은 서비스 · `features/` 폴더는 PR 없이 수정 금지.** 연동이 필요하면 이슈로 요청
- 공유 파일(frontend `shared/api/queryKeys.js` · `app/router.jsx`, gotgan-config `deploy/k8s/01-configmap.yaml` · `deploy/helm/sesac-gojigi-app/values.yaml`)은 **도메인별 주석 구획 안에서만** 수정. `values.yaml`의 `tag` 줄은 backend CI만 커밋
- CODEOWNERS로 리뷰어 자동 지정

### 1-5. 시크릿

- `application.yml` · `.env` · YAML에 실제 비밀 값 커밋 금지 — `${환경변수}` 자리표시자만
- 비밀 값 위치: **GitHub Secrets**(클러스터 · CI — gotgan-config · gotgan-backend) · Vercel 환경 변수(프론트). Secrets Manager · KMS · ESO는 쓰지 않음
- 클러스터 시크릿은 gotgan-config의 `secrets-sync` 워크플로가 GitHub Secrets → K8s Secret으로 생성. Secret YAML 파일을 만들지 않음. 이름 · 용도는 `gotgan-config/docs/secrets.md`(값 없음), 값은 노션(팀 비공개)
- 비밀 아닌 값은 GitHub Variables(`AWS_ACCOUNT_ID` · `AWS_REGION` · `EKS_CLUSTER_NAME`)
- 로컬은 `.env.local`(커밋 금지) 또는 docker-compose 기본값(`local-pass`). realm JSON · YAML에는 `${변수}` 자리표시자만
- 실수로 커밋했다면 즉시 팀 공유 → 키 폐기 · 재발급 (히스토리 삭제만으로는 부족)

---

## 2. 백엔드

### 2-1. 패키지 구조

도메인형 구조. 최상위를 계층(controller/service …)으로 나누지 않습니다.

```
com.sesac.gojigi.{service}            # service = gateway · user · store · product · order · payment · review · settlement · admin · chat
├── {Service}Application.java
├── common                           # 이 서비스 안에서만 쓰는 공통 (응답 봉투 · 예외 · 인증은 libs/common-web — 아래)
│   ├── config                       # @Configuration — Redis · RestClient · Resilience4j · QueryDSL · Scheduling(ShedLock) · WebMvc · Swagger · AWS
│   ├── event                        # EventEnvelope · SnsEventPublisher · ProcessedEvent (이벤트를 쓰는 서비스만)
│   ├── entity                       # BaseTimeEntity
│   └── util                         # 두 도메인 이상이 쓰는 유틸
└── {domain}
    ├── controller
    ├── service
    ├── repository
    ├── entity                       # JPA 엔티티 · Enum
    ├── dto
    │   ├── request                  # XxxRequest
    │   └── response                 # XxxResponse
    ├── exception                    # {Domain}Exception · {Domain}ErrorCode
    ├── client                       # 다른 서비스 · 포트원 호출 (@HttpExchange)
    └── util                         # 이 도메인 전용 유틸
```

- 해당 도메인에 필요 없는 패키지는 만들지 않음 (예: `cart`는 `entity` 없음)
- **공통 모듈 `libs/common-web`**(Gradle composite build) — 응답 봉투(`ApiResponse` · `PageResponse`) · 예외(`ErrorCode` · `CommonErrorCode` · `BusinessException` · `GlobalExceptionHandler`, 404 · 405 포함) · `@CurrentUser` · `AuthUser` · 로그 MDC `userId` 필터 · `/actuator` 트레이스 제외. 서비스마다 복사하지 않고 `com.sesac.gojigi.common.web.*`를 import. 서블릿 전용이라 gateway 제외, 10개 중 8개 적용(review는 아직 미이관, chat은 10/27 처음부터 적용)
- 도메인 에러 코드는 각 서비스 `{domain}/exception/{Domain}ErrorCode implements ErrorCode`
- **DB가 없는(거의 없는) 서비스 두 곳**
  - gateway-service: `config` · `filter` · `exception`만
  - admin-service: 도메인 패키지에 `controller` · `service` · `client` · `dto`만 — **`entity` · `repository` 없음**, 데이터는 각 서비스 `/internal/**` 호출로만 다룸. 예외는 `report`(신고 · 조치 이력 — admindb entity · repository · Flyway, ADR-0001 예외 10/26) · `notification`(알림함 — DynamoDB `sesac-gojigi-inbox` repository, 10/27)뿐

**서비스별 도메인**

| 서비스 | DB | 도메인 패키지 |
|---|---|---|
| gateway-service | 없음 | — (`config` · `filter` · `exception`) |
| user-service | userdb | `auth`(가입 · 로그인 · refresh · 로그아웃 — Keycloak 대리 호출) · `user`(회원 프로필 · 등급) · `address`(배송지) · `point`(적립 · 사용 · 환원) |
| store-service | storedb | `apply`(입점 신청 · 심사 · 서류) · `store`(상태 · 배송정책) · `dashboard`(판매자 대시보드 조합) |
| product-service | productdb | `category`(상위/하위) · `product`(QueryDSL 검색 포함) · `option` · `stock`(예약 · 해제) · `image` |
| order-service | orderdb | `cart` · `order` · `claim`(취소 · 반품 · 교환) · `saga` |
| payment-service | paymentdb | `payment`(포트원 V2 검증 · 취소 · 웹훅) |
| review-service | reviewdb | `review`(사진 · 별점 · 판매자 답글) · `inquiry`(상품문의 · 답변) · `eligibility`(리뷰 작성 자격) |
| settlement-service | settlementdb | `settlement`(적재 · 집계 · 지급 · 보류) · `commission`(카테고리별 수수료) |
| admin-service | admindb(신고만) | `application` · `store` · `category` · `settlement` · `user` · `dashboard` · `review` — `/internal/**` 호출 조합, `report`(신고 · 조치 이력, 10/26) · `notification`(알림 센터 — SQS 3큐 · 알림함 · SSE, 10/27) |
| chat-service (10/27) | chatdb | `room`(방 · 메시지 · 읽음 — 스토어 톡 · 판매자 운영 상담 · 고객센터 상담) · `realtime`(STOMP · Redis 중계 · 접속 중 · 입력 중 · 속도 제한) · `directory`(이름 조회 — user · store `/internal/**`) · `retention`(90일 뒤 삭제) |

**도메인 경계 기준**

- "어느 서비스에서 예외를 throw 하는가"가 그 코드의 소속 도메인
- 엔티티는 리소스를 소유한 도메인에 둠. 같은 서비스 안 **단방향 의존**(예: `auth → user`)은 허용, 역방향 금지
- 다른 도메인의 repository를 직접 쓰지 않고 그 도메인의 service를 호출

**유틸 위치**

- 사용처가 한 도메인 → `{domain}/util`
- 두 도메인 이상에서 쓰이는 시점에 `common/util`로 승격. 미리 옮기지 않음

### 2-2. 네이밍

**클래스 접미사**

| 종류 | 규칙 | 예시 |
|---|---|---|
| 컨트롤러 | 구매자 · 공개 `{X}Controller` / 판매자 `Seller{X}Controller` / 관리자 `Admin{X}Controller`(**admin-service에만**) / 내부 `Internal{X}Controller` | `OrderController` · `SellerOrderItemController` · `AdminApplicationController` · `InternalStockController` |
| 서비스 | `{X}Service` · Saga `{행위}Saga` · 스케줄러 `{행위}Scheduler` | `PaymentService` · `PlaceOrderSaga` · `AutoConfirmScheduler` |
| 레포지토리 | `{Entity}Repository` · Redis `{X}RedisRepository` | `OrderItemRepository` · `CartRedisRepository` |
| 클라이언트 | `{대상}Client` | `ProductClient` · `PaymentClient` · `PortOneClient` |
| 이벤트 리스너 | `{이벤트}Listener` | `StoreApprovedListener` |
| 설정 | `{대상}Config` | `RestClientConfig` · `WebMvcConfig` |

- 관리자 컨트롤러 `Admin{X}Controller`는 **admin-service 안에만** 둡니다. 도메인 서비스는 관리자 기능을 `Internal{X}Controller`(`/internal/**`)로 노출하고, admin-service가 이를 호출 (예: store `InternalApplicationController` ← admin `AdminApplicationController`)

**DTO**

| 종류 | 규칙 | 예시 |
|---|---|---|
| 요청 | `{행위/대상}Request` | `SignupRequest` · `OrderCreateRequest` · `ShipRequest` |
| 응답 | `{행위/대상}Response` | `LoginResponse` · `OrderPrepareResponse` |
| 내부 API | 같은 규칙, `dto/request` · `dto/response`에 둠 | `StockReserveRequest` |
| 이벤트 payload | `{이벤트}Payload` | `OrderPaidPayload` |
| Entity → DTO | 정적 팩토리 `from(entity)` | `OrderDetailResponse.from(order)` |
| DTO → Entity | 인스턴스 메서드 `toEntity(...)` | `request.toEntity(passwordEncoder)` |

- **DTO는 `record`로 작성**합니다. 불변 · 간결하고 `@Valid`와 Jackson이 모두 지원
- 필드가 많아 생성이 복잡한 응답만 `@Getter` + `@Builder` 클래스 허용, 이때도 `from()` 사용
- `@Setter` 금지

**서비스 메서드**

| 동사 | 의미 | 예시 |
|---|---|---|
| `get{X}` | 조회 — 없으면 예외 throw | `getOrder(orderNo)` → `ORDER_NOT_FOUND` |
| `find{X}` | 조회 — 없을 수 있음, `Optional` 반환 | `findDefaultAddress(userId)` |
| `create` / `update` / `delete` | 생성 / 수정 / 삭제 | `updateShippingPolicy(...)` |
| 업무 동사 | 비즈니스 의미가 분명하면 우선 | `signup` · `approve` · `reject` · `confirmPurchase` · `reserveStock` · `aggregateWeekly` |

- CRUD 동사보다 **비즈니스 언어** 우선 (`createStore`보다 `approve`)
- boolean: `is` / `exists` / `has` 접두사 (`existsByEmail`, `isOwnedBy(storeId)`)
- 활성 / 전체 조회 구분은 이름으로 (`getProduct` vs `getProductIncludingDeleted`)

**엔티티**

- `@NoArgsConstructor(access = AccessLevel.PROTECTED)` + `@Builder` 생성자. **`@Setter` 전면 금지**
- 상태 변경은 의미 있는 이름의 메서드로만 — `orderItem.ship(courier, trackingNo)` · `application.approve()` · `product.softDelete()`
- 상태 전이 규칙은 엔티티 안에서 검증하고, 허용되지 않으면 도메인 예외 throw
- 생성 · 수정 시각이 필요한 엔티티는 `BaseTimeEntity` 상속 (3-5)
- Enum은 `@Enumerated(EnumType.STRING)`

**상수 · Redis 키**

- 매직 넘버 · 문자열은 `private static final` 상수 + 이유 주석
  - `PAYMENT_TIMEOUT = Duration.ofMinutes(15); // 결제창 이탈 시 재고를 묶어두는 최대 시간`
- 운영 · 데모에서 바뀌는 값(자동 구매확정 기간 등)은 상수가 아니라 `application.yml` 설정값
- Redis 키: `{용도}:{식별자}` · 키 생성은 private 메서드로 모음

| 키 | 서비스 | 용도 |
|---|---|---|
| `cart:{userId}` | order | 장바구니 Hash — **캐시**, 원본은 MySQL `orderdb.cart_item`. 쓰기는 MySQL 먼저 → Redis 갱신(실패 무시 · WARN), 읽기는 Redis → 미스 · 장애 시 MySQL. 서킷 인스턴스 `redisCart` (Must) |
| `blacklist:{jti}` | gateway | 로그아웃한 Access Token 즉시 무효화 — Redis 전용, 원본 없음 (Could) |
| `blocked:user:{userId}` | user (쓰기) · gateway · chat (읽기) | 탈퇴 · 이용정지 회원의 남은 토큰 차단 — 게이트웨이 요청 거절, chat 은 WebSocket CONNECT 거절. Redis 장애면 확인 없이 통과(fail-open) |
| `chat:room:{roomId}` | chat | 1:1 채팅 파드 간 중계 Pub/Sub 채널 — 파드당 패턴 구독 `chat:room:*` 1개 (10/27) |
| `chat:presence:{roomId}` | chat | 접속 중 표시 ZSET — 점수 = 만료 시각(20초마다 연장 · 60초 TTL), 보고 있는 쪽엔 알림을 보내지 않음 (10/27) |
| `notify:{받는 쪽}` | admin | 알림 센터 실시간 Pub/Sub 채널(`USER#{id}` · `STORE#{id}` · `ADMIN`) — 모든 파드가 자기 SSE 연결에 전달 (10/27) |

- 한 Redis를 여러 서비스가 공유하므로 **다른 서비스의 키 접두어 사용 금지**
- 리프레시 토큰은 Keycloak이 관리 — Redis에 `refresh:` 키를 만들지 않음. 상품 캐시 키도 없음
- 새 키가 필요하면 이 표에 먼저 추가 (PR `[영향]`)

### 2-3. 문법 스타일

**삼항 연산자** — 한 줄로 읽히는 기본값 대입 · 단순 분기에만 허용, 중첩 금지

```java
// 허용
String message = fieldError != null ? fieldError.getDefaultMessage() : "입력값이 올바르지 않습니다.";

// 금지 — 중첩
String grade = amount > 2_000_000 ? "VIP" : amount > 800_000 ? "GOLD" : "NORMAL";   // switch 또는 if-else
// 금지 — 복잡한 로직
return isValid ? repository.save(request.toEntity()) : handleInvalid(request);
```

**부정 연산**

- null 비교는 항상 `== null` / `!= null`. `Objects.isNull()` 사용 안 함
- boolean 하나의 부정은 `!` (`if (!orderItem.isConfirmable())`)
- 복잡한 조건은 의미 있는 이름의 지역 변수나 private 메서드로 추출

```java
boolean isAmountMismatch = !payment.isPaid() || payment.amount() != order.getPayAmount();
if (isAmountMismatch) {
    throw new PaymentException(PaymentErrorCode.PAYMENT_AMOUNT_MISMATCH);
}
```

**기타**

- 의존성 주입은 생성자 주입 + `@RequiredArgsConstructor`만. `@Autowired` 필드 주입 금지
- 긴 문자열은 텍스트 블록(`"""`) + `formatted()`
- Java 21 문법 적극 사용: `record` · `switch` 식 · 패턴 매칭 `instanceof` · `List.of()`
- `var`는 우변에서 타입이 명확할 때만 (`var orders = new ArrayList<Order>();`)
- 금액은 `long`(원), 비율은 `BigDecimal` — `double` · `float` 금지

**주석**

- "무엇을"이 아니라 **"왜"** 를 설명
  - 좋음: `// 브라우저가 보낸 금액은 믿지 않는다 — 포트원 조회 결과로만 PAID 판정`
  - 나쁨: `// 결제 금액을 비교한다`
- 자명한 getter · 단순 위임에는 주석 없음
- 설계상 트레이드오프(멱등 처리 이유, 타임아웃 값 근거, 예외 통합 이유)는 반드시 주석

### 2-4. API 규격

**URL**

| 영역 | 규칙 | 예시 |
|---|---|---|
| 구매자 · 공개 | `/api/{자원}` | `GET /api/products/101` · `POST /api/orders` |
| 판매자 | `/api/seller/{자원}` | `PATCH /api/seller/order-items/ship` |
| 관리자 | `/api/admin/{자원}` — **admin-service만** | `PATCH /api/admin/applications/7/approve` → admin → store `/internal/applications/7/approve` |
| 서비스 간 | `/internal/{자원}` | `POST /internal/stock/reservations` · `GET /internal/stats/orders` — 게이트웨이에 라우트 없음 |
| 본인 | `/me` | `GET /api/users/me` |

- **도메인 서비스는 `/api/admin/**`을 노출하지 않음.** 관리자 기능은 `/internal/**`로 열고 admin-service가 조합 (게이트웨이는 `/api/admin/**` 전부를 admin으로 라우팅). 관리자 상담함(채팅)은 예외로 `/api/chats/**`(chat-service)를 관리자 역할로 호출 — WebSocket 이라 admin 이 중계할 수 없음(10/27)
- 브라우저는 payment-service를 직접 부르지 않음 — 결제 확인은 order(`POST /api/orders/{orderNo}/payment/confirm`) 경유 (포트원 웹훅 `/api/payments/webhook`만 예외)
- 자원은 **복수형 명사 · kebab-case**, 행위는 HTTP 메서드
- 상태 전이처럼 행위 중심 API는 동사 하위 경로 허용 (`/approve` · `/confirm` · `/ship` · `/api/auth/login`)
- 경로 변수는 외부 노출 번호 우선 (`/api/orders/{orderNo}`), 내부 PK 노출 최소화

**응답 — 모든 응답은 `ApiResponse<T>` 봉투 하나**

```json
// 성공
{ "code": "SUCCESS", "message": "주문이 생성되었습니다.", "data": { "orderNo": "20261001-000123" } }

// 실패 (비즈니스 예외)
{ "code": "ORDER_OUT_OF_STOCK", "message": "재고가 부족합니다.", "data": null }

// 실패 (@Valid 검증)
{ "code": "INVALID_INPUT", "message": "수량은 1 이상이어야 합니다.", "data": null }
```

- 성공 판별은 `code === "SUCCESS"` 하나
- HTTP 상태 코드는 전송 레벨, `code`는 비즈니스 레벨 — 둘 다 정확히
- 컨트롤러 반환 타입은 `ResponseEntity<ApiResponse<T>>`로 통일
- 페이지 응답은 `ApiResponse<PageResponse<T>>` — `PageResponse`는 `{ content, page, size, totalElements, totalPages, hasNext }`
- 내부 API(`/internal/**`)도 같은 봉투. `client`에서 `data`를 꺼내 반환

```java
return ResponseEntity.ok(ApiResponse.success("주문 내역을 조회했습니다.", response));
return ResponseEntity.status(HttpStatus.CREATED)
        .body(ApiResponse.success("상품이 등록되었습니다.", response));

// 금지 — 컨트롤러에서 error() 직접 호출. 예외를 throw 할 것
return ResponseEntity.badRequest().body(ApiResponse.error(...));
```

**HTTP 상태 코드**

| 상태 | 사용 시점 |
|---|---|
| 200 | 조회 · 수정 · 처리 성공 |
| 201 | 생성 (가입 · 상품 등록 · 주문 생성 · 입점 신청) |
| 400 | 검증 실패 · 잘못된 요청 |
| 401 | 미인증 (토큰 없음 · 만료) — 게이트웨이 |
| 403 | 권한 부족(역할) — 게이트웨이 / 소유권 위반 — 서비스 |
| 404 | 리소스 없음 |
| 409 | 중복 · 상태 충돌 (이미 발주확인된 상품주문, 재고 부족) |
| 429 | 요청 빈도 제한 |
| 500 | 서버 오류 |
| 502 / 504 | 다른 서비스 · 포트원 응답 실패 · 타임아웃 |

**컨트롤러 책임**

- 얇게 유지 — 요청 파싱 / 서비스 호출 / 응답 조립만
- 로그인 사용자는 `@CurrentUser AuthUser`로 받아 **`userId` · `storeId`를 서비스 파라미터로 전달**
- 서비스는 HTTP 헤더 · `HttpServletRequest`를 직접 읽지 않음

```java
@PatchMapping("/ship")
public ResponseEntity<ApiResponse<Void>> ship(@CurrentUser AuthUser user,
                                              @Valid @RequestBody ShipRequest request) {
    sellerOrderService.ship(user.storeId(), request);
    return ResponseEntity.ok(ApiResponse.success("송장이 등록되었습니다."));
}
```

### 2-5. 예외 처리

**구조**

```
RuntimeException
└── BusinessException (common.web.exception)      ← 모든 비즈니스 예외의 부모
    ├── AuthException    + AuthErrorCode
    ├── OrderException   + OrderErrorCode
    └── {Domain}Exception + {Domain}ErrorCode      ← 새 도메인은 이 패턴
```

- `ErrorCode` 인터페이스(`getStatus()` · `getCode()` · `getMessage()`)를 구현한 **enum**으로 정의
- `GlobalExceptionHandler`가 `BusinessException`을 `ApiResponse.error()`로 변환 → **서비스는 throw만, 컨트롤러는 try-catch 없음**
- Spring 표준 예외(`MethodArgumentNotValidException` · `MethodArgumentTypeMismatchException` · `MissingServletRequestParameterException` · `HttpMessageNotReadableException`)도 400 `INVALID_INPUT`으로 변환
- 게이트웨이의 401 · 403도 같은 봉투 형식(`UNAUTHORIZED` · `FORBIDDEN`)으로 응답

**에러 코드 네이밍**

- 코드 문자열: `{도메인}_{상황}` 대문자 스네이크 — `ORDER_OUT_OF_STOCK` · `PAYMENT_AMOUNT_MISMATCH`
- enum 상수명 = 코드 문자열 (같은 값을 두 번 관리하지 않음)
- **프론트와 공유된 코드는 이름을 바꾸지 않음.** 의미가 달라지면 새 코드를 추가
- 에러 코드 목록은 `docs/api/error-codes.md`에 서비스별로 관리

| 도메인 접두어 | 서비스 | 예 |
|---|---|---|
| `AUTH` · `USER` · `POINT` | user | `AUTH_DUPLICATE_EMAIL` 이메일 중복 · `USER_NOT_FOUND` 회원 없음 · `POINT_INSUFFICIENT` 포인트 부족 |
| `APPLY` · `STORE` | store | `APPLY_REAPPLY_RESTRICTED` 재신청 제한 기간 |
| `CATEGORY` · `PRODUCT` · `STOCK` | product | `STOCK_INSUFFICIENT` 재고 부족 · `CATEGORY_HAS_PRODUCTS` 상품이 있는 카테고리 삭제 |
| `CART` · `ORDER` · `CLAIM` | order | `ORDER_OUT_OF_STOCK` 재고 부족 · `CLAIM_NOT_ALLOWED` 클레임 불가 상태 |
| `PAYMENT` | payment | `PAYMENT_AMOUNT_MISMATCH` 결제 금액 불일치 |
| `REVIEW` · `INQUIRY` | review | `REVIEW_NOT_ELIGIBLE` 작성 자격 없음 · `INQUIRY_NOT_FOUND` |
| `SETTLE` · `COMMISSION` | settlement | `SETTLE_ALREADY_AGGREGATED` 이미 집계된 주차 · `COMMISSION_RATE_INVALID` |
| `CHAT` | chat | `CHAT_ROOM_NOT_FOUND` 없거나 남의 방 · `CHAT_STORE_INACTIVE` 정지 · 폐점 스토어 · `CHAT_TOO_FAST` 연결마다 1초 5건 초과(STOMP 오류 큐 `/user/queue/errors`) (10/27) |
| (조합은 그대로 전달) · `CATEGORY` · `REPORT` · `NOTIFICATION` | admin | 하위 서비스가 보낸 `ApiResponse`의 `code` · `message`를 **바꾸지 않고 전달**, 연결 실패 · 타임아웃만 `EXTERNAL_API_ERROR`. admin 이 판단하는 것만 자체 코드 — `CATEGORY_COMMISSION_REQUIRED` 수수료 없이 활성화 · `REPORT_DUPLICATED` 중복 신고 · `NOTIFICATION_NOT_FOUND` |
| 공통 (도메인 접두어 없음) | 전체 | `SUCCESS` · `INVALID_INPUT` · `UNAUTHORIZED` · `FORBIDDEN` · `NOT_FOUND` · `METHOD_NOT_ALLOWED` · `EXTERNAL_API_ERROR` · `GLOBAL_ERROR` |

- admin-service는 조합 · 전달만 하는 API 에서는 자체 에러 코드를 만들지 않습니다. 관리자 화면이 받는 코드는 데이터 주인 서비스의 코드 그대로 (`APPLY_REAPPLY_RESTRICTED` 등). 예외 — admin 이 판단 · 데이터 주인인 곳: 카테고리 · 수수료 조합 `CATEGORY_*`(10/20), 신고 · 조치 `REPORT_*`(10/26 admindb), 알림 센터 `NOTIFICATION_*`(10/27)

**새 도메인 예외 추가 (3단계)**

```java
// 1. {domain}/exception/OrderErrorCode.java
@Getter
@RequiredArgsConstructor
public enum OrderErrorCode implements ErrorCode {
    ORDER_NOT_FOUND(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다."),
    ORDER_INVALID_STATUS_TRANSITION(HttpStatus.CONFLICT, "현재 상태에서 처리할 수 없는 요청입니다."),
    ORDER_OUT_OF_STOCK(HttpStatus.CONFLICT, "재고가 부족합니다.");

    private final HttpStatus status;
    private final String message;

    @Override
    public String getCode() {
        return name(); // 코드 문자열 = enum 상수명
    }
}

// 2. {domain}/exception/OrderException.java
public class OrderException extends BusinessException {
    public OrderException(OrderErrorCode errorCode) {
        super(errorCode);
    }
}

// 3. 서비스에서 throw
throw new OrderException(OrderErrorCode.ORDER_NOT_FOUND);
```

**규칙**

- `RuntimeException`을 직접 throw 하지 않음
- 다른 도메인의 사실을 표현할 때는 그 도메인 예외 사용 허용 (같은 서비스 안에서)
- 보안상 구분을 노출하면 안 되는 경우 하나의 코드로 통합 — 로그인 실패는 "이메일 또는 비밀번호가 올바르지 않습니다" 하나
- **서비스 간 호출 실패**: `client`에서 `RestClientResponseException`을 잡아 호출한 쪽 도메인 예외로 변환
  - 상대가 보낸 비즈니스 오류(재고 부족 409) → 의미가 같은 내 도메인 코드
  - 연결 실패 · 타임아웃 · 5xx · 서킷 열림 → `EXTERNAL_API_ERROR`(502/504) + Saga 보상 (대시보드 조합은 부분 응답, 2-7)
  - 예외: admin-service는 변환하지 않고 하위 서비스의 `code` · HTTP 상태를 그대로 전달
- 게이트웨이 필터 체인(WebFlux) 안에서는 `BusinessException`을 던지지 않음 — 전용 핸들러가 JSON으로 응답

### 2-6. 트랜잭션 · 데이터 접근

- `@Transactional`은 **서비스 계층에만**. 컨트롤러 · 레포지토리 금지
- 조회 전용은 `@Transactional(readOnly = true)`, DB 쓰기가 없으면 붙이지 않음 (Redis는 JPA 트랜잭션 대상 아님)
- **원격 호출(다른 서비스 · 포트원 · SNS 발행)을 DB 트랜잭션 안에 넣지 않음** — Saga 오케스트레이터 메서드에는 `@Transactional` 금지
- 이벤트 발행은 커밋 이후 — `@TransactionalEventListener(phase = AFTER_COMMIT)` (또는 Outbox)
- 부가 작업 실패가 본 작업을 실패시키면 안 될 때는 격리하고 로그만 (예: 캐시 무효화 실패)
- 원자성이 필요한 작업은 한 트랜잭션 (예: 상품주문 상태 변경 + 이력 기록)
- Repository는 Spring Data JPA 쿼리 메서드 네이밍(`findByStoreIdAndStatus`, `existsByEmail`)
- 동적 조건 검색(카테고리 · 가격 · 키워드 · 정렬 · 페이징)은 **QueryDSL** — `{Entity}RepositoryCustom` + `{Entity}RepositoryImpl`, 조건은 `BooleanExpression` 메서드로 분리 (null이면 조건 생략)
- **SQL Injection 방지**: JPA · QueryDSL 파라미터 바인딩만 사용. `@Query` · 네이티브 쿼리에 **문자열 이어 붙이기 금지** (`"... WHERE name LIKE '%" + keyword + "%'"` ✗ → `:keyword` 바인딩), 정렬 컬럼은 허용 목록으로 매핑 — SonarQube가 검출
- **XSS 방지**: 리뷰 · 문의 · 입점 신청 등 사용자가 입력한 HTML은 **OWASP Java HTML Sanitizer**로 **저장 전** 정화 (`common/util`의 정책 하나를 공유). 일반 텍스트 필드는 프론트에서 이스케이프 출력(React 기본), `dangerouslySetInnerHTML`은 정화된 값에만 — 화면에서 HTML(상품 상세 · 스토어 소개 등)을 그릴 때는 `shared/utils/safeHtml.js`(DOMPurify)를 한 번 더 거침 (10/27)
- 동시성: 재고처럼 경합하는 값은 **조건부 UPDATE**(`@Modifying @Query`), 엔티티 동시 수정은 `@Version`
- **서비스 메서드는 `userId` · `storeId` 등 원시값을 파라미터로 받음** — 테스트 · 스레드 안전성

### 2-7. MSA 규칙 (신규)

**서비스 간 동기 호출**

- 호출은 `{domain}/client/{대상}Client` 인터페이스(`@HttpExchange`)로만, service에서만 사용
- 받는 쪽은 `Internal{X}Controller` + `/internal/**`
- 주소는 환경 변수 `{대상}_SERVICE_URI` (클러스터: CoreDNS 이름)
- 호출 깊이는 **1홉까지** — 호출받은 서비스가 다시 다른 서비스를 부르는 연쇄 호출 금지 (Saga 오케스트레이터 order · 조합 계층 store `dashboard` · admin이 직접 각 서비스를 호출)

**Resilience4j 표준 — 모든 동기 호출(Saga · 대시보드 조합 · admin)**

| 항목 | 규칙 |
|---|---|
| 타임아웃 | 연결 2초 · 읽기 3초 (`common/config/RestClientConfig`) — 필수 |
| 서킷 브레이커 | **client(대상 서비스)마다 인스턴스 하나**, 이름 = 대상 서비스 (`resilience4j.circuitbreaker.instances.product`) |
| 재시도 | **멱등 GET만** (최대 2회). POST · PATCH는 재시도하지 않음 — Saga는 멱등 키 + 보상으로 처리 |
| 폴백 | 도메인 예외 `EXTERNAL_API_ERROR`(502/504), 대시보드는 부분 응답 |
| 설정 위치 | `application.yml`의 `resilience4j.*` (별도 Config 클래스 없음, 서킷 브레이커 인스턴스 이름 `{대상}Client`) — 값 임의 변경 금지 |

- 목표: **서비스 하나가 죽어도 호출한 쪽은 에러 메시지로 1차 처리**하고 나머지 화면 · 기능은 정상
- Redis 호출(장바구니 캐시)도 같은 표준: 서킷 인스턴스 `redisCart` + 폴백 → MySQL `cart_item` 원본 조회. 쓰기는 MySQL 먼저, Redis 갱신 실패는 WARN 로그만 — Redis가 죽어도 장바구니는 정상(지연만)
- 예외 (10/27): chat-service 의 알림 전송(admin `/internal/notifications`) · 이름 · 스토어 상태 조회(user · store)는 **빠져도 되는 부가 정보**라 서킷 없이 짧은 타임아웃(연결 1초 · 읽기 2초)과 실패 무시(fail-open)로 처리 — 알림은 전용 스레드 2 · 대기 500건, 이름은 캐시(10분 · 스토어 1분) 후 번호 표시. 채팅 전송 · 저장 경로는 이 호출을 기다리지 않음

**대시보드 조합**

- 판매자 대시보드 `GET /api/seller/dashboard` = store-service `dashboard` 패키지 / 관리자 대시보드 `GET /api/admin/dashboard` = admin-service `dashboard` 패키지
- 각 서비스의 `/internal/stats/**`를 **병렬 호출**(서비스별 타임아웃), 결과를 한 응답으로 조합
- **집계 계산은 데이터 주인 서비스가** — 조합하는 쪽은 받은 값을 합치기만 (매출 합계는 order, 정산 금액은 settlement)
- **부분 응답**: 실패한 영역만 `null` + `unavailable` 목록, 응답은 200 `SUCCESS`

```json
{ "code": "SUCCESS", "message": "대시보드를 조회했습니다.",
  "data": { "orders": null, "products": { "onSale": 42 }, "settlement": { "pending": 1250000 },
            "unavailable": ["order"] } }
```

- 프론트는 `unavailable`에 있는 영역에 "일시적으로 불러올 수 없습니다" 표시, 나머지는 정상 렌더링

**이벤트**

- 이름: `{Aggregate}{과거형 동사}` — `StoreApproved` · `OrderPaid` · `OrderItemConfirmed`
- 봉투: `{ eventId, eventType, occurredAt, aggregateId, version, payload }`
- `occurredAt`은 오프셋 포함 ISO-8601 (`2026-10-21T09:12:33+09:00`)
- payload는 **구독자가 다시 호출하지 않아도 되도록** 필요한 값 포함 (주문자 이메일 · 금액 등)
- 필드 추가는 자유, **삭제 · 이름 변경 · 의미 변경 금지** (새 이벤트 타입 또는 version 증가)
- 이벤트 목록 · payload는 `docs/events.md`에 먼저 등록 후 구현
- 소비자는 `processed_event` 테이블로 eventId 중복 처리 방지

**멱등 · Saga**

- Saga 참여자 API는 `sagaId`, 결제는 `paymentId`를 멱등 키로 — 두 번 호출해도 결과 동일
- 멱등 테스트(같은 요청 2회) 필수
- Saga 진행 상태는 `saga_instance` 테이블에 단계마다 기록
- 보상은 역순, 모두 멱등

**스케줄러**

- 클래스 `{행위}Scheduler`, 메서드 하나에 작업 하나
- cron · 기준 기간은 `application.yml`(`app.scheduler.*`)에서 주입, `zone = "Asia/Seoul"` 명시
- 레플리카 2개 대비 `@SchedulerLock(name = "{kebab-case}")` 필수
- 관리자 수동 실행이 필요한 작업은 같은 service 메서드를 `/internal/**`로도 노출, admin-service가 호출 (예: `/internal/settlements/aggregate`)

### 2-8. 로깅

- `@Slf4j` 사용. `System.out.println` · `e.printStackTrace()` 금지
- 레벨
  - `error` — 사람이 봐야 하는 실패, 스택트레이스 포함 (`log.error("포트원 취소 실패 - paymentId={}", paymentId, e)`)
  - `warn` — 처리는 됐지만 주의 (재고 부족, 금액 불일치 감지, 재시도)
  - `info` — 상태 변화 (주문 PAID, Saga 보상 완료, 정산 집계 완료)
  - `debug` — 개발 확인용 (운영 미출력)
- 로그 메시지에 업무 키 포함: `orderNo` · `sagaId`는 MDC(order · payment), 그 외(`paymentId` 등)는 메시지
- 예외 로그는 `GlobalExceptionHandler` 한 곳에서 남김
- **비밀번호 · 토큰 · 포트원 키 · 카드 정보 · 이메일 · 전화 · 주소는 info 이상에 남기지 않음**
- 형식은 공통 `logback-spring.xml` — 콘솔 `[traceId,spanId,userId]`, k8s는 Loki 전송(본문 JSON · 라벨 `app` · `namespace` · `level` · 배치 10초). 형식 임의 변경 금지

### 2-9. API 문서 (Swagger)

- springdoc 애노테이션: 클래스 `@Tag`, 메서드 `@Operation` + `@ApiResponses` + `@Parameter`
- description에 **인가 요건**(공개 / BUYER / SELLER / ADMIN / 내부)과 **비즈니스 에러 코드** 기재
- 공통 `common.web.dto.ApiResponse`와 Swagger `ApiResponse`가 동명 — Swagger 쪽은 import하지 않고 **FQN**(`@io.swagger.v3.oas.annotations.responses.ApiResponse`)
- 접속: 각 서비스 `http://localhost:{port}/swagger-ui.html` · 명세 파일은 `docs/api/{service}.yaml`로 내보내 PR에 포함

### 2-10. 테스트

- 클래스: 단위 `{대상}Test` · 통합 `{대상}IntegrationTest`
- 메서드: **영어** `{메서드}_{상황}_{결과}` (각 조각 camelCase) + `@DisplayName`(한국어) — 메서드 이름에 한글 금지 (10/15)
  - `ship_whenNotPreparing_throwsException()` + `@DisplayName("배송준비 상태가 아니면 송장을 등록할 수 없다")`
- 필수 대상: 엔티티 상태 전이 · 정산 금액 계산 · Saga 보상 · 멱등 API · 소유권 검사
- DB가 필요한 테스트는 Testcontainers(MySQL · Redis), H2 사용 안 함
- given / when / then 주석으로 구분

---

## 3. DB

### 3-1. 명명

- `snake_case`. 파스칼 · 카멜 케이스 금지
- MySQL 예약어 · 키워드 금지 (`order` · `user` · `group` · `key` …) — 예외는 `orders` · `users` 두 테이블
- `data` · `info` · `field` 같은 무의미한 이름 금지

### 3-2. 테이블

- **단수형** (엔티티 클래스와 1:1): `store` · `product` · `order_item` · `settlement` — 예외 `orders` · `users`
- 하위 · 매핑 테이블도 단수형: `product_option` · `review_image`
- 모든 테이블에 `COMMENT` 필수
- 서비스별 스키마 10개: `userdb` · `storedb` · `productdb` · `orderdb` · `paymentdb` · `reviewdb` · `settlementdb` · `admindb`(10/26) · `chatdb`(10/27) · `keycloakdb`
- `keycloakdb`는 Keycloak이 스스로 관리 — 이 문서의 DB 규칙 · Flyway 대상에서 제외, 직접 쿼리 · 수정 금지
- gateway-service는 스키마 없음 · admin-service는 admindb 에 신고 · 조치 이력만(ADR-0001 예외)

**서비스별 테이블 이름**

| 스키마 | 테이블 |
|---|---|
| userdb | `users`(`point_balance` · `grade` 포함) · `address` · `point_history` · `point_use_saga` · `shedlock` |
| storedb | `store_application` · `application_document` · `application_history` · `store` · `store_status_history` · `shedlock` |
| productdb | `category` · `product` · `product_option` · `product_image` · `stock_history` · `processed_event` |
| orderdb | `cart_item`(장바구니 원본 — Redis `cart:{userId}`는 캐시) · `orders` · `order_item` · `order_store_shipment` · `order_item_history` · `order_claim` · `saga_instance` · `outbox_event` · `shedlock` |
| paymentdb | `payment` · `payment_cancel` |
| reviewdb | `review` · `review_image` · `review_eligibility` · `product_inquiry` · `processed_event` |
| settlementdb | `category_commission` · `settlement_store`(StoreApproved 스냅샷: 스토어명 · 정산 계좌) · `settlement_item` · `settlement` · `payout` · `processed_event` · `shedlock` |
| chatdb | `chat_room` · `chat_message` · `chat_read` · `shedlock` (10/27) |
| keycloakdb | Keycloak 관리 (계정 · 역할 · 세션) |

### 3-3. 컬럼

- **PK: `{테이블명}_id`** — `store_id` · `order_item_id` (`orders`는 `order_id`, `users`는 `user_id`)
- **FK: `{참조테이블}_id`**, 같은 테이블을 두 번 참조하면 역할 이름 (`buyer_id` · `seller_id`)
- 다른 서비스의 ID도 같은 이름 규칙 (`order_item.store_id`, `order_item.product_id`)
- 날짜 · 시간: `_at` (`created_at` · `paid_at` · `confirmed_at`), 날짜만: `_date`
- 여부: `is_` · `has_` · `use_` (`is_thumbnail` · `is_default`)
- 카운트: `_count` + `INT UNSIGNED DEFAULT 0`
- 스냅샷 컬럼은 원본 이름 그대로 (`product_name` · `store_name`) + COMMENT에 "주문 시점 스냅샷"

### 3-4. 제약조건 이름

| 종류 | 형식 | 예 |
|---|---|---|
| PK | `pk_{테이블}` | `pk_order_item` |
| FK | `fk_{테이블}_{참조/역할}` | `fk_order_item_orders` |
| Unique | `uk_{테이블}_{컬럼}` | `uk_users_email` · `uk_settlement_store_week` |
| Index | `idx_{테이블}_{컬럼들}` | `idx_order_item_store_status` |

### 3-5. 시간 컬럼

**원칙: 시스템 감사 시각(`created_at` · `updated_at`)의 주인은 DB, 비즈니스 이벤트 시각(`paid_at` · `confirmed_at` · `deleted_at`)의 주인은 애플리케이션.**

- 모든 시간 컬럼 `DATETIME(6)`. `TIMESTAMP` 금지
- DEFAULT는 `CURRENT_TIMESTAMP(6)`만

| 컬럼 | 타입 | NULL | DDL | 관리 |
|---|---|---|---|---|
| `created_at` | DATETIME(6) | NOT NULL | `DEFAULT CURRENT_TIMESTAMP(6)` | DB |
| `updated_at` | DATETIME(6) | NOT NULL | `DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)` | DB |
| `deleted_at` | DATETIME(6) | NULL | 없음 | 애플리케이션 (soft delete) |

- `created_at` · `updated_at`은 `BaseTimeEntity`(`@MappedSuperclass`)로 통일, `deleted_at`은 soft delete 테이블에만 개별 선언
- INSERT-only 로그성 테이블(`order_item_history` · `processed_event`)은 `created_at`만
- 컬럼 순서 `created_at → updated_at → deleted_at`

```java
@Getter
@MappedSuperclass
public abstract class BaseTimeEntity {

    // 시간의 주인 = DB. INSERT/UPDATE 직후 DB가 채운 값을 Hibernate가 다시 읽어 반영한다.
    @Generated(event = EventType.INSERT)
    @Column(insertable = false, updatable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime createdAt;

    @Generated(event = { EventType.INSERT, EventType.UPDATE })
    @Column(insertable = false, updatable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime updatedAt;
}
```

- JPA Auditing(`@CreatedDate` · `@LastModifiedDate` · `@EnableJpaAuditing`) **사용 금지** — 두 방식을 섞으면 어느 값이 맞는지 알 수 없음
- 비즈니스 시각은 NULL 허용(이벤트 전 = NULL), DEFAULT 금지, 서비스 로직에서 명시적으로 세팅

**Soft delete**

- 삭제 = `deleted_at`에 현재 시각, 물리 DELETE 금지 (회원 · 상품 · 스토어 · 배송지)
- 활성 조회 조건 `WHERE deleted_at IS NULL`
- 주문 · 결제 · 정산은 삭제 개념 없음 (상태로 관리)

**시간대**

- DB(`default-time-zone='+09:00'`) · JDBC(`connectionTimeZone=Asia/Seoul`) · JVM(`TZ=Asia/Seoul`) **세 곳 모두 Asia/Seoul**
- Java는 `LocalDateTime`, 서비스 밖으로 나가는 이벤트 시각만 `OffsetDateTime`
- 정산 주차 · 자동 구매확정 기준도 KST

### 3-6. 데이터 타입

| 값 | 타입 |
|---|---|
| PK · FK · 다른 서비스 ID | `BIGINT` (PK는 `AUTO_INCREMENT`) |
| 금액 (원) | `BIGINT` — Java `long`, 소수 없음 |
| 비율 (수수료율) | `DECIMAL(5,2)` — Java `BigDecimal` |
| 카운트 · 수량 · 파일 크기 | `INT UNSIGNED` |
| 코드성 값 · 외부 번호 | `VARCHAR` + 적정 길이 (`order_no VARCHAR(20)`) |
| 제목 · 이름 | `VARCHAR(255)` 이하 / 본문 `TEXT` |
| 이벤트 payload · 서류 메타 | `JSON` |
| Boolean | `BOOLEAN NOT NULL DEFAULT FALSE` |

**ENUM 대신 VARCHAR**

- DB는 `VARCHAR(20~30)`, 검증은 Java Enum(`@Enumerated(EnumType.STRING)`)
- 값은 대문자 스네이크 (`PAYMENT_DONE` · `SUPPLEMENT`)
- 허용 값 목록은 COMMENT에 명시

```sql
`status` VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING / APPROVED / REJECTED / SUPPLEMENT'
```

### 3-7. 제약조건 · 무결성

**FK (MSA 조정)**

- **같은 서비스(스키마) 안의 참조 → FK 제약 필수**, `ON DELETE RESTRICT`
- **다른 서비스의 ID → FK 금지(스키마가 다름)**, 대신
  - 조회에 쓰이면 인덱스 필수
  - COMMENT에 출처 명시: `COMMENT 'store-service store.store_id (논리 참조)'`

**UNIQUE**

- 비즈니스적으로 유일한 값은 DB UNIQUE로 강제 — `email` · `order_no` · `portone_payment_id` · `(store_id, week)` · `event_id`
- 복합 PK 금지 — PK는 단일 AUTO_INCREMENT, 중복 방지는 UNIQUE로

### 3-8. 인덱스

- 같은 서비스 FK는 InnoDB가 자동 생성
- **다른 서비스 ID 컬럼은 수동 인덱스** (FK가 없으므로)
- 목록 조회는 복합 인덱스 (필터 → 정렬 순): `idx_order_item_store_status (store_id, status, created_at)`
- 실제 조회 쿼리 기준으로 추가 (미리 과하게 걸지 않기)

### 3-9. 테이블 옵션 · 컬럼 순서

- 모든 테이블: `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci` (스키마 생성 스크립트도 같은 collation)
- 컬럼 순서 고정
  1. PK
  2. FK (같은 서비스)
  3. 다른 서비스 ID
  4. 비즈니스 컬럼 (핵심 → 부가)
  5. 상태 · 플래그 (`status` · `is_xxx`)
  6. 도메인 시간 (`paid_at` 등)
  7. 감사 컬럼 (`created_at → updated_at → deleted_at`)
  8. `version` (낙관적 락)

### 3-10. Flyway

- 경로: `src/main/resources/db/migration/V{n}__{설명}.sql` — 설명은 snake_case (`V3__add_saga_instance.sql`)
- **머지된 마이그레이션은 수정 금지** — 바꿀 때는 새 번호
- 같은 서비스를 두 명이 작업하면 PR 머지 전 번호 확인
- 시드: `db/seed/R__demo_seed.sql` (local · k8s(dev 클러스터) 프로필만, 수정하면 재실행)
- 컬럼 삭제 · 이름 변경은 두 번 배포로 (추가 → 코드 전환 → 삭제)
- JPA `ddl-auto: validate`

### 3-11. 외부 API 필드

- DB 컬럼명은 이 규칙을 따르고, 포트원 등 외부 필드명 매핑은 `client`의 DTO에서 처리
- 외부 숫자형 문자열 ID는 `VARCHAR` (`pg_tx_id`)
- 외부 ID가 PK 이름(`{테이블}_id`)과 겹치면 출처 접두어를 붙임 — 포트원 `paymentId` → `payment.portone_payment_id`

---

## 4. 프론트엔드

### 4-1. 기술 스택별 규칙

| 분류 | 기술 | 규칙 |
|---|---|---|
| 언어 | JavaScript (ES2022) | 목업 그대로 — 컴포넌트 `.jsx`, 그 외 `.js`. TypeScript 도입 안 함 |
| 빌드 | Vite 6 · Node.js 22 LTS | `import.meta.env.VITE_*` |
| 라우팅 | React Router v7 (목업은 v6 — 이식하면서 올림) | 라우트 정의는 `app/router.jsx` **단일 파일** |
| 서버 상태 | TanStack Query v5 | API 데이터는 전부 여기서 (4-6) |
| 클라이언트 상태 | Zustand | `authStore` — accessToken · user · isAuthReady / UI 상태 |
| 표 | TanStack Table v8 | 4-7 |
| 폼 | react-hook-form + zod | 스키마는 `features/{domain}/schemas.js` |
| HTTP | Axios | `withCredentials: true` 고정 · 상대경로 `/api/...` |
| 스타일 | Tailwind CSS v4 | 디자인 토큰은 `styles/index.css`의 `@theme` (목업 토큰) |
| UI 컴포넌트 | 목업 공통 컴포넌트 | `shared/components/ui/` — shadcn 등 새 UI 키트 도입 안 함 |
| 차트 · 토스트 | 목업 SVG 차트 · 목업 ToastHost | 새 라이브러리 도입 시 팀 합의 |
| 결제 | `@portone/browser-sdk` | `features/payment`에서만 (`portone.js`) |
| 목킹 | MSW | `src/mocks/` |
| 테스트 | Vitest + React Testing Library | 대상: 유틸 · zod 스키마 · 핵심 훅 |

### 4-2. 프로젝트 구조

도메인(기능) 기반 구조. **백엔드 서비스와 `features/{도메인}`이 대칭** (payment 는 화면 없이 포트원 결제창 · 결제 확인 로직만 `features/payment` 에 두고 주문서 화면(`features/order`)이 부름 — 결제 확인 엔드포인트는 order).

```
gotgan-frontend/src/
├── app/                          # 앱 전역
│   ├── router.jsx                #   전체 라우트 (단일 파일, 도메인별 주석 구획 · 경로 → 파일 표 + 지연 로딩)
│   ├── RouteError.jsx            #   화면 받기 실패(배포 직후 옛 파일) → 새로고침 안내
│   ├── providers.jsx             #   QueryClientProvider 등
│   ├── bootstrap.js              #   부팅 시 refresh 1회 → 로그인 상태 복구
│   └── App.jsx
├── pages/                        # 라우트 1개 = 페이지 파일 1개. features 조립만
│   ├── shop/                     #   메인 · 상품 · 스토어 · 장바구니 · 주문서 · 로그인 · 입점 신청
│   ├── mypage/                   #   주문 · 클레임 · 리뷰 · 회원정보 · 배송지 · 포인트
│   ├── seller/                   #   판매자센터
│   └── admin/                    #   관리자
├── features/                     # 도메인별 구현 (담당 경계 = 폴더 경계)
│   ├── auth/                     #   로그인 · 가입 · authStore · 가드
│   ├── user/                     #   회원정보 · 배송지 · 포인트 · 등급
│   ├── store/                    #   입점 신청 · 스토어 · 판매자 대시보드
│   ├── product/                  #   카테고리 · 상품 목록 · 상세 · 검색 · 판매자 상품
│   ├── order/                    #   장바구니 · 주문 · 결제 · 클레임 · 판매자 주문
│   ├── review/                   #   리뷰 · 상품문의 · 판매자 답글
│   ├── admin/                    #   관리자 화면 전부 (admin-service만 호출)
│   ├── support/                  #   FAQ (프론트 정적 데이터)
│   ├── chat/                     #   1:1 채팅 — 구매자 · 판매자 · 관리자 상담함 공용 (chat-service, STOMP, 10/27)
│   ├── notification/             #   알림 벨 · 알림 목록 · SSE (admin-service 알림 센터, 10/27)
│   ├── payment/                  #   포트원 결제창 · 결제 확인 로직 (화면 없음 — 주문서가 부름, 담당 구지훈)
│   ├── report/                   #   신고 접수 모달 (admin-service /api/reports, 담당 구지훈)
│   ├── qa/                       #   임시 점검 화면 /qa — 시연 전 삭제
│   └── settlement/               #   판매자 정산
│       ├── api/                  #     settlementApi.js
│       ├── hooks/                #     useSettlementsQuery.js · usePaySettlementMutation.js
│       ├── components/
│       └── schemas.js            #     zod
├── shared/                       # 도메인에 속하지 않는 공통
│   ├── api/                      #   axiosInstance.js · queryKeys.js · refresh.js(single-flight)
│   ├── components/ui/            #   목업 공통 컴포넌트 (Pill · Price · Modal · Kpi · BarChart …)
│   ├── components/common/        #   PostcodeSearch(우편번호 검색) · ConfirmModal · EmptyState · SortableHeader
│   ├── layouts/                  #   ShopLayout · MyPageLayout · ConsoleLayout
│   ├── hooks/  stores/  utils/
├── mocks/                        # MSW handlers · fixtures
└── styles/index.css              # Tailwind 진입 · @theme 디자인 토큰
```

**운영 규칙**

1. **관리자 화면은 `features/admin`에 둔다** (입점 심사 · 스토어 · 카테고리 · 수수료 · 정산 · 회원 · 관리자 대시보드). `/api/admin/**`(admin-service)만 호출, 도메인 서비스 API를 직접 부르지 않음 — 담당 구지훈. 예외: 관리자 상담함은 `features/chat` 공용 화면이 `/api/chats/**`(chat-service) 호출(10/27)
2. 다른 사람의 `features/` 폴더는 PR 없이 수정 금지
3. 두 도메인 이상에서 쓰이면 `shared/`로 승격, 승격 시 팀 공지
4. `features` 간 직접 import 지양 — 필요하면 `shared` 경유
5. `shared/components/ui/`(목업 컴포넌트)는 수정 전 팀 공지 — 모든 화면에 영향

### 4-3. 라우트 · 권한 가드

| 경로 | 영역 | 접근 |
|---|---|---|
| `/` · `/products` · `/products/:id` · `/stores` · `/store/:id` | 쇼핑몰 | 공개 |
| `/login` · `/signup` | 인증 | 공개 |
| `/cart` · `/checkout` · `/order/complete` · `/seller/apply` | 쇼핑몰 | BUYER |
| `/mypage/**` (`/mypage/points` 포함) | 마이페이지 | BUYER |
| `/seller` · `/seller/**` | 판매자센터 | SELLER |
| `/admin` · `/admin/**` | 관리자 | ADMIN |

- 가드: `<RequireRole role="SELLER">` — **`authStore.user.roles`로 판단** (토큰 직접 디코딩 안 함)
- `isAuthReady` 이전에는 판단하지 않음 (새로고침 시 잘못된 리다이렉트 방지)
- **프론트 가드는 UX 장치일 뿐, 실제 접근 제어는 게이트웨이 · 서비스**
- `router.jsx`는 영역 · 도메인별 주석 구획에만 추가, catch-all(`*`)은 항상 맨 마지막
- **라우트 코드 분할(10/27)**: 화면은 영역별 `{ '경로': '폴더/파일명' }` 표에 한 줄로 추가 — `import.meta.glob` + `route.lazy`로 그 경로에 처음 들어갈 때 받음. 받기에 실패하면(배포 직후 옛 파일) `RouteError`가 새로고침 안내

### 4-4. 인증

| 항목 | Access Token | Refresh Token |
|---|---|---|
| 발급 | Keycloak (user-service가 대리 호출) | Keycloak (user-service가 대리 호출) |
| 저장 | `authStore`(Zustand) 메모리 | HttpOnly · Secure · SameSite=Strict 쿠키, `Path=/api/auth` (JS 접근 불가) |
| 전송 | `Authorization: Bearer {AT}` | 브라우저 자동 (같은 출처 · Vercel rewrite) |
| 서버 저장 | 없음 (즉시 로그아웃 `blacklist:{jti}`는 Could) | Keycloak 세션 (user-service 경유) — Redis에 두지 않음 |
| 재발급 | `POST /api/auth/refresh` | Keycloak 로테이션 |
| 수명 | 30분 | 14일 |

- 로그인 화면은 React 자체 폼 — Keycloak 로그인 페이지로 리다이렉트하지 않음
- 부팅: `app/bootstrap.js`가 `/api/auth/refresh`를 1회 호출 → 성공 시 로그인 복구, 401이면 비로그인 상태
- AT 만료(401): axios 응답 인터셉터가 single-flight(`shared/api/refresh.js`)로 재발급 후 원 요청 재시도
- AT를 `localStorage` · `sessionStorage`에 저장 금지. RT는 프론트 코드에서 다루지 않음
- 판매자 전환(입점 승인) 후에는 refresh로 새 roles를 받음

### 4-5. 네이밍

| 대상 | 규칙 | 예시 |
|---|---|---|
| 컴포넌트 파일 | PascalCase | `ProductCard.jsx` |
| 페이지 컴포넌트 | `~Page` 접미사 필수, 영역 접두어 | `SellerOrderListPage.jsx` · `AdminApplicationDetailPage.jsx` |
| 커스텀 훅 | `use` 접두사, 조회 `use{X}Query` · 변경 `use{행위}Mutation` | `useCartQuery` · `useShipOrderItemsMutation` |
| API 모듈 | `{도메인}Api.js`, 함수는 `get` / `create` / `update` / `delete` + 업무 동사 | `orderApi.js` → `getMyOrders()` · `confirmPurchase()` |
| zod 스키마 | `{이름}Schema` | `storeApplySchema` |
| Zustand 스토어 | `use{X}Store`, 파일 `{x}Store.js` | `useAuthStore` |
| 상수 | UPPER_SNAKE | `PAYMENT_TIMEOUT_MINUTES` |
| queryKey | `shared/api/queryKeys.js` 팩토리에서만 (즉석 배열 금지) | `queryKeys.orders.my(params)` |
| 함수 형태 | 컴포넌트 · 훅 · 최상위 = `function` 선언문, 내부 핸들러 = 화살표 함수 `handle{Event}` | `const handleShipClick = () => {}` |
| 이벤트 props | `on{Event}` | `onConfirm` |

### 4-6. TanStack Query 패턴

세 가지를 그대로 따릅니다.
**① queryKey는 팩토리에서만 ② API 함수는 `{도메인}Api.js`로 분리 ③ 컴포넌트는 `function` 선언문 + 내부 핸들러는 화살표 함수**

**① queryKey 팩토리 — 도메인별 구획**

```js
// shared/api/queryKeys.js
export const queryKeys = {
  // ── product ──────────────────────
  products: {
    all: () => ['products'],
    list: (filters) => ['products', 'list', filters],
    detail: (id) => ['products', 'detail', id],
    seller: (params) => ['products', 'seller', params],
  },
  // ── order ────────────────────────
  cart: { all: () => ['cart'] },
  orders: {
    my: (params) => ['orders', 'my', params],
    detail: (orderNo) => ['orders', 'detail', orderNo],
    sellerItemsAll: () => ['orders', 'seller-items'],               // 무효화용 상위 키
    sellerItems: (params) => ['orders', 'seller-items', params],
  },
  // ── settlement · store · user ── (각 도메인 구획에만 추가)
};
```

- 컴포넌트에서 `useQuery({ queryKey: ['orders', params] })`처럼 즉석 배열 금지 — 무효화가 조용히 실패
- 자기 도메인 구획 안에서만 추가 · 수정

**② API 함수**

```js
// features/order/api/orderApi.js
import { axiosInstance } from '@/shared/api/axiosInstance';

export async function getOrderDetail(orderNo) {
  const { data } = await axiosInstance.get(`/api/orders/${orderNo}`);
  return data.data; // ApiResponse 봉투에서 data만 꺼낸다
}
```

**③ 조회 · 변경**

```js
// features/order/hooks/useOrderDetailQuery.js
export function useOrderDetailQuery(orderNo) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderNo),
    queryFn: () => getOrderDetail(orderNo),
  });
}

// features/order/hooks/useShipOrderItemsMutation.js
export function useShipOrderItemsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request) => shipOrderItems(request),
    onSuccess: () => {
      // 상위 키로 무효화하면 필터 · 페이지가 다른 목록까지 모두 새로 고침된다
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.sellerItemsAll() });
    },
  });
}
```

| 상황 | 사용 |
|---|---|
| 조회 (목록 · 상세) | `useQuery` |
| 변경 (생성 · 수정 · 삭제 · 상태 변경) | `useMutation` + 성공 시 `invalidateQueries` |
| 장바구니 수량처럼 즉시 반영이 필요한 변경 | `useMutation` + 낙관적 업데이트 (실패 시 롤백) |
| 무한 스크롤 · 더보기 | `useInfiniteQuery` (페이지 형식 `PageResponse` 기준) |
| 판매자 새 주문 확인 | `refetchInterval: 30_000` |
| 401 → 재발급 | axios 인터셉터 (`shared/api/axiosInstance.js`) |

- 예외: 성공 후 화면을 떠나는 인증 액션(로그인 · 로그아웃 · 비밀번호 변경)과 **포트원 결제 흐름**(`requestPayment` → 결제 검증)은 API 함수 직접 호출 허용. 끝난 뒤 필요한 queryKey만 무효화
- 에러 메시지는 `error.response.data.message`(ApiResponse) 사용, 코드별 분기는 `code`로
- 목업 데이터를 API로 교체할 때 필드명은 API 이름으로 맞춤 (목업 이름 유지 안 함)

### 4-7. TanStack Table 규칙

- **데모 규모(수백 건 이하) 목록은 전체 1회 로드 + 클라이언트에서 검색 · 정렬 · 페이징** (관리자 입점 심사 · 스토어 · 회원 · 정산, 판매자 상품)
- 건수가 계속 늘어나는 목록(판매자 주문, 구매자 상품 목록)은 **서버 페이징**(`manualPagination` · `manualSorting`)
- 정렬 헤더는 `shared/components/common/SortableHeader.jsx` 재사용
- `useClientTable`은 빈 목록에 모듈 상수 `EMPTY`를 넘김 — 매번 새 `[]`를 만들지 않음 (아래 참조 안정성 규칙)
- **`state`에 넘기는 배열 · 객체는 `useMemo`, 함수는 컴포넌트 바깥(모듈 스코프) 또는 `useCallback`** — 매 렌더링 새 참조를 넘기면 무한 루프로 브라우저가 멈춤

```jsx
// 금지 — 렌더링마다 새 배열 · 새 함수
state: { columnFilters: status === 'ALL' ? [] : [{ id: 'status', value: status }] },
globalFilterFn: (row, id, value) => { /* ... */ },

// 올바름
function globalFilterFn(row, columnId, filterValue) { /* ... */ }   // 모듈 스코프

function AdminStoreListPage() {
  const columnFilters = useMemo(
    () => (status === 'ALL' ? [] : [{ id: 'status', value: status }]),
    [status],
  );
  const table = useReactTable({ data, columns, state: { columnFilters }, globalFilterFn /* ... */ });
}
```

- 정렬 기준과 화면 표시가 다르면 `accessorFn`(정렬용 값) + `cell`(표시) 분리
- 로딩 · 에러 · 빈 상태는 **`<tbody>` 안의 행 하나**로 표현 — 검색창 등 다른 UI가 사라졌다 생기며 포커스를 잃지 않게
- 일괄 처리(발주확인 · 송장)는 `getSelectedRowModel()`로 선택 행 ID만 서버에 전송

### 4-8. 스타일

- 목업 디자인 원칙 유지: 각진 모서리 · 1px 선 · 먹색 + 주홍 포인트 하나 · 그림자는 드롭다운/모달만 · 숫자는 모노스페이스 + `tabular-nums`
- 색 · 간격은 `@theme` 토큰 클래스로만 (임의 hex 값 금지)
- 공통 클래스(`.btn` · `.field` · `.panel` · `.tbl` · `.num`)를 먼저 쓰고, 없을 때만 유틸 조합
- 한국어 줄바꿈 `word-break: keep-all`, 375px에서 가로 스크롤 없음

### 4-9. 트러블슈팅

- **새로고침하면 로그아웃됨** — ① `bootstrap.js`의 refresh 호출 완료 여부 ② 가드가 `isAuthReady` 전에 판단하는지 ③ `authStore`에 AT가 들어갔는지
- **401 후 자동 재발급이 안 됨** — ① Network 탭에 refresh 요청이 찍히는지 ② `axiosInstance`를 거치지 않는 별도 axios 호출이 있는지
- **CORS 에러** — 절대경로(`http://...`)로 호출하고 있지 않은지. 로컬은 Vite 프록시, 배포는 Vercel rewrite — 항상 상대경로 `/api/...`. 예외: 알림 SSE `/api/notifications/stream` · 채팅 `wss://api.gotgan.click/ws/chat`은 `api.gotgan.click`에 직접 연결 — 게이트웨이 globalcors가 이 두 경로만 허용(10/27)
- **`import.meta.env.VITE_...`가 undefined** — `VITE_` 접두사, `.env.local` 수정 후 dev 서버 재시작, Vercel은 환경 변수 추가 후 재배포
- **포트원 결제창이 안 뜸** — storeId · channelKey 환경 변수, 테스트 채널 키인지, 브라우저 팝업 차단

---

## 5. 인프라 · 배포 네이밍

### 5-1. AWS 자원

- 이름: `sesac-gojigi-{용도}` (kebab-case) — `sesac-gojigi-eks-cluster` · `sesac-gojigi-order-events`
- 모든 자원 태그: `Project=sesac-gojigi` · `ManagedBy=terraform` (콘솔에서 만든 자원은 `ManagedBy=manual` + 이슈 기록)
- 계정 ID · 리전 하드코딩 금지 — `data.aws_caller_identity` · 변수 사용
- AWS SDK를 쓰는 서비스는 `software.amazon.awssdk:sts` 의존성 필수(IRSA). S3 `HeadObject`로 존재 확인하면 버킷에 `s3:ListBucket` 권한 필요

| 자원 | 규칙 | 예 |
|---|---|---|
| SNS 토픽 | `sesac-gojigi-{도메인}-events` | `sesac-gojigi-order-events` |
| SQS 큐 | `sesac-gojigi-{소비자}-{도메인}-events` | `sesac-gojigi-settlement-order-events` |
| DLQ | 큐 이름 + `-dlq` | `sesac-gojigi-settlement-order-events-dlq` |
| IAM 역할 (IRSA) | `sesac-gojigi-{service}-irsa` | `sesac-gojigi-order-irsa` |
| SSM 파라미터 | `/sesac-gojigi/dev/{종류}/{이름}` | `/sesac-gojigi/dev/sqs/notification-queue-arn` |
| S3 버킷 | `sesac-gojigi-{용도}-{계정ID 끝 4자리}` (전역 유일) | `sesac-gojigi-images-1234`(prefix `products/` · `reviews/` · `stores/`) · `sesac-gojigi-seller-docs-1234` · `sesac-gojigi-reports-1234` · `sesac-gojigi-log-archive-1234` |
| DynamoDB | `sesac-gojigi-{용도}` | `sesac-gojigi-notifications` · `sesac-gojigi-settlement-reports` · `sesac-gojigi-inbox`(알림 센터 알림함, 10/27) (그 외 테이블 없음) |

### 5-2. Terraform

- 파일: 자원 종류별 snake_case (`sns_sqs.tf` · `irsa.tf`), 폴더마다 `provider.tf` · `variables.tf` · `outputs.tf`
- 자원 로컬 이름: snake_case, 타입 반복 금지 (`aws_s3_bucket.product_images` ○ / `aws_s3_bucket.product_images_bucket` ✗)
- 변수 · output: snake_case + `description` 필수
- 커밋 전 `terraform fmt -recursive` · `terraform validate`
- apply/destroy는 스케줄 워크플로(`infra-schedule`, OIDC 역할 — `cluster/` 매일 08:00 생성 · 22:00 삭제 — EventBridge Scheduler → Lambda 가 실행, 데이터는 매일 초기화) 또는 구지훈. 다른 사람은 plan까지(`infra.yml`이 PR에 plan 코멘트). 예외: `cicd/`(GitHub OIDC · Actions 역할)는 이경석이 작성 · 로컬 apply — 워크플로가 쓸 역할을 만드는 폴더라 워크플로로 apply할 수 없음
- Terraform에 비밀 값 금지 — 시크릿은 GitHub Secrets → `secrets-sync`(1-5). `kms.tf` · `secrets.tf` · `eso.tf` 없음
- `.terraform.lock.hcl` 커밋, `*.tfstate` · `.terraform/` 커밋 금지
- 버전: Terraform **1.16.5** 고정(`required_version = "~> 1.16.0"`, 워크플로 `terraform_version: '1.16.5'`) · aws provider `~> 5.0` · 모듈 vpc `~> 5` / eks `~> 20`. 상태 잠금은 `backend "s3" { use_lockfile = true }`(1.10+, DynamoDB 잠금 테이블 없음)
- 잠금 파일은 Windows · CI(Linux) 공용 — 폴더를 처음 `init` 한 뒤와 provider 버전을 바꿀 때 `terraform providers lock -platform=windows_amd64 -platform=linux_amd64`
- apply 순서 `global/s3` → `vpc` → `ecr` → `app` → `cluster`. `cicd` 는 상태 의존이 없어 `global/s3` 이후 언제든 — `cluster` 는 Actions 역할을 remote state가 아니라 이름(`sesac-gojigi-github-actions`, `data "aws_iam_roles"`)으로 찾고 없으면 건너뜀. `terraform_remote_state` 는 `cluster` → 상시 폴더 한 방향만(상시 폴더가 `cluster` 를 읽지 않는다). backend 블록은 변수를 못 쓰므로 상태 버킷 이름만 하드코딩 예외

### 5-3. Kubernetes · Helm

- 리소스 이름: 서비스 이름 그대로 kebab-case (`order-service`)
- 라벨: `app: {service}` 필수 (Service selector · Prometheus · 로그 라벨 기준)
- 파일 이름: 적용 순서가 있으면 `{nn}-{종류}.yaml` (`00-namespace.yaml`), 그 외 `{대상}.yaml`
- YAML 들여쓰기 2칸, 탭 금지
- 네임스페이스: 앱 `sesac-gojigi` · 모니터링 `monitoring` · `argocd`
- Helm `values.yaml` 키는 camelCase, 서비스 키는 서비스 이름 (`services.order-service.tag`)
- Secret 이름: `mysql-secret` · `{service}-secret` · `keycloak-secret` · `grafana-secret` · `alert-webhook-secret` — 파일로 커밋하지 않고 `secrets-sync` 워크플로가 생성. 서비스는 `envFrom.secretRef`로만 읽음
- Redis는 AOF(`appendonly yes`) + PVC(`ebs-sc` 1Gi) — EBS 볼륨(gp3 디스크), ElastiCache 아님
- 노드 그룹(3티어, 10/13 3차 · 10/14 사이징 조정): `app`(t3.xlarge ×2, 라벨 `tier=app`) · `db`(t3.medium ×1, 2a 고정, 라벨 + 테인트 `tier=db:NoSchedule`). 노드 라벨 값은 `app` · `db` 둘뿐
- 파드 배치: 업무 서비스 · gateway · Keycloak · 관측성 · ArgoCD는 `nodeSelector: { tier: app }`(Helm `deployment.yaml` 기본). MySQL · Redis만 `nodeSelector: { tier: db }` + `tolerations: [{ key: tier, value: db, effect: NoSchedule }]`
- 파드 라벨 `tier`: DB에 접속하는 파드(업무 서비스 · Keycloak · 디버그용 mysql 클라이언트)는 `tier: backend`, MySQL · Redis는 `tier: db`. `app:` 라벨과 별개로 둘 다 붙인다
- NetworkPolicy(`deploy/k8s/02-networkpolicy.yaml`, bootstrap이 configmap 직후 적용): `tier=db` 파드의 3306 · 6379 ingress는 네임스페이스 `sesac-gojigi`의 `tier=backend` 파드만, `tier=db` 파드 egress는 kube-dns 53뿐. 정책 이름은 `db-ingress-from-backend` · `db-egress-deny-except-dns`. 다른 네임스페이스(monitoring 등)에서 DB에 직접 붙지 않는다
- 이미지 태그: 커밋 SHA 7자리. `latest` 금지
- 모든 컨테이너에 `resources.requests` 필수, 메모리 `limits` 필수

### 5-4. 환경 변수 · 설정

- 환경 변수: UPPER_SNAKE (`DB_HOST` · `PRODUCT_SERVICE_URI` · `PORTONE_API_SECRET`)
- 다른 서비스 주소: `{대상}_SERVICE_URI`
- `application.yml` 커스텀 키: `app.{영역}.{이름}` kebab-case (`app.order.auto-confirm-after`)
- 프론트: `VITE_{이름}` (`VITE_PORTONE_STORE_ID`)

### 5-5. Serverless · CI

- 함수 폴더: kebab-case — `order-notification` · `settlement-report` · `log-archive` · `upload-guard`(10/27) (4개, 사용자 API 없음), 서비스 이름 `sesac-gojigi-{폴더명}`
- 핸들러 파일 camelCase (`notify.js`), export 이름 `handler`
- 워크플로 파일: 영역 이름 kebab-case, job 이름 kebab-case (`bump-tag`). 저장소별 — gotgan-backend `backend.yml` · `serverless.yml` · `security.yml` / gotgan-frontend `frontend.yml` · `security.yml` / gotgan-config `infra.yml` · `infra-schedule.yml` · `bootstrap.yml` · `secrets-sync.yml` · `security.yml`
- GitHub Secrets: UPPER_SNAKE (`AWS_ROLE_ARN` · `SERVERLESS_ACCESS_KEY` · `CONFIG_REPO_TOKEN` · `{SERVICE}_DB_PASSWORD`), Variables도 UPPER_SNAKE (`AWS_REGION`)
- 저장소 간 토큰 `CONFIG_REPO_TOKEN`: fine-grained PAT, gotgan-config만 · Contents write만, 만료일은 발표(11/20) 이후

---

## 6. 리뷰 체크리스트

**백엔드**

- [ ] 도메인 패키지 안에 controller · service · repository · entity · dto · exception 구조인가?
- [ ] 컨트롤러가 얇은가? `@CurrentUser`로 받아 원시값을 서비스에 넘기는가?
- [ ] 응답이 `ResponseEntity<ApiResponse<T>>`인가? 컨트롤러에서 `error()`를 직접 호출하지 않는가?
- [ ] `RuntimeException` 대신 도메인 예외 + ErrorCode를 쓰는가? 새 코드가 `{도메인}_{상황}` 형식이고 `docs/api/error-codes.md`에 있는가?
- [ ] 엔티티에 `@Setter`가 없고 상태 변경이 의미 있는 메서드인가?
- [ ] `@Transactional`이 서비스에만 있고, 원격 호출이 트랜잭션 밖에 있는가?
- [ ] 다른 서비스 호출에 Resilience4j 표준(타임아웃 · 서킷 브레이커 · 멱등 GET만 재시도 · 폴백)이 적용되고 실패가 도메인 예외로 변환되는가?
- [ ] 대시보드 조합이 병렬 호출이고, 한 서비스가 실패해도 `unavailable` 부분 응답(200)을 주는가? 연쇄 호출(2홉 이상)이 없는가?
- [ ] admin-service에 entity · repository · DB 접근이 없고(예외 `report` — admindb), 도메인 서비스에 `/api/admin/**`이 없는가?
- [ ] 동적 검색이 QueryDSL이고, `@Query` · 네이티브 쿼리에 문자열 이어 붙이기가 없는가?
- [ ] 사용자 입력 HTML(리뷰 · 문의 · 입점 신청)을 저장 전에 Sanitizer로 정화하는가?
- [ ] 소유권 검사(storeId · userId)가 있는가?
- [ ] 이벤트 · Saga 참여 API가 멱등이고 테스트가 있는가?
- [ ] 비밀 값 · 개인정보가 로그에 없는가?

**DB**

- [ ] 테이블명이 단수형 snake_case인가? (`orders` · `users`만 예외)
- [ ] PK가 `{테이블}_id` 단일 BIGINT AUTO_INCREMENT인가?
- [ ] 같은 서비스 참조에는 FK, 다른 서비스 ID에는 인덱스 + COMMENT가 있는가?
- [ ] 유일해야 하는 값에 UNIQUE가 있는가?
- [ ] 시간 컬럼이 DATETIME(6)이고 TIMESTAMP가 없는가?
- [ ] `created_at`은 DEFAULT, `updated_at`은 DEFAULT + ON UPDATE, 비즈니스 시각은 DEFAULT 없음인가?
- [ ] ENUM 대신 VARCHAR + COMMENT(허용값)인가?
- [ ] 금액 BIGINT · 비율 DECIMAL · 카운트 UNSIGNED인가?
- [ ] utf8mb4 · InnoDB · 컬럼 순서 · 모든 COMMENT가 있는가?
- [ ] 머지된 Flyway 파일을 수정하지 않았는가?

**프론트엔드**

- [ ] 컴포넌트는 `.jsx`, 그 외는 `.js`인가? (TypeScript 파일이 섞이지 않았는가)
- [ ] 페이지는 `pages/`, 로직은 `features/{도메인}`에 있는가? 관리자 화면은 `features/admin`에서 `/api/admin/**`만 호출하는가?(예외: 상담함 `features/chat`)
- [ ] queryKey를 팩토리에서만 만들었는가?
- [ ] 변경 후 관련 queryKey를 무효화하는가?
- [ ] 서버 데이터를 Zustand에 복사하지 않았는가?
- [ ] TanStack Table `state`의 배열 · 함수 참조가 안정적인가?
- [ ] 로딩 · 에러 · 빈 상태를 처리했는가?
- [ ] 목업 디자인 토큰 · 공통 클래스를 썼는가? 375px에서 깨지지 않는가?
- [ ] 다른 도메인 `features/`를 수정하지 않았는가?

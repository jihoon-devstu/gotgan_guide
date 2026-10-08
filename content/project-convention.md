# 곳간(GOTGAN) 코드 컨벤션

> 이 문서는 **규칙** 문서입니다. 규칙을 바꾸려면 팀 합의 후 이 문서를 수정하는 PR을 올립니다.
> 기반: 팀이 이전 프로젝트에서 쓰던 컨벤션(`convention/` 폴더 6종) + 이번 프로젝트의 MSA · AWS 구조에 맞춘 추가 규칙
> 관련 문서: `project-spec.html`(무엇을 만드나) · `project-guideline.html`(왜 이렇게 만드나)

---

## 0. 개요

### 0-1. 판단 원칙

- **"어떻게 쓰나"는 팀 기존 규칙 우선** — 코드 스타일 · 네이밍 · 응답 형식 · 예외 구조 · DB 규칙
- **"무엇을 만드나"는 프로젝트 스펙 유지** — 서비스 6개 · 엔드포인트 · 이벤트 · 인프라 구성
- **MSA 전용 규칙 추가** — 서비스 간 호출 · 이벤트 · Saga · 멱등성 · 인프라 네이밍
- 규칙끼리 충돌하면 이 문서가 우선, 다른 문서는 이 문서에 맞춰 수정

### 0-2. 기존 컨벤션 대비 변경 사항

| 항목 | 기존(따숨) | 곳간 | 이유 |
|---|---|---|---|
| 패키지 | 도메인형, 엔티티는 `domain/` | 도메인형, 엔티티는 **`entity/`**, 서비스 호출용 **`client/`** 추가 | 팀 합의(엔티티 패키지명) · 서비스 간 HTTP 호출 |
| 보안 위치 | 각 앱 `common/security` | **게이트웨이에만** Spring Security, 업무 서비스는 `common/auth`(헤더 → 사용자) | JWT 검증은 게이트웨이 한 곳 |
| 로그인 사용자 | `SecurityUtil.getMemberId()` | `@CurrentUser AuthUser` (게이트웨이가 넣은 `X-User-*` 헤더) | 업무 서비스에 SecurityContext 없음 |
| FK 제약 | 참조 컬럼 FK 필수 | **같은 서비스 안에서만 FK 필수**, 다른 서비스 ID는 논리 참조 + 인덱스 | DB per Service |
| 회원 테이블 · 패키지 | `member` · `member/` | **`users` · `user/`** | 서비스(user-service) · 스키마(userdb) 이름과 일치 |
| 테이블명 예외 | 단수형 | 단수형 유지, **`orders`**(예약어 `order`) · **`users`**(키워드 `user`)만 예외 | MySQL 예약어 · 키워드 |
| 에러 코드 | 번호형 `ORDER_003` | **의미형 `ORDER_OUT_OF_STOCK`** | 코드만 봐도 의미 · 로그 검색 |
| 시드 데이터 | `db/seed` V100~ | `db/seed/R__*.sql` (반복 실행) | 내용 수정 시 체크섬 오류 없음 |
| 프론트 언어 | TypeScript | **JavaScript** (`.js` / `.jsx`) | 목업 그대로 이식 · 입문자 부담 최소화 |
| 프론트 UI 키트 | shadcn/ui · recharts · sonner | **목업 컴포넌트 · 목업 SVG 차트 · 목업 토스트** | 목업 디자인 원칙 유지 |
| 프론트 관리자 | `features/admin` 공유 도메인 | **관리자 화면도 각 도메인 feature에** (`features/store`의 입점 심사 등) | 도메인 담당 = 폴더 담당, 공유 폴더 충돌 없음 |
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
| 8 | Redis 키 이름 | `refresh:` · `blacklist:` — `{용도}:{식별자}` | 2-2 |

---

## 1. 공통 — Git · 협업

### 1-1. 브랜치

- `main` — 보호 브랜치. 직접 push 금지, PR + 승인 1명 + CI 통과 후 Squash merge
- 작업 브랜치: `feat/{도메인}-{작업}` (예: `feat/order-payment-verify`, `feat/infra-eks-cluster`)
- 그 외: `fix/` · `refactor/` · `docs/` · `chore/`(빌드 · 설정)
- 도메인 값: `auth` `user` `store` `product` `order` `settlement` `gateway` `front`(프론트 공통) `infra` `cicd` `obs`(관측성) `sls`(서버리스)

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

### 1-4. 폴더 소유권

- **다른 사람이 맡은 서비스 · `features/` 폴더는 PR 없이 수정 금지.** 연동이 필요하면 이슈로 요청
- 공유 파일(`shared/api/queryKeys.js` · `app/router.jsx` · `01-configmap.yaml` · `values.yaml`)은 **도메인별 주석 구획 안에서만** 수정
- CODEOWNERS로 리뷰어 자동 지정

### 1-5. 시크릿

- `application.yml` · `.env` · YAML에 실제 비밀 값 커밋 금지 — `${환경변수}` 자리표시자만
- 비밀 값 위치: Secrets Manager(서버) · GitHub Secrets(CI) · Vercel 환경 변수(프론트)
- 실수로 커밋했다면 즉시 팀 공유 → 키 폐기 · 재발급 (히스토리 삭제만으로는 부족)

---

## 2. 백엔드

### 2-1. 패키지 구조

도메인형 구조. 최상위를 계층(controller/service …)으로 나누지 않습니다.

```
com.sesac.team1.{service}            # service = gateway · user · store · product · order · settlement
├── {Service}Application.java
├── common                           # 도메인에 속하지 않는 공통 모듈 (서비스 템플릿에서 복사)
│   ├── config                       # @Configuration — Redis · RestClient · Scheduling(ShedLock) · WebMvc · Swagger · AWS
│   ├── dto                          # ApiResponse · PageResponse
│   ├── exception                    # ErrorCode · CommonErrorCode · BusinessException · GlobalExceptionHandler
│   ├── auth                         # @CurrentUser · AuthUser · CurrentUserArgumentResolver
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
- gateway-service는 예외: `config` · `filter` · `exception`만, DB 없음

**서비스별 도메인**

| 서비스 | 도메인 패키지 |
|---|---|
| user-service | `auth`(가입 · 로그인 · 토큰) · `user`(회원 · 배송지 · 관리자 회원) |
| store-service | `apply`(입점 신청 · 심사 · 서류) · `store` · `category`(카테고리 · 수수료) |
| product-service | `product` · `option`(옵션 · 재고) · `stock`(예약 · 해제) · `image` |
| order-service | `cart` · `order` · `payment` · `saga` |
| settlement-service | `settlement`(적재 · 집계 · 지급 · 보류) |

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
| 컨트롤러 | 구매자 · 공개 `{X}Controller` / 판매자 `Seller{X}Controller` / 관리자 `Admin{X}Controller` / 내부 `Internal{X}Controller` | `OrderController` · `SellerOrderItemController` · `InternalStockController` |
| 서비스 | `{X}Service` · Saga `{행위}Saga` · 스케줄러 `{행위}Scheduler` | `PaymentService` · `PlaceOrderSaga` · `AutoConfirmScheduler` |
| 레포지토리 | `{Entity}Repository` · Redis `{X}RedisRepository` | `OrderItemRepository` · `CartRedisRepository` |
| 클라이언트 | `{대상}Client` | `ProductClient` · `PortOneClient` |
| 이벤트 리스너 | `{이벤트}Listener` | `StoreApprovedListener` |
| 설정 | `{대상}Config` | `RestClientConfig` |

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
| `refresh:{userId}:{tokenId}` | user | 리프레시 토큰 |
| `blacklist:{jti}` | user · gateway | 로그아웃한 Access Token |
| `cart:{userId}` | order | 장바구니 Hash |
| `product::{productId}` | product | `@Cacheable` 캐시 (Spring 기본 형식) |

- 한 Redis를 여러 서비스가 공유하므로 **다른 서비스의 키 접두어 사용 금지**

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
| 관리자 | `/api/admin/{자원}` | `PATCH /api/admin/applications/7/approve` |
| 서비스 간 | `/internal/{자원}` | `POST /internal/stock/reservations` — 게이트웨이에 라우트 없음 |
| 본인 | `/me` | `GET /api/users/me` · `GET /api/orders/me` |

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
└── BusinessException (common.exception)          ← 모든 비즈니스 예외의 부모
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
| `AUTH` · `USER` | user | `AUTH_DUPLICATE_EMAIL` 이메일 중복 · `USER_NOT_FOUND` 회원 없음 |
| `APPLY` · `STORE` · `CATEGORY` | store | `APPLY_REAPPLY_RESTRICTED` 재신청 제한 기간 |
| `PRODUCT` · `STOCK` | product | `STOCK_INSUFFICIENT` 재고 부족 |
| `CART` · `ORDER` · `PAYMENT` | order | `PAYMENT_AMOUNT_MISMATCH` 결제 금액 불일치 |
| `SETTLE` | settlement | `SETTLE_ALREADY_AGGREGATED` 이미 집계된 주차 |
| 공통 (도메인 접두어 없음) | 전체 | `SUCCESS` · `INVALID_INPUT` · `UNAUTHORIZED` · `FORBIDDEN` · `NOT_FOUND` · `EXTERNAL_API_ERROR` · `GLOBAL_ERROR` |

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
  - 연결 실패 · 타임아웃 · 5xx → `EXTERNAL_API_ERROR`(502/504) + Saga 보상
- 게이트웨이 필터 체인(WebFlux) 안에서는 `BusinessException`을 던지지 않음 — 전용 핸들러가 JSON으로 응답

### 2-6. 트랜잭션 · 데이터 접근

- `@Transactional`은 **서비스 계층에만**. 컨트롤러 · 레포지토리 금지
- 조회 전용은 `@Transactional(readOnly = true)`, DB 쓰기가 없으면 붙이지 않음 (Redis는 JPA 트랜잭션 대상 아님)
- **원격 호출(다른 서비스 · 포트원 · SNS 발행)을 DB 트랜잭션 안에 넣지 않음** — Saga 오케스트레이터 메서드에는 `@Transactional` 금지
- 이벤트 발행은 커밋 이후 — `@TransactionalEventListener(phase = AFTER_COMMIT)` (또는 Outbox)
- 부가 작업 실패가 본 작업을 실패시키면 안 될 때는 격리하고 로그만 (예: 캐시 무효화 실패)
- 원자성이 필요한 작업은 한 트랜잭션 (예: 상품주문 상태 변경 + 이력 기록)
- Repository는 Spring Data JPA 쿼리 메서드 네이밍(`findByStoreIdAndStatus`, `existsByEmail`)
- 동적 조건 검색은 `JpaSpecificationExecutor` 또는 `@Query`
- 동시성: 재고처럼 경합하는 값은 **조건부 UPDATE**(`@Modifying @Query`), 엔티티 동시 수정은 `@Version`
- **서비스 메서드는 `userId` · `storeId` 등 원시값을 파라미터로 받음** — 테스트 · 스레드 안전성

### 2-7. MSA 규칙 (신규)

**서비스 간 동기 호출**

- 호출은 `{domain}/client/{대상}Client` 인터페이스(`@HttpExchange`)로만, service에서만 사용
- 받는 쪽은 `Internal{X}Controller` + `/internal/**`
- 주소는 환경 변수 `{대상}_SERVICE_URI` (클러스터: CoreDNS 이름)
- 타임아웃 필수: 연결 2초 · 읽기 3초 (`common/config/RestClientConfig`)
- 화면 조합을 위한 연쇄 호출 금지 — 대시보드처럼 여러 서비스 데이터가 필요하면 프론트가 병렬 호출

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
- 관리자 수동 실행이 필요한 작업은 같은 service 메서드를 Admin API로도 노출

### 2-8. 로깅

- `@Slf4j` 사용. `System.out.println` · `e.printStackTrace()` 금지
- 레벨
  - `error` — 사람이 봐야 하는 실패, 스택트레이스 포함 (`log.error("포트원 취소 실패 - paymentId={}", paymentId, e)`)
  - `warn` — 처리는 됐지만 주의 (재고 부족, 금액 불일치 감지, 재시도)
  - `info` — 상태 변화 (주문 PAID, Saga 보상 완료, 정산 집계 완료)
  - `debug` — 개발 확인용 (운영 미출력)
- 로그 메시지에 업무 키 포함: `orderNo` · `sagaId` · `paymentId` (MDC 또는 메시지)
- **비밀번호 · 토큰 · 포트원 키 · 카드 정보 · 이메일 · 전화 · 주소는 info 이상에 남기지 않음**
- 형식은 JSON (공통 `logback-spring.xml`), traceId 자동 포함 — 형식 임의 변경 금지

### 2-9. API 문서 (Swagger)

- springdoc 애노테이션: 클래스 `@Tag`, 메서드 `@Operation` + `@ApiResponses` + `@Parameter`
- description에 **인가 요건**(공개 / BUYER / SELLER / ADMIN / 내부)과 **비즈니스 에러 코드** 기재
- 공통 `common.dto.ApiResponse`와 Swagger `ApiResponse`가 동명 — Swagger 쪽은 import하지 않고 **FQN**(`@io.swagger.v3.oas.annotations.responses.ApiResponse`)
- 접속: 각 서비스 `http://localhost:{port}/swagger-ui.html` · 명세 파일은 `docs/api/{service}.yaml`로 내보내 PR에 포함

### 2-10. 테스트

- 클래스: 단위 `{대상}Test` · 통합 `{대상}IntegrationTest`
- 메서드: `{메서드}_{상황}_{결과}` + `@DisplayName`(한국어)
  - `ship_배송준비가_아니면_예외()` + `@DisplayName("배송준비 상태가 아니면 송장을 등록할 수 없다")`
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
- 매핑 테이블도 단수형: `user_role` · `product_option`
- 모든 테이블에 `COMMENT` 필수
- 서비스별 스키마: `userdb` · `storedb` · `productdb` · `orderdb` · `settlementdb`

**서비스별 테이블 이름**

| 스키마 | 테이블 |
|---|---|
| userdb | `users` · `user_role` · `address` |
| storedb | `store_application` · `application_document` · `store` · `category` · `category_commission` · `processed_event` · `shedlock` |
| productdb | `product` · `product_option` · `product_image` · `stock_reservation` · `processed_event` |
| orderdb | `orders` · `order_item` · `order_store_shipment` · `order_item_history` · `payment` · `saga_instance` · `outbox_event` · `shedlock` |
| settlementdb | `settlement_item` · `settlement` · `payout` · `processed_event` · `shedlock` |

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
- 시드: `db/seed/R__demo_seed.sql` (local · dev 프로필만, 수정하면 재실행)
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
| 빌드 | Vite 6 · Node.js 20 LTS | `import.meta.env.VITE_*` |
| 라우팅 | React Router v7 | 라우트 정의는 `app/router.jsx` **단일 파일** |
| 서버 상태 | TanStack Query v5 | API 데이터는 전부 여기서 (4-6) |
| 클라이언트 상태 | Zustand | `authStore` — accessToken · user · isAuthReady / UI 상태 |
| 표 | TanStack Table v8 | 4-7 |
| 폼 | react-hook-form + zod | 스키마는 `features/{domain}/schemas.js` |
| HTTP | Axios | `withCredentials: true` 고정 · 상대경로 `/api/...` |
| 스타일 | Tailwind CSS v4 | 디자인 토큰은 `styles/index.css`의 `@theme` (목업 토큰) |
| UI 컴포넌트 | 목업 공통 컴포넌트 | `shared/components/ui/` — shadcn 등 새 UI 키트 도입 안 함 |
| 차트 · 토스트 | 목업 SVG 차트 · 목업 ToastHost | 새 라이브러리 도입 시 팀 합의 |
| 결제 | `@portone/browser-sdk` | `features/order`에서만 |
| 목킹 | MSW | `src/mocks/` |
| 테스트 | Vitest + React Testing Library | 대상: 유틸 · zod 스키마 · 핵심 훅 |

### 4-2. 프로젝트 구조

도메인(기능) 기반 구조. **백엔드 도메인 패키지와 `features/{도메인}`이 1:1 대칭.**

```
frontend/src/
├── app/                          # 앱 전역
│   ├── router.jsx                #   전체 라우트 (단일 파일, 도메인별 주석 구획)
│   ├── providers.jsx             #   QueryClientProvider 등
│   ├── bootstrap.js              #   부팅 시 refresh 1회 → 로그인 상태 복구
│   └── App.jsx
├── pages/                        # 라우트 1개 = 페이지 파일 1개. features 조립만
│   ├── shop/                     #   메인 · 상품 · 스토어 · 장바구니 · 주문서 · 로그인 · 입점 신청
│   ├── mypage/                   #   주문 · 클레임 · 회원정보 · 배송지
│   ├── seller/                   #   판매자센터
│   └── admin/                    #   관리자
├── features/                     # 도메인별 구현 (담당 경계 = 폴더 경계)
│   ├── auth/                     #   로그인 · 가입 · authStore · 가드
│   ├── user/                     #   회원정보 · 배송지 · 관리자 회원
│   ├── store/                    #   입점 신청 · 스토어 · 입점 심사 · 카테고리
│   ├── product/                  #   상품 목록 · 상세 · 판매자 상품
│   ├── order/                    #   장바구니 · 주문 · 결제 · 판매자 주문
│   └── settlement/               #   정산 (판매자 · 관리자)
│       ├── api/                  #     settlementApi.js
│       ├── hooks/                #     useSettlementsQuery.js · usePaySettlementMutation.js
│       ├── components/
│       └── schemas.js            #     zod
├── shared/                       # 도메인에 속하지 않는 공통
│   ├── api/                      #   axiosInstance.js · queryKeys.js · refresh.js(single-flight)
│   ├── components/ui/            #   목업 공통 컴포넌트 (Pill · Price · Modal · Kpi · BarChart …)
│   ├── components/common/        #   RequireRole · ConfirmModal · EmptyState · SortableHeader
│   ├── layouts/                  #   ShopLayout · MyPageLayout · ConsoleLayout
│   ├── hooks/  stores/  utils/
├── mocks/                        # MSW handlers · fixtures
└── styles/index.css              # Tailwind 진입 · @theme 디자인 토큰
```

**운영 규칙**

1. **관리자 화면도 해당 도메인 feature에 둔다** (입점 심사 → `features/store`, 정산 관리 → `features/settlement`). `features/admin` 같은 공유 도메인을 만들지 않음
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
| `/mypage/**` | 마이페이지 | BUYER |
| `/seller` · `/seller/**` | 판매자센터 | SELLER |
| `/admin` · `/admin/**` | 관리자 | ADMIN |

- 가드: `<RequireRole role="SELLER">` — **`authStore.user.roles`로 판단** (토큰 직접 디코딩 안 함)
- `isAuthReady` 이전에는 판단하지 않음 (새로고침 시 잘못된 리다이렉트 방지)
- **프론트 가드는 UX 장치일 뿐, 실제 접근 제어는 게이트웨이 · 서비스**
- `router.jsx`는 영역 · 도메인별 주석 구획에만 추가, catch-all(`*`)은 항상 맨 마지막

### 4-4. 인증

| 항목 | Access Token | Refresh Token |
|---|---|---|
| 저장 | `authStore`(Zustand) 메모리 | HttpOnly 쿠키 (JS 접근 불가) |
| 전송 | `Authorization: Bearer {AT}` | 브라우저 자동 (같은 출처 · Vercel rewrite) |
| 서버 저장 | 없음 (로그아웃 시 blacklist만) | Redis `refresh:{userId}:{tokenId}` |
| 재발급 | `POST /api/auth/refresh` | 로테이션 |

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

### 4-7. TanStack Table 규칙

- **데모 규모(수백 건 이하) 목록은 전체 1회 로드 + 클라이언트에서 검색 · 정렬 · 페이징** (관리자 입점 심사 · 스토어 · 회원 · 정산, 판매자 상품)
- 건수가 계속 늘어나는 목록(판매자 주문, 구매자 상품 목록)은 **서버 페이징**(`manualPagination` · `manualSorting`)
- 정렬 헤더는 `shared/components/common/SortableHeader.jsx` 재사용
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
- **CORS 에러** — 절대경로(`http://...`)로 호출하고 있지 않은지. 로컬은 Vite 프록시, 배포는 Vercel rewrite — 항상 상대경로 `/api/...`
- **`import.meta.env.VITE_...`가 undefined** — `VITE_` 접두사, `.env.local` 수정 후 dev 서버 재시작, Vercel은 환경 변수 추가 후 재배포
- **포트원 결제창이 안 뜸** — storeId · channelKey 환경 변수, 테스트 채널 키인지, 브라우저 팝업 차단

---

## 5. 인프라 · 배포 네이밍

### 5-1. AWS 자원

- 이름: `sesac-team1-{용도}` (kebab-case) — `sesac-team1-eks-cluster` · `sesac-team1-order-events`
- 모든 자원 태그: `Project=sesac-team1` · `ManagedBy=terraform` (콘솔에서 만든 자원은 `ManagedBy=manual` + 이슈 기록)
- 계정 ID · 리전 하드코딩 금지 — `data.aws_caller_identity` · 변수 사용

| 자원 | 규칙 | 예 |
|---|---|---|
| SNS 토픽 | `sesac-team1-{도메인}-events` | `sesac-team1-order-events` |
| SQS 큐 | `sesac-team1-{소비자}-{도메인}-events` | `sesac-team1-settlement-order-events` |
| DLQ | 큐 이름 + `-dlq` | `sesac-team1-settlement-order-events-dlq` |
| IAM 역할 (IRSA) | `sesac-team1-{service}-irsa` | `sesac-team1-order-irsa` |
| Secrets Manager | `sesac-team1/{service}` | `sesac-team1/order-service` |
| SSM 파라미터 | `/sesac-team1/dev/{종류}/{이름}` | `/sesac-team1/dev/sqs/notification-queue-arn` |
| S3 버킷 | `sesac-team1-{용도}-{계정ID 끝 4자리}` (전역 유일) | `sesac-team1-product-images-1234` |
| DynamoDB | `sesac-team1-{용도}` | `sesac-team1-notifications` |

### 5-2. Terraform

- 파일: 자원 종류별 snake_case (`sns_sqs.tf` · `irsa.tf`), 폴더마다 `provider.tf` · `variables.tf` · `outputs.tf`
- 자원 로컬 이름: snake_case, 타입 반복 금지 (`aws_s3_bucket.product_images` ○ / `aws_s3_bucket.product_images_bucket` ✗)
- 변수 · output: snake_case + `description` 필수
- 커밋 전 `terraform fmt -recursive` · `terraform validate`
- apply는 AWS 담당만, 다른 사람은 plan까지
- `.terraform.lock.hcl` 커밋, `*.tfstate` · `.terraform/` 커밋 금지

### 5-3. Kubernetes · Helm

- 리소스 이름: 서비스 이름 그대로 kebab-case (`order-service`)
- 라벨: `app: {service}` 필수 (Service selector · Prometheus · 로그 라벨 기준)
- 파일 이름: 적용 순서가 있으면 `{nn}-{종류}.yaml` (`00-namespace.yaml`), 그 외 `{대상}.yaml`
- YAML 들여쓰기 2칸, 탭 금지
- 네임스페이스: 앱 `sesac-team1` · 모니터링 `monitoring` · `argocd`
- Helm `values.yaml` 키는 camelCase, 서비스 키는 서비스 이름 (`services.order-service.tag`)
- 이미지 태그: 커밋 SHA 7자리. `latest` 금지
- 모든 컨테이너에 `resources.requests` 필수, 메모리 `limits` 필수

### 5-4. 환경 변수 · 설정

- 환경 변수: UPPER_SNAKE (`DB_HOST` · `PRODUCT_SERVICE_URI` · `PORTONE_API_SECRET`)
- 다른 서비스 주소: `{대상}_SERVICE_URI`
- `application.yml` 커스텀 키: `app.{영역}.{이름}` kebab-case (`app.order.auto-confirm-after`)
- 프론트: `VITE_{이름}` (`VITE_PORTONE_STORE_ID`)

### 5-5. Serverless · CI

- 함수 폴더: kebab-case (`order-notification`), 서비스 이름 `sesac-team1-{폴더명}`
- 핸들러 파일 camelCase (`notify.js`), export 이름 `handler`
- 워크플로 파일: 영역 이름 kebab-case (`backend.yml`), job 이름 kebab-case (`bump-tag`)
- GitHub Secrets: UPPER_SNAKE (`AWS_ROLE_ARN` · `SERVERLESS_ACCESS_KEY`)

---

## 6. 리뷰 체크리스트

**백엔드**

- [ ] 도메인 패키지 안에 controller · service · repository · entity · dto · exception 구조인가?
- [ ] 컨트롤러가 얇은가? `@CurrentUser`로 받아 원시값을 서비스에 넘기는가?
- [ ] 응답이 `ResponseEntity<ApiResponse<T>>`인가? 컨트롤러에서 `error()`를 직접 호출하지 않는가?
- [ ] `RuntimeException` 대신 도메인 예외 + ErrorCode를 쓰는가? 새 코드가 `{도메인}_{상황}` 형식이고 `docs/api/error-codes.md`에 있는가?
- [ ] 엔티티에 `@Setter`가 없고 상태 변경이 의미 있는 메서드인가?
- [ ] `@Transactional`이 서비스에만 있고, 원격 호출이 트랜잭션 밖에 있는가?
- [ ] 다른 서비스 호출에 타임아웃이 있고 실패가 도메인 예외로 변환되는가?
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
- [ ] 페이지는 `pages/`, 로직은 `features/{도메인}`에 있는가?
- [ ] queryKey를 팩토리에서만 만들었는가?
- [ ] 변경 후 관련 queryKey를 무효화하는가?
- [ ] 서버 데이터를 Zustand에 복사하지 않았는가?
- [ ] TanStack Table `state`의 배열 · 함수 참조가 안정적인가?
- [ ] 로딩 · 에러 · 빈 상태를 처리했는가?
- [ ] 목업 디자인 토큰 · 공통 클래스를 썼는가? 375px에서 깨지지 않는가?
- [ ] 다른 도메인 `features/`를 수정하지 않았는가?

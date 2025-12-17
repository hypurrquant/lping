# LPing - Product Documentation

## 개요

**LPing**은 Aerodrome Finance의 Concentrated Liquidity(CL) 포지션을 실시간으로 모니터링하는 Base App 미니앱입니다.

- **프로젝트 타입**: Farcaster Mini App (Base App)
- **배포 URL**: https://lping.vercel.app/
- **주요 타겟**: Base 체인에서 LP 활동을 하는 DeFi 사용자

---

## 기술 스택

| 카테고리 | 기술 |
|---------|------|
| **프레임워크** | Next.js 15.3.4 (App Router) |
| **언어** | TypeScript 5 |
| **UI** | React 19, Recharts 3.3.0 |
| **블록체인** | Viem 2.31.6, Wagmi 2.16.3 |
| **지갑 연동** | OnchainKit (Coinbase) |
| **Farcaster** | @farcaster/miniapp-sdk, @farcaster/quick-auth |
| **상태 관리** | TanStack React Query 5.81.5 |
| **배포** | Vercel |

---

## 프로젝트 구조

```
lping/
├── app/
│   ├── api/                      # API 엔드포인트
│   │   ├── cl-positions/         # CL 포지션 조회 (핵심 API)
│   │   ├── wallet-lp/            # 지갑 LP 발견
│   │   ├── auth/                 # Farcaster 인증
│   │   ├── webhook/              # Base App 웹훅
│   │   ├── dex/                  # DEX 데이터
│   │   └── subgraph/             # Aerodrome Subgraph
│   ├── lp/                       # LP 트래커 페이지
│   │   ├── page.tsx
│   │   ├── types.ts
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   ├── components/               # 공통 컴포넌트
│   ├── hooks/                    # 공통 훅
│   ├── page.tsx                  # 랜딩 페이지
│   ├── layout.tsx
│   └── globals.css
├── lib/                          # 유틸리티
│   ├── abis.ts                   # 스마트 컨트랙트 ABI
│   ├── addresses.ts              # 컨트랙트 주소
│   ├── poolWhitelist.ts          # 화이트리스트 풀
│   └── viemClient.ts             # Viem 클라이언트
├── scripts/                      # 빌드 스크립트
└── public/                       # 정적 파일
```

---

## 페이지 구성

### 1. 랜딩 페이지 (`/`)

**기능:**
- 서비스 소개 및 가치 제안
- "Launch App" CTA 버튼
- LP 수익 계산기 (`LPCalculator`)
- 다크/라이트 모드 지원

### 2. LP 트래커 (`/lp`)

**핵심 기능:**
- Concentrated Liquidity 포지션 테이블
- 포트폴리오 개요 (총 자산, 클레임 가능 보상, 예상 수익, 평균 APR)
- 포지션별 상세 정보 (확장 가능)
- 정렬 기능 (Value, APR, Daily Rewards, Pair)
- 주소 검색으로 타 지갑 조회

**포지션 테이블 컬럼:**
| Pair | Value (USD) | Price Range | Earned (USD) | APR | Status |
|------|-------------|-------------|--------------|-----|--------|

**확장 시 표시 정보:**
- 자산 구성 (Token0, Token1 비율)
- 스테이킹 보상 (일/주/월/년)
- 현재 가격 및 범위 정보
- 풀 통계 (TVL, 24h 볼륨, 수수료)

---

## API 엔드포인트

### `GET /api/cl-positions`

**핵심 API** - Concentrated Liquidity 포지션 조회

**Query Parameters:**
- `owner` (필수): 지갑 주소

**Response:**
```typescript
{
  positions: Array<{
    tokenId: string;
    pool: Address;
    token0: Address;
    token1: Address;
    liquidity: string;
    isStaked: boolean;
    isActive: boolean;
    estimatedValueUSD: string;
    estimatedAPR: string;
    earnedAmountUSD: string;
    priceRange: { lower: string; upper: string };
    // ... 60+ 필드
  }>
}
```

### `GET /api/wallet-lp`

지갑의 LP 토큰 발견 (Alchemy API 활용)

### `GET /api/auth`

Farcaster Quick Auth JWT 검증

### `POST /api/webhook`

Base App 채팅 에이전트 웹훅

---

## 주요 컴포넌트

### LP 페이지 컴포넌트 (`app/lp/components/`)

| 컴포넌트 | 기능 |
|---------|------|
| `Header.tsx` | 헤더 (로고, 가이드, 지갑, 설정) |
| `PortfolioOverview.tsx` | 포트폴리오 통계 카드 |
| `WalletMenu.tsx` | 지갑 주소 드롭다운 |
| `SettingsMenu.tsx` | 설정 (다크모드, 언어) |
| `ShareButton.tsx` | 포지션 공유 |
| `PerformanceChart.tsx` | 성능 차트 (Recharts) |

### 공통 컴포넌트 (`app/components/`)

| 컴포넌트 | 기능 |
|---------|------|
| `LPCalculator.tsx` | LP 수익 계산기 |
| `MiniAppInitializer.tsx` | MiniKit SDK 초기화 |
| `LocaleFix.tsx` | 로케일 문제 회피 |

---

## 훅 (Hooks)

### LP 페이지 훅 (`app/lp/hooks/`)

- **`usePositions.ts`**: 포지션 데이터 페칭 및 캐싱
- **`useTheme.ts`**: 다크/라이트 테마 관리

### 공통 훅 (`app/hooks/`)

- **`useQuickAuth.ts`**: Farcaster Quick Auth
- **`useMiniAppNavigation.ts`**: Mini App 네비게이션

---

## 외부 서비스 연동

### 블록체인/DeFi

| 서비스 | 용도 |
|--------|------|
| **Aerodrome Finance** | CL 풀 데이터, Gauge 보상 |
| **Aerodrome Subgraph** | TVL, 볼륨, 수수료 데이터 |
| **Enso Finance API** | 토큰 가격 조회 |
| **Alchemy** | RPC, 토큰 잔액 조회 |

### Farcaster/Base

| 서비스 | 용도 |
|--------|------|
| **OnchainKit** | 스마트 월렛 연동, Mini App 프레임워크 |
| **Farcaster Quick Auth** | JWT 기반 사용자 인증 |
| **MiniApp SDK** | Mini App 컨텍스트, 네비게이션 |

---

## 핵심 컨트랙트 주소

```typescript
// Aerodrome Core
AERODROME_NPM = "0x827922686190790b37229fd06084350E74485b72"
AERODROME_CL_FACTORY = "0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A"
SUGAR_HELPER = "0x0AD09A66af0154a84e86F761313d02d0abB6edd5"

// 주요 토큰
WETH = "0x4200000000000000000000000000000000000006"
USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
AERO = "0x940181a94A35A4569E4529A3CDfB74e38FD98631"
cbBTC = "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf"
```

---

## 데이터 타입

### CLPosition (`app/lp/types.ts`)

주요 필드:

```typescript
interface CLPosition {
  // 기본 정보
  tokenId: string;
  pool: Address;
  token0: Address;
  token1: Address;
  liquidity: string;

  // 상태
  isActive: boolean;      // In-Range 여부
  isStaked: boolean;      // Gauge 스테이킹 여부

  // 가치
  estimatedValueUSD: string;
  estimatedAmount0: string;
  estimatedAmount1: string;

  // 보상
  earnedAmountUSD: string;
  rewardRate: string;
  estimatedAPR: string;

  // 풀 정보
  poolTVL: string;
  poolVolume24h: string;
  poolFees24h: string;
  poolFeeAPR: string;
}
```

---

## 환경 변수

```env
NEXT_PUBLIC_ONCHAINKIT_API_KEY=     # OnchainKit API 키
NEXT_PUBLIC_BASE_BUILDER_ADDRESS=   # Base Builder 주소
NEXT_PUBLIC_ROOT_URL=               # 루트 URL
ALCHEMY_BASE_KEY=                   # Alchemy API 키
ALCHEMY_BASE_HTTP=                  # Alchemy HTTP URL
```

---

## 빌드 및 배포

### 스크립트

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 풀 캐시 생성
npm run build-pool-cache

# 메니페스트 생성
npm run generate-manifest
```

### Prebuild 과정

1. `prebuild-pool-cache.js` - Aerodrome 풀 화이트리스트 캐시
2. `generate-manifest.js` - Farcaster 메니페스트 생성

---

## 성능 최적화

| 최적화 | 설명 |
|--------|------|
| **API 캐싱** | 풀 데이터 60초, 서브그래프 300초 |
| **동시성 제어** | 최대 8개 워커 |
| **백그라운드 새로고침** | 30초마다 Silent Refresh |
| **Fallback 로직** | 실패 시 30초 대기 후 재시도 |

---

## Mini App 설정

### minikit.config.ts

```typescript
{
  miniapp: {
    version: "1",
    name: "LPing",
    subtitle: "Your Personal LP Assistant",
    description: "Real-time monitoring of your Aerodrome...",
    primaryCategory: "finance",
    tags: ["defi", "lp", "aerodrome", "liquidity", "crypto"],
    homeUrl: "https://lping.vercel.app/",
    webhookUrl: "https://lping.vercel.app/api/webhook"
  }
}
```

---

## 핵심 기능 요약

1. **포지션 추적**: Aerodrome CL 포지션 실시간 조회
2. **가치 계산**: USD 기준 포지션 가치 계산
3. **보상 관리**: 스테이킹 보상, APR, 예상 수익 표시
4. **포트폴리오 분석**: 총 자산, 가중 평균 APR, 보상 추이
5. **주소 검색**: 타 지갑 포지션 조회 가능
6. **다크 모드**: 시스템 설정 연동 및 수동 토글
7. **Farcaster 통합**: Quick Auth, Mini App 네이티브 실행

---

## Pool Explorer 기능 (신규)

### 개요

**Pool Explorer**는 Aerodrome CL 풀을 탐색하고, 유동성 분포를 분석하며, 투자 시뮬레이션을 수행할 수 있는 기능입니다.

- **URL**: `/explore`
- **목적**: LP 투자 의사결정 지원
- **주요 기능**:
  - 풀 APR 비교
  - 유동성 분포 시각화
  - Emission Range 분석
  - 투자 수익 시뮬레이션

---

### 프로젝트 구조 (Pool Explorer)

```
lping/
├── app/
│   ├── api/
│   │   ├── pools/
│   │   │   ├── route.ts              # 풀 목록 API
│   │   │   └── [address]/
│   │   │       └── route.ts          # 풀 상세 API
│   │   └── simulate/
│   │       └── route.ts              # 투자 시뮬레이션 API
│   └── explore/
│       ├── page.tsx                  # 메인 페이지
│       └── components/
│           ├── PoolList.tsx          # 풀 목록 컴포넌트
│           ├── LiquidityChart.tsx    # 유동성 차트
│           └── InvestmentSimulator.tsx  # 투자 시뮬레이터
├── lib/
│   └── explore/
│       ├── types.ts                  # 타입 정의
│       ├── tickMath.ts               # Tick/가격 변환
│       ├── aprCalculator.ts          # APR 계산
│       ├── simulator.ts              # 시뮬레이션 로직
│       ├── poolService.ts            # 풀 데이터 서비스
│       └── liquidityService.ts       # 유동성 분포 서비스
└── test/
    └── api/
        └── pools.test.ts             # 테스트 (Vitest)
```

---

### API 엔드포인트 (Pool Explorer)

#### `GET /api/pools`

Aerodrome CL 풀 목록 조회

**Query Parameters:**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `sortBy` | string | 정렬 기준 (apr, tvl, volume, fees) |
| `sortOrder` | string | 정렬 순서 (asc, desc) |
| `token` | string | 토큰 심볼로 필터링 |
| `minTVL` | number | 최소 TVL 필터 |
| `limit` | number | 결과 개수 제한 |

**Response:**
```typescript
{
  pools: PoolData[];
  totalCount: number;
  lastUpdated: string;
}
```

#### `GET /api/pools/[address]`

풀 상세 정보 및 유동성 분포 조회

**Response:**
```typescript
{
  pool: PoolData;
  liquidityDistribution: LiquidityDistribution;
  liquidityHistogram: HistogramData[];
}
```

#### `POST /api/simulate`

투자 시뮬레이션 실행

**Request Body:**
```typescript
{
  poolAddress: Address;
  investmentUSD: number;
  tickLower: number;
  tickUpper: number;
  durationDays: number;
}
```

**Response:**
```typescript
{
  result: SimulationResult;
}
```

---

### 핵심 라이브러리 (`lib/explore/`)

#### types.ts - 타입 정의

```typescript
// 풀 데이터
interface PoolData {
  id: Address;
  token0: TokenInfo;
  token1: TokenInfo;
  tickSpacing: number;
  fee: number;
  tvlUSD: number;
  volume24hUSD: number;
  fees24hUSD: number;
  feeAPR: number;
  emissionAPR: number;
  totalAPR: number;
  gauge: Address | null;
  isGaugeAlive: boolean;
}

// 유동성 분포
interface LiquidityDistribution {
  poolAddress: Address;
  currentTick: number;
  currentPrice: number;
  tickSpacing: number;
  ticks: TickLiquidity[];
  emissionRange: EmissionRange | null;
}

// 시뮬레이션 결과
interface SimulationResult {
  investmentUSD: number;
  feeEarnings: EarningsBreakdown;
  emissionEarnings: EarningsBreakdown;
  totalEarnings: EarningsBreakdown;
  impermanentLoss: ImpermanentLossScenarios;
  capitalEfficiency: number;
  shareOfEmissionRange: number;
  inRangeProbability: number;
}
```

#### tickMath.ts - Tick/가격 변환

Uniswap V3 스타일의 tick-price 변환 유틸리티

```typescript
// Tick → 가격 변환
export function tickToPrice(tick: number, decimals0: number, decimals1: number): number

// 가격 → Tick 변환
export function priceToTick(price: number, decimals0: number, decimals1: number): number

// sqrtPriceX96 → 가격 변환
export function sqrtPriceX96ToPrice(sqrtPriceX96: bigint, decimals0: number, decimals1: number): number

// Tick → sqrtRatio 계산
export function getSqrtRatioAtTick(tick: number): bigint
```

#### aprCalculator.ts - APR 계산

```typescript
// Fee APR 계산 = (일일 수수료 × 365 / TVL) × 100
export function calculateFeeAPR({ fees24hUSD, tvlUSD }: FeeAPRInput): number

// Emission APR 계산 = (rewardRate × 연간초 × AERO가격 / 스테이킹 유동성) × 100
export function calculateEmissionAPR({ rewardRate, aeroPrice, stakedLiquidityUSD }: EmissionAPRInput): number
```

#### simulator.ts - 투자 시뮬레이션

```typescript
// Impermanent Loss 계산
// IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
export function calculateImpermanentLoss(priceRatio: number): number

// 자본 효율성 계산 (Concentrated Liquidity)
export function calculateCapitalEfficiency(tickLower: number, tickUpper: number, currentTick: number): number

// Emission Range 지분 계산
export function calculateShareOfRange({ userLiquidityUSD, totalRangeLiquidityUSD }: ShareInput): number

// 투자 시뮬레이션 실행
export async function simulateInvestment(input: SimulationInput): Promise<SimulationResult>
```

#### poolService.ts - 풀 데이터 서비스

Aerodrome Subgraph에서 풀 데이터 조회

```typescript
// Subgraph GraphQL 쿼리
const POOLS_QUERY = `
  query GetPools($first: Int!, $orderBy: String!, $orderDirection: String!) {
    pools(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      token0 { id symbol decimals }
      token1 { id symbol decimals }
      tickSpacing
      feeTier
      liquidity
      sqrtPrice
      tick
      totalValueLockedUSD
      poolDayData(first: 1, orderBy: date, orderDirection: desc) {
        volumeUSD
        feesUSD
      }
    }
  }
`
```

#### liquidityService.ts - 유동성 분포 서비스

온체인 multicall로 tick별 유동성 데이터 조회

```typescript
// 풀 상태 조회
const [slot0, tickSpacing, token0, token1, gauge] = await Promise.all([
  publicClient.readContract({ functionName: 'slot0' }),
  publicClient.readContract({ functionName: 'tickSpacing' }),
  publicClient.readContract({ functionName: 'token0' }),
  publicClient.readContract({ functionName: 'token1' }),
  publicClient.readContract({ functionName: 'gauge' }),
])

// Tick 데이터 배치 조회
const results = await publicClient.multicall({ contracts: batchCalls })
```

---

### UI 컴포넌트 (Pool Explorer)

#### PoolList.tsx - 풀 목록

| 기능 | 설명 |
|------|------|
| 풀 카드 | 토큰 페어, 수수료율, TVL, APR 표시 |
| 정렬 | APR, TVL, 볼륨, 수수료 기준 정렬 |
| 필터링 | 토큰 심볼, 최소 TVL 필터 |
| 선택 | 클릭 시 상세 정보 표시 |

#### LiquidityChart.tsx - 유동성 분포 차트

| 기능 | 설명 |
|------|------|
| 차트 타입 | Recharts BarChart |
| X축 | 가격 범위 |
| Y축 | 유동성 크기 |
| 색상 | Emission Range (녹색) vs Outside (회색) |
| 마커 | 현재 가격 표시선 |
| 통계 | Range 내 유동성 비율, Tick Spacing, 활성 Tick 수 |

#### InvestmentSimulator.tsx - 투자 시뮬레이터

| 기능 | 설명 |
|------|------|
| 투자 금액 | 입력 + 프리셋 ($1K, $5K, $10K, $50K) |
| 범위 프리셋 | Emission, ±5%, ±15%, ±30%, Custom |
| 리스크 표시 | 범위 넓이에 따른 Low/Medium/High |
| 예상 수익 | 일/주/월/연 단위 USD 표시 |
| APR 분석 | Fee APR + Emission APR = Total APR |
| 리스크 메트릭 | IL at ±10%, In-Range 확률, 자본 효율성 |

---

### 페이지 레이아웃 (`/explore`)

```
┌─────────────────────────────────────────────────────────────┐
│  Header: LPing 로고, Explore/My Positions 네비게이션         │
├─────────────────────────────────────────────────────────────┤
│  Page Title: Explore Pools                                   │
│  Description: Discover Aerodrome CL pools...                │
├─────────────────────────────────────────────────────────────┤
│  Filters: Sort By | Filter by Token | Min TVL               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │                     │  │  Pool Header                │  │
│  │   Pool List         │  │  - Token Pair, Fee, APR     │  │
│  │   - WETH/USDC       │  ├─────────────────────────────┤  │
│  │   - AERO/WETH       │  │  Liquidity Chart            │  │
│  │   - cbBTC/USDC      │  │  [Bar Chart]                │  │
│  │   - ...             │  ├─────────────────────────────┤  │
│  │                     │  │  Investment Simulator       │  │
│  │                     │  │  - Amount Input             │  │
│  │                     │  │  - Range Presets            │  │
│  │                     │  │  - Projected Earnings       │  │
│  │                     │  ├─────────────────────────────┤  │
│  │                     │  │  [Create Position] Button   │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

### 테스트 (Vitest)

#### 테스트 파일: `test/api/pools.test.ts`

| 테스트 그룹 | 테스트 케이스 |
|------------|--------------|
| **APR Calculation** | Fee APR 계산 (9.125%), Emission APR 계산, TVL 0일 때 0 반환 |
| **Pool Data Validation** | 풀 구조 검증, 주소 형식, decimal, totalAPR 계산 |
| **Investment Simulator** | IL at 10% (-0.11%), IL at 50% (-2%), 자본 효율성, 지분 계산 |
| **Tick Math** | Tick 0 → 가격 1, 양수 Tick → 양수 가격, 역변환 검증 |

#### 실행 방법

```bash
# 전체 테스트 실행
npm run test:run

# 개발 모드 (watch)
npm run test
```

---

### 수학 공식

#### Tick ↔ 가격 변환

```
price = 1.0001^tick × 10^(decimals1 - decimals0)
tick = log(price × 10^(decimals0 - decimals1)) / log(1.0001)
```

#### Fee APR

```
Fee APR = (fees24hUSD × 365 / tvlUSD) × 100
```

#### Emission APR

```
Emission APR = (rewardRate × 31536000 × aeroPrice / stakedLiquidityUSD) × 100
// 31536000 = 365 × 24 × 60 × 60 (연간 초)
```

#### Impermanent Loss

```
IL = 2 × sqrt(priceRatio) / (1 + priceRatio) - 1
```

#### Capital Efficiency

```
efficiency = sqrt(MAX_TICK_RANGE) / sqrt(tickUpper - tickLower)
// MAX_TICK_RANGE = 1,774,544 (전체 범위)
```

---

### Aerodrome 컨트랙트 (Slipstream)

```typescript
// Pool Explorer에서 사용하는 컨트랙트
const CONTRACTS = {
  CLPoolFactory: "0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A",
  NonfungiblePositionManager: "0x827922686190790b37229fd06084350E74485b72",
  CLGaugeFactory: "0xD30677bd8dd15132F251Cb54CbDA552d2A05Fb08",
  Voter: "0x16613524e02ad97eDfeF371bC883F2F5d6C480A5",
  AERO: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
}

// Subgraph URL
const AERODROME_SUBGRAPH = "https://api.studio.thegraph.com/query/aerodrome-slipstream-base"
```

---

### 향후 개발 계획

| 기능 | 상태 | 설명 |
|------|------|------|
| 풀 탐색 | ✅ 완료 | 풀 목록, 필터, 정렬 |
| 유동성 시각화 | ✅ 완료 | 차트, Emission Range |
| 투자 시뮬레이션 | ✅ 완료 | 수익 예측, IL 계산 |
| 포지션 민팅 | 🔜 예정 | NPM mint 트랜잭션 |
| 스테이킹 관리 | 🔜 예정 | Gauge deposit/withdraw |
| 포지션 조정 | 🔜 예정 | Increase/Decrease liquidity |

---

## 참고 문서

- `BASE_APP_GUIDELINES.md` - Base App 미니앱 지침
- `EMBED_RENDERING_GUIDE.md` - 임베드 렌더링 가이드
- `MANIFEST_COMPLIANCE.md` - 메니페스트 준수
- `TROUBLESHOOTING_CHECKLIST.md` - 문제 해결 체크리스트
- `POOL_CACHE.md` - 풀 캐시 설명
- `docs/POOL_EXPLORER_PRD.md` - Pool Explorer 기획서
- `docs/` - 아키텍처 및 마이그레이션 문서

# LPing Pool Explorer & Position Minting PRD

## Product Requirements Document

**버전**: 1.0
**작성일**: 2025-12-17
**상태**: Draft

---

## 1. 개요

### 1.1 배경

현재 LPing은 사용자의 기존 Aerodrome CL 포지션을 **모니터링**하는 기능만 제공합니다. 사용자가 새로운 LP 포지션을 생성하려면:

1. Aerodrome 사이트로 이동
2. 풀을 직접 탐색하고 비교
3. APR과 수익을 수동으로 계산
4. 포지션 생성

이 과정이 복잡하고 시간이 많이 소요됩니다.

### 1.2 목표

**"One-stop LP 솔루션"** - 풀 탐색부터 포지션 생성까지 LPing 내에서 완료

1. Aerodrome 풀 APR 실시간 비교
2. Emission Range 유동성 분석
3. 투자 수익 시뮬레이션
4. 원클릭 포지션 민팅

### 1.3 타겟 사용자

- Aerodrome에서 LP를 시작하려는 신규 사용자
- 최적의 풀을 찾는 기존 LP 사용자
- 수익 최적화를 원하는 DeFi 파워 유저

---

## 2. 핵심 기능

### 2.1 Pool Explorer (풀 탐색기)

#### 2.1.1 풀 리스트 뷰

모든 Aerodrome CL 풀을 리스트로 표시

| 컬럼 | 설명 |
|------|------|
| **Pair** | 토큰 페어 (예: WETH/USDC) |
| **TVL** | Total Value Locked (USD) |
| **Volume 24h** | 24시간 거래량 |
| **Fee APR** | 수수료 기반 APR |
| **Emission APR** | AERO 보상 APR |
| **Total APR** | Fee APR + Emission APR |
| **Emission Range** | 보상이 지급되는 가격 범위 |

#### 2.1.2 필터 & 정렬

**필터 옵션:**
- 토큰 검색 (예: "WETH", "USDC")
- TVL 범위 (Min ~ Max)
- APR 범위 (Min ~ Max)
- 풀 타입 (Stable / Volatile)
- Tick Spacing (1, 50, 100, 200)

**정렬 옵션:**
- APR (높은순/낮은순)
- TVL (높은순/낮은순)
- Volume (높은순/낮은순)

#### 2.1.3 풀 상세 페이지

풀 클릭 시 상세 정보 표시:

```
┌─────────────────────────────────────────────────────┐
│  WETH / USDC (0.05%)                                │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   TVL       │  │  Volume 24h │  │  Total APR  │  │
│  │  $42.5M     │  │   $8.2M     │  │   45.2%     │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                     │
│  [========= Liquidity Distribution Chart =========] │
│                                                     │
│  Emission Range: $3,200 - $3,800                    │
│  Current Price: $3,456                              │
│  Emission Range Liquidity: $12.3M (28.9%)           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 2.2 Liquidity Distribution Chart (유동성 분포 차트)

#### 2.2.1 시각화 요소

```
Price ($)
    │
3800├─────────────────────────┐ ← Emission Upper
    │    ░░░░░░░░░░░░░░░░░░░░ │
    │    ░░░░░░░░░░░░░░░░░░░░ │
3456├────░░░░████░░░░░░░░░░░░─┤ ← Current Price
    │    ░░░░████░░░░░░░░░░░░ │
    │    ░░░░████████░░░░░░░░ │
3200├─────────────────────────┘ ← Emission Lower
    │         ████████
    │              ████
    │                  ████
    └─────────────────────────── Liquidity

    █ = In Emission Range (AERO 보상 O)
    ░ = Out of Emission Range (AERO 보상 X)
```

#### 2.2.2 표시 정보

- **Total Liquidity**: 풀 전체 유동성
- **Emission Range Liquidity**: 보상 범위 내 유동성
- **Concentration Ratio**: Emission Range 집중도
- **Competition Level**: 경쟁 강도 (Low/Medium/High)

---

### 2.3 Investment Simulator (투자 시뮬레이터)

#### 2.3.1 입력 값

| 필드 | 설명 | 기본값 |
|------|------|--------|
| **투자 금액** | USD 기준 투자할 금액 | $1,000 |
| **가격 범위** | Lower ~ Upper 가격 | Emission Range |
| **예상 기간** | 포지션 유지 기간 | 30일 |
| **가격 시나리오** | 현재가 유지 / 상승 / 하락 | 현재가 유지 |

#### 2.3.2 시뮬레이션 결과

```
┌─────────────────────────────────────────────────────┐
│  💰 Investment Simulation                           │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  투자 금액: $1,000                                   │
│  가격 범위: $3,200 - $3,800 (Emission Range)         │
│  예상 기간: 30일                                     │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 예상 수익 breakdown                          │    │
│  ├─────────────────────────────────────────────┤    │
│  │ Fee 수익        │  $12.50  │  1.25%/월      │    │
│  │ AERO 보상       │  $35.80  │  3.58%/월      │    │
│  │ ─────────────────────────────────────────── │    │
│  │ 총 예상 수익    │  $48.30  │  4.83%/월      │    │
│  │                 │          │  57.96%/년     │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ⚠️ Impermanent Loss 시나리오                        │
│  ├─ 가격 +10%: IL = -0.23% ($2.30)                  │
│  ├─ 가격 -10%: IL = -0.23% ($2.30)                  │
│  └─ 가격 +20%: IL = -0.91% ($9.10)                  │
│                                                     │
│  📊 순수익 (IL 반영)                                 │
│  └─ 가격 ±10% 시나리오: $46.00 (4.60%/월)           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 2.3.3 시뮬레이션 계산 로직

```typescript
// 1. Fee 수익 계산
feeRevenue = (investmentUSD / emissionRangeLiquidity) * dailyFees * days

// 2. AERO 보상 계산
aeroReward = (investmentUSD / emissionRangeLiquidity) * dailyEmissions * days * aeroPrice

// 3. Impermanent Loss 계산
IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1

// 4. 순수익
netProfit = feeRevenue + aeroReward - (investmentUSD * IL)
```

#### 2.3.4 고급 옵션

- **Auto-compound 시뮬레이션**: 보상 재투자 시 복리 효과
- **비교 모드**: 여러 풀/범위 동시 비교
- **히스토리컬 백테스트**: 과거 데이터 기반 시뮬레이션

---

### 2.4 Position Minting (포지션 생성)

#### 2.4.1 민팅 플로우

```
[1. 풀 선택] → [2. 범위 설정] → [3. 금액 입력] → [4. 미리보기] → [5. 민팅]
```

#### 2.4.2 Step 1: 풀 선택

- Pool Explorer에서 풀 선택
- 또는 토큰 페어 직접 검색

#### 2.4.3 Step 2: 범위 설정

**프리셋 옵션:**
| 옵션 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **Emission Range** | AERO 보상 범위 | 최대 보상 | 범위 이탈 위험 |
| **Full Range** | 전체 가격 범위 | 안정적 | 낮은 자본 효율 |
| **Narrow (±5%)** | 현재가 ±5% | 높은 집중도 | 높은 IL 위험 |
| **Custom** | 사용자 지정 | 유연함 | 경험 필요 |

**범위 설정 UI:**
```
         Lower Price              Upper Price
         ┌─────────────┐          ┌─────────────┐
         │   $3,200    │          │   $3,800    │
         └─────────────┘          └─────────────┘
              ◄──── Drag to adjust ────►

[Use Emission Range] [Full Range] [±5%] [±10%] [Custom]
```

#### 2.4.4 Step 3: 금액 입력

```
┌─────────────────────────────────────────────────────┐
│  Deposit Amount                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Token 0 (WETH)           Token 1 (USDC)            │
│  ┌─────────────────┐      ┌─────────────────┐       │
│  │     0.5 WETH    │      │   1,728 USDC    │       │
│  │    ≈ $1,728     │      │    ≈ $1,728     │       │
│  └─────────────────┘      └─────────────────┘       │
│  Balance: 2.5 WETH        Balance: 5,000 USDC       │
│                                                     │
│  [MAX] [50%] [25%]        [MAX] [50%] [25%]         │
│                                                     │
│  💡 현재 가격 기준 최적 비율로 자동 계산됨              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 2.4.5 Step 4: 미리보기

```
┌─────────────────────────────────────────────────────┐
│  Position Preview                                   │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  Pool: WETH/USDC (0.05%)                            │
│  Range: $3,200 - $3,800                             │
│  Deposit: 0.5 WETH + 1,728 USDC ($3,456)            │
│                                                     │
│  Expected Performance:                              │
│  ├─ Fee APR: 12.5%                                  │
│  ├─ Emission APR: 32.7%                             │
│  └─ Total APR: 45.2%                                │
│                                                     │
│  Your Share of Emission Range: 0.028%               │
│                                                     │
│  Gas Estimate: ~0.001 ETH ($3.50)                   │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ ☑️ Stake to Gauge automatically              │    │
│  │   (Required for AERO rewards)               │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  [← Back]                    [Approve & Mint →]     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 2.4.6 Step 5: 트랜잭션 실행

**트랜잭션 시퀀스:**
1. Token0 Approve (필요 시)
2. Token1 Approve (필요 시)
3. Mint Position (NonfungiblePositionManager.mint)
4. Stake to Gauge (선택 시, CLGauge.deposit)

**진행 상태 UI:**
```
┌─────────────────────────────────────────────────────┐
│  Minting Position...                                │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ✅ 1. Approve WETH                                 │
│  ✅ 2. Approve USDC                                 │
│  🔄 3. Mint Position (Confirming...)                │
│  ⏳ 4. Stake to Gauge                               │
│                                                     │
│  [View on BaseScan]                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### 2.5 Staking Management (스테이킹 관리)

#### 2.5.1 자동 스테이킹

포지션 민팅 시 Gauge 자동 스테이킹 옵션 제공

#### 2.5.2 기존 포지션 스테이킹

- 언스테이크된 포지션에 "Stake" 버튼 표시
- 원클릭 스테이킹

#### 2.5.3 보상 클레임

- 클레임 가능 AERO 보상 표시
- 개별 / 일괄 클레임 지원

---

## 3. 페이지 구조

### 3.1 신규 라우트

| 라우트 | 설명 |
|--------|------|
| `/explore` | Pool Explorer 메인 페이지 |
| `/explore/[poolAddress]` | 풀 상세 페이지 |
| `/mint` | 포지션 민팅 페이지 |
| `/mint/[poolAddress]` | 특정 풀 민팅 페이지 |

### 3.2 네비게이션

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo]    [Explore]  [My Positions]  [Mint]    [Wallet 🔗]  │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. 기술 요구사항

### 4.1 필요한 컨트랙트 인터랙션

| 컨트랙트 | 메서드 | 용도 |
|---------|--------|------|
| **NonfungiblePositionManager** | `mint()` | 포지션 생성 |
| **NonfungiblePositionManager** | `positions()` | 포지션 정보 조회 |
| **CLPool** | `slot0()` | 현재 가격, tick |
| **CLPool** | `liquidity()` | 풀 유동성 |
| **CLPool** | `ticks()` | tick별 유동성 |
| **CLGauge** | `deposit()` | 포지션 스테이킹 |
| **CLGauge** | `withdraw()` | 언스테이킹 |
| **CLGauge** | `getReward()` | 보상 클레임 |
| **CLGauge** | `rewardRate()` | 보상 비율 |
| **CLGaugeFactory** | `getGauge()` | 풀의 Gauge 주소 |
| **ERC20** | `approve()` | 토큰 승인 |
| **ERC20** | `balanceOf()` | 잔액 조회 |

### 4.2 필요한 ABI

```typescript
// 추가 필요한 ABI
const NPM_MINT_ABI = [{
  name: 'mint',
  type: 'function',
  inputs: [{
    name: 'params',
    type: 'tuple',
    components: [
      { name: 'token0', type: 'address' },
      { name: 'token1', type: 'address' },
      { name: 'tickSpacing', type: 'int24' },
      { name: 'tickLower', type: 'int24' },
      { name: 'tickUpper', type: 'int24' },
      { name: 'amount0Desired', type: 'uint256' },
      { name: 'amount1Desired', type: 'uint256' },
      { name: 'amount0Min', type: 'uint256' },
      { name: 'amount1Min', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'deadline', type: 'uint256' },
      { name: 'sqrtPriceX96', type: 'uint160' }
    ]
  }],
  outputs: [
    { name: 'tokenId', type: 'uint256' },
    { name: 'liquidity', type: 'uint128' },
    { name: 'amount0', type: 'uint256' },
    { name: 'amount1', type: 'uint256' }
  ]
}];

const CL_POOL_TICKS_ABI = [{
  name: 'ticks',
  type: 'function',
  inputs: [{ name: 'tick', type: 'int24' }],
  outputs: [
    { name: 'liquidityGross', type: 'uint128' },
    { name: 'liquidityNet', type: 'int128' },
    // ...
  ]
}];
```

### 4.3 신규 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `GET /api/pools` | GET | 모든 CL 풀 리스트 |
| `GET /api/pools/[address]` | GET | 풀 상세 정보 |
| `GET /api/pools/[address]/liquidity-distribution` | GET | tick별 유동성 분포 |
| `POST /api/simulate` | POST | 투자 시뮬레이션 |
| `GET /api/tokens/[address]/price` | GET | 토큰 가격 |

### 4.4 데이터 소스

| 데이터 | 소스 |
|--------|------|
| 풀 목록, TVL, Volume | Aerodrome Subgraph |
| 현재 가격, Tick | On-chain (CLPool) |
| Emission Range | CLGauge 컨트랙트 |
| 토큰 가격 | Enso Finance API |
| 유동성 분포 | On-chain (ticks 데이터) |

---

## 5. UI/UX 가이드라인

### 5.1 디자인 원칙

1. **단순함**: 복잡한 DeFi 개념을 쉽게 이해할 수 있도록
2. **투명성**: 모든 계산 과정과 리스크 명시
3. **일관성**: 기존 LPing UI와 동일한 디자인 시스템

### 5.2 색상 코드

| 요소 | 색상 |
|------|------|
| In Emission Range | `#22c55e` (Green) |
| Out of Range | `#6b7280` (Gray) |
| Warning | `#f59e0b` (Amber) |
| Danger | `#ef4444` (Red) |
| Primary Action | `#3b82f6` (Blue) |

### 5.3 반응형 디자인

- 모바일 우선 (Mini App 환경)
- 데스크톱 지원

---

## 6. 리스크 및 경고 표시

### 6.1 필수 경고 문구

```
⚠️ Impermanent Loss Warning
가격 변동 시 손실이 발생할 수 있습니다. LP는 원금 손실 위험이 있습니다.

⚠️ Range Risk
선택한 범위를 벗어나면 수수료와 보상을 받지 못합니다.

⚠️ Smart Contract Risk
스마트 컨트랙트 버그로 인한 자금 손실 위험이 있습니다.
```

### 6.2 리스크 레벨 표시

| 범위 설정 | 리스크 레벨 |
|-----------|-------------|
| Full Range | 🟢 Low |
| Emission Range | 🟡 Medium |
| ±10% | 🟠 Medium-High |
| ±5% | 🔴 High |
| Custom (좁은 범위) | 🔴 High |

---

## 7. 성공 지표 (KPI)

| 지표 | 목표 |
|------|------|
| 일일 시뮬레이션 횟수 | 1,000+ |
| 시뮬레이션 → 민팅 전환율 | 15%+ |
| 일일 민팅 수 | 50+ |
| 민팅 성공률 | 95%+ |
| 평균 민팅 금액 | $500+ |

---

## 8. 개발 마일스톤

### Phase 1: Pool Explorer

**범위:**
- 풀 리스트 UI
- 필터/정렬 기능
- 풀 상세 페이지

**산출물:**
- `/explore` 페이지
- `/explore/[poolAddress]` 페이지
- `/api/pools` API

### Phase 2: Liquidity Distribution

**범위:**
- tick별 유동성 조회
- 분포 차트 시각화
- Emission Range 표시

**산출물:**
- LiquidityDistributionChart 컴포넌트
- `/api/pools/[address]/liquidity-distribution` API

### Phase 3: Investment Simulator

**범위:**
- 시뮬레이션 로직 구현
- UI 개발
- IL 계산

**산출물:**
- InvestmentSimulator 컴포넌트
- `/api/simulate` API

### Phase 4: Position Minting

**범위:**
- 민팅 플로우 UI
- 컨트랙트 인터랙션
- 트랜잭션 처리

**산출물:**
- `/mint` 페이지
- MintPosition 컴포넌트
- 트랜잭션 훅

### Phase 5: Staking Integration

**범위:**
- 자동 스테이킹 옵션
- 보상 클레임 기능

**산출물:**
- StakingManager 컴포넌트
- 기존 LP 페이지 연동

---

## 9. 보안 고려사항

### 9.1 트랜잭션 안전

- Slippage 보호 (기본 0.5%, 사용자 조정 가능)
- Deadline 설정 (기본 20분)
- 금액 검증 (잔액 초과 방지)

### 9.2 입력 검증

- 주소 유효성 검사
- 금액 범위 검사
- Tick 범위 유효성 검사

### 9.3 승인 관리

- 필요한 만큼만 승인 (Exact Approval)
- 또는 무제한 승인 옵션 (사용자 선택)

---

## 10. 향후 확장 계획

### 10.1 V2 기능

- **Auto-rebalance**: 범위 이탈 시 자동 재조정
- **Position Migration**: 범위 변경 시 원클릭 마이그레이션
- **Multi-pool Strategy**: 여러 풀에 분산 투자

### 10.2 V3 기능

- **AI 추천**: 사용자 프로필 기반 풀 추천
- **Alert System**: 범위 이탈/APR 변동 알림
- **Portfolio Optimization**: 전체 포트폴리오 최적화 제안

---

## 부록 A: Aerodrome 컨트랙트 참조

### A.1 Slipstream (Concentrated Liquidity) 컨트랙트

| 컨트랙트 | 주소 | 용도 |
|---------|------|------|
| **CLPoolFactory** | `0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A` | CL 풀 생성 |
| **NonfungiblePositionManager** | `0x827922686190790b37229fd06084350E74485b72` | NFT 포지션 관리 (민팅/번) |
| **SwapRouter** | `0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5` | 토큰 스왑 |
| **CLGaugeFactory** | `0xD30677bd8dd15132F251Cb54CbDA552d2A05Fb08` | CL Gauge 생성 |
| **QuoterV2** | `0x254cF9E1E6e233aa1AC962CB9B05b2cfeAaE15b0` | 스왑 견적 |
| **MixedQuoter** | `0x0A5aA5D3a4d28014f967Bf0f29EAA3FF9807D5c6` | 혼합 견적 |

### A.2 Aerodrome Core 컨트랙트

| 컨트랙트 | 주소 | 용도 |
|---------|------|------|
| **Router** | `0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43` | 스왑/유동성 라우터 |
| **Voter** | `0x16613524e02ad97eDfeF371bC883F2F5d6C480A5` | 투표/Gauge 관리 |
| **PoolFactory** | `0x420DD381b31aEf6683db6B902084cB0FFECe40Da` | AMM 풀 생성 |
| **VotingEscrow** | `0xeBf418Fe2512e7E6bd9b87a8F0f294aCDC67e6B4` | veAERO 관리 |
| **Minter** | `0xeB018363F0a9Af8f91F06FEe6613a751b2A33FE5` | AERO 발행 |
| **AERO Token** | `0x940181a94A35A4569E4529A3CDfB74e38FD98631` | AERO 토큰 |
| **GaugeFactory** | `0x35f35cA5B132CaDf2916BaB57639128eAC5bbcb5` | AMM Gauge 생성 |
| **RewardsDistributor** | `0x227f65131A261548b057215bB1D5Ab2997964C7d` | 보상 분배 |

### A.3 주요 ABI 명세

#### NonfungiblePositionManager

```typescript
const NPM_ABI = [
  // 포지션 민팅
  {
    name: 'mint',
    type: 'function',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'token0', type: 'address' },
        { name: 'token1', type: 'address' },
        { name: 'tickSpacing', type: 'int24' },
        { name: 'tickLower', type: 'int24' },
        { name: 'tickUpper', type: 'int24' },
        { name: 'amount0Desired', type: 'uint256' },
        { name: 'amount1Desired', type: 'uint256' },
        { name: 'amount0Min', type: 'uint256' },
        { name: 'amount1Min', type: 'uint256' },
        { name: 'recipient', type: 'address' },
        { name: 'deadline', type: 'uint256' },
        { name: 'sqrtPriceX96', type: 'uint160' }
      ]
    }],
    outputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'liquidity', type: 'uint128' },
      { name: 'amount0', type: 'uint256' },
      { name: 'amount1', type: 'uint256' }
    ]
  },
  // 포지션 조회
  {
    name: 'positions',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'nonce', type: 'uint96' },
      { name: 'operator', type: 'address' },
      { name: 'token0', type: 'address' },
      { name: 'token1', type: 'address' },
      { name: 'tickSpacing', type: 'int24' },
      { name: 'tickLower', type: 'int24' },
      { name: 'tickUpper', type: 'int24' },
      { name: 'liquidity', type: 'uint128' },
      { name: 'feeGrowthInside0LastX128', type: 'uint256' },
      { name: 'feeGrowthInside1LastX128', type: 'uint256' },
      { name: 'tokensOwed0', type: 'uint128' },
      { name: 'tokensOwed1', type: 'uint128' }
    ]
  },
  // 유동성 증가
  {
    name: 'increaseLiquidity',
    type: 'function',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'tokenId', type: 'uint256' },
        { name: 'amount0Desired', type: 'uint256' },
        { name: 'amount1Desired', type: 'uint256' },
        { name: 'amount0Min', type: 'uint256' },
        { name: 'amount1Min', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    }],
    outputs: [
      { name: 'liquidity', type: 'uint128' },
      { name: 'amount0', type: 'uint256' },
      { name: 'amount1', type: 'uint256' }
    ]
  },
  // 유동성 감소
  {
    name: 'decreaseLiquidity',
    type: 'function',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'tokenId', type: 'uint256' },
        { name: 'liquidity', type: 'uint128' },
        { name: 'amount0Min', type: 'uint256' },
        { name: 'amount1Min', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    }],
    outputs: [
      { name: 'amount0', type: 'uint256' },
      { name: 'amount1', type: 'uint256' }
    ]
  },
  // 수수료 수집
  {
    name: 'collect',
    type: 'function',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'tokenId', type: 'uint256' },
        { name: 'recipient', type: 'address' },
        { name: 'amount0Max', type: 'uint128' },
        { name: 'amount1Max', type: 'uint128' }
      ]
    }],
    outputs: [
      { name: 'amount0', type: 'uint256' },
      { name: 'amount1', type: 'uint256' }
    ]
  }
] as const;
```

#### CLPool

```typescript
const CL_POOL_ABI = [
  // 현재 상태
  {
    name: 'slot0',
    type: 'function',
    inputs: [],
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'observationIndex', type: 'uint16' },
      { name: 'observationCardinality', type: 'uint16' },
      { name: 'observationCardinalityNext', type: 'uint16' },
      { name: 'unlocked', type: 'bool' }
    ]
  },
  // 유동성
  {
    name: 'liquidity',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint128' }]
  },
  // 스테이킹된 유동성
  {
    name: 'stakedLiquidity',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint128' }]
  },
  // tick 정보
  {
    name: 'ticks',
    type: 'function',
    inputs: [{ name: 'tick', type: 'int24' }],
    outputs: [
      { name: 'liquidityGross', type: 'uint128' },
      { name: 'liquidityNet', type: 'int128' },
      { name: 'stakedLiquidityNet', type: 'int128' },
      { name: 'feeGrowthOutside0X128', type: 'uint256' },
      { name: 'feeGrowthOutside1X128', type: 'uint256' },
      { name: 'rewardGrowthOutsideX128', type: 'uint256' },
      { name: 'tickCumulativeOutside', type: 'int56' },
      { name: 'secondsPerLiquidityOutsideX128', type: 'uint160' },
      { name: 'secondsOutside', type: 'uint32' },
      { name: 'initialized', type: 'bool' }
    ]
  },
  // tick 간격
  {
    name: 'tickSpacing',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'int24' }]
  },
  // 수수료
  {
    name: 'fee',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint24' }]
  },
  // 토큰 주소
  {
    name: 'token0',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'token1',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  },
  // Gauge 주소
  {
    name: 'gauge',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  }
] as const;
```

#### CLGauge

```typescript
const CL_GAUGE_ABI = [
  // NFT 스테이킹
  {
    name: 'deposit',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: []
  },
  // NFT 언스테이킹
  {
    name: 'withdraw',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: []
  },
  // 보상 클레임 (토큰ID 기반)
  {
    name: 'getReward',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: []
  },
  // 보상 비율
  {
    name: 'rewardRate',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  // epoch별 보상 비율
  {
    name: 'rewardRateByEpoch',
    type: 'function',
    inputs: [{ name: 'epoch', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  // 적립된 보상
  {
    name: 'earned',
    type: 'function',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  // 보상 성장 (범위 내)
  {
    name: 'rewardGrowthInside',
    type: 'function',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  // 스테이킹된 토큰 목록
  {
    name: 'stakedValues',
    type: 'function',
    inputs: [{ name: 'depositor', type: 'address' }],
    outputs: [{ name: 'staked', type: 'uint256[]' }]
  },
  // 스테이킹 확인
  {
    name: 'stakedContains',
    type: 'function',
    inputs: [
      { name: 'depositor', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  // 스테이킹 수량
  {
    name: 'stakedLength',
    type: 'function',
    inputs: [{ name: 'depositor', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  // 보상 토큰
  {
    name: 'rewardToken',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  },
  // 풀 주소
  {
    name: 'pool',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  }
] as const;
```

#### CLGaugeFactory

```typescript
const CL_GAUGE_FACTORY_ABI = [
  // 풀의 Gauge 주소 조회
  {
    name: 'getGauge',
    type: 'function',
    inputs: [{ name: 'pool', type: 'address' }],
    outputs: [{ name: '', type: 'address' }]
  }
] as const;
```

#### Voter (보상 관리)

```typescript
const VOTER_ABI = [
  // Gauge가 활성화되어 있는지 확인
  {
    name: 'isGauge',
    type: 'function',
    inputs: [{ name: 'gauge', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }]
  },
  // 풀의 Gauge 조회
  {
    name: 'gauges',
    type: 'function',
    inputs: [{ name: 'pool', type: 'address' }],
    outputs: [{ name: '', type: 'address' }]
  },
  // Gauge가 살아있는지 확인
  {
    name: 'isAlive',
    type: 'function',
    inputs: [{ name: 'gauge', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;
```

### A.4 주요 계산 함수

#### Tick ↔ Price 변환

```typescript
import { TickMath } from '@uniswap/v3-sdk';

// Tick → Price
function tickToPrice(tick: number, decimals0: number, decimals1: number): number {
  const sqrtPriceX96 = TickMath.getSqrtRatioAtTick(tick);
  const price = (Number(sqrtPriceX96) / 2 ** 96) ** 2;
  return price * 10 ** (decimals0 - decimals1);
}

// Price → Tick
function priceToTick(price: number, decimals0: number, decimals1: number): number {
  const adjustedPrice = price / 10 ** (decimals0 - decimals1);
  const sqrtPrice = Math.sqrt(adjustedPrice);
  const sqrtPriceX96 = BigInt(Math.floor(sqrtPrice * 2 ** 96));
  return TickMath.getTickAtSqrtRatio(sqrtPriceX96);
}
```

#### 유동성 계산

```typescript
// 토큰 양으로 유동성 계산
function getLiquidityForAmounts(
  sqrtPriceX96: bigint,
  sqrtPriceAX96: bigint,
  sqrtPriceBX96: bigint,
  amount0: bigint,
  amount1: bigint
): bigint {
  if (sqrtPriceAX96 > sqrtPriceBX96) {
    [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96];
  }

  if (sqrtPriceX96 <= sqrtPriceAX96) {
    return getLiquidityForAmount0(sqrtPriceAX96, sqrtPriceBX96, amount0);
  } else if (sqrtPriceX96 < sqrtPriceBX96) {
    const liquidity0 = getLiquidityForAmount0(sqrtPriceX96, sqrtPriceBX96, amount0);
    const liquidity1 = getLiquidityForAmount1(sqrtPriceAX96, sqrtPriceX96, amount1);
    return liquidity0 < liquidity1 ? liquidity0 : liquidity1;
  } else {
    return getLiquidityForAmount1(sqrtPriceAX96, sqrtPriceBX96, amount1);
  }
}

function getLiquidityForAmount0(
  sqrtPriceAX96: bigint,
  sqrtPriceBX96: bigint,
  amount0: bigint
): bigint {
  if (sqrtPriceAX96 > sqrtPriceBX96) {
    [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96];
  }
  return (amount0 * sqrtPriceAX96 * sqrtPriceBX96) /
         ((sqrtPriceBX96 - sqrtPriceAX96) * (1n << 96n));
}

function getLiquidityForAmount1(
  sqrtPriceAX96: bigint,
  sqrtPriceBX96: bigint,
  amount1: bigint
): bigint {
  if (sqrtPriceAX96 > sqrtPriceBX96) {
    [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96];
  }
  return (amount1 * (1n << 96n)) / (sqrtPriceBX96 - sqrtPriceAX96);
}
```

#### APR 계산

```typescript
// Emission APR 계산
function calculateEmissionAPR(
  rewardRate: bigint,        // Gauge rewardRate (AERO/sec)
  aeroPrice: number,         // AERO USD 가격
  stakedLiquidityUSD: number // Emission Range 내 스테이킹된 유동성 (USD)
): number {
  const secondsPerYear = 365 * 24 * 60 * 60;
  const annualRewardsUSD = Number(rewardRate) * secondsPerYear * aeroPrice / 1e18;
  return (annualRewardsUSD / stakedLiquidityUSD) * 100;
}

// Fee APR 계산
function calculateFeeAPR(
  fees24h: number,    // 24시간 수수료 (USD)
  tvlUSD: number      // 풀 TVL (USD)
): number {
  return (fees24h * 365 / tvlUSD) * 100;
}
```

### A.5 Subgraph 쿼리

#### 풀 목록 조회

```graphql
query GetPools($first: Int!, $skip: Int!, $orderBy: String!, $orderDirection: String!) {
  pools(
    first: $first
    skip: $skip
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: { liquidity_gt: "0" }
  ) {
    id
    token0 {
      id
      symbol
      decimals
    }
    token1 {
      id
      symbol
      decimals
    }
    tickSpacing
    fee
    liquidity
    sqrtPrice
    tick
    totalValueLockedUSD
    volumeUSD
    feesUSD
    txCount
  }
}
```

#### 풀 상세 조회

```graphql
query GetPoolDetail($poolAddress: ID!) {
  pool(id: $poolAddress) {
    id
    token0 {
      id
      symbol
      decimals
      derivedETH
    }
    token1 {
      id
      symbol
      decimals
      derivedETH
    }
    tickSpacing
    fee
    liquidity
    sqrtPrice
    tick
    totalValueLockedUSD
    totalValueLockedToken0
    totalValueLockedToken1
    volumeUSD
    feesUSD
    poolDayData(first: 30, orderBy: date, orderDirection: desc) {
      date
      volumeUSD
      feesUSD
      tvlUSD
    }
  }
}
```

### A.6 유용한 링크

| 리소스 | URL |
|--------|-----|
| **Aerodrome App** | https://aerodrome.finance |
| **GitHub (Slipstream)** | https://github.com/aerodrome-finance/slipstream |
| **GitHub (Core)** | https://github.com/aerodrome-finance/contracts |
| **BaseScan** | https://basescan.org |
| **Subgraph** | https://api.goldsky.com/api/public/project_clvxxqf0uc8qs01x7bcs1e4ci/subgraphs/aerodrome-slipstream/v1.0.0/gn |

---

## 부록 B: 유동성 분포 계산 방법

### tick 데이터에서 유동성 분포 추출

```typescript
async function getLiquidityDistribution(poolAddress: Address) {
  const pool = getContract({ address: poolAddress, abi: CL_POOL_ABI });

  // 1. 현재 tick 조회
  const slot0 = await pool.read.slot0();
  const currentTick = slot0.tick;

  // 2. tick 범위 설정 (예: ±500 ticks)
  const tickSpacing = await pool.read.tickSpacing();
  const minTick = currentTick - (500 * tickSpacing);
  const maxTick = currentTick + (500 * tickSpacing);

  // 3. 각 initialized tick의 유동성 조회
  const distribution = [];
  for (let tick = minTick; tick <= maxTick; tick += tickSpacing) {
    const tickData = await pool.read.ticks([tick]);
    if (tickData.liquidityGross > 0) {
      distribution.push({
        tick,
        price: tickToPrice(tick),
        liquidity: tickData.liquidityNet
      });
    }
  }

  return distribution;
}
```

---

## 부록 C: 용어 정의

| 용어 | 정의 |
|------|------|
| **Emission Range** | AERO 보상이 지급되는 가격 범위 (Gauge에서 설정) |
| **Tick** | 가격을 이산화한 단위 (Uniswap V3 구조) |
| **Tick Spacing** | 풀의 tick 간격 (수수료율에 따라 다름) |
| **In Range** | 현재 가격이 포지션 범위 내에 있는 상태 |
| **Concentrated Liquidity** | 특정 가격 범위에 유동성을 집중하는 방식 |
| **Gauge** | 스테이킹하여 AERO 보상을 받는 컨트랙트 |
| **Impermanent Loss (IL)** | 가격 변동으로 인한 LP의 기회비용 손실 |

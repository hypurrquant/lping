# LPing - Aerodrome LP Position Tracker

## Project Overview

LPing is a **Farcaster Mini App** for tracking and analyzing Aerodrome Concentrated Liquidity (CL) positions on Base chain. Built with Next.js 15, React 19, and integrated with Coinbase OnchainKit.

**Live URL:** https://lping.vercel.app

## Tech Stack

- **Framework:** Next.js 15.3.4 (App Router)
- **UI:** React 19, Tailwind CSS 4.x
- **Web3:** viem 2.x, wagmi 2.x, OnchainKit
- **Charts:** Recharts 3.x
- **Auth:** Farcaster Quick Auth, MiniApp SDK
- **Testing:** Vitest, Playwright, Testing Library
- **Language:** TypeScript 5.x

## Project Structure

```
lping/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Root (redirects to /explore)
│   ├── layout.tsx         # Root layout with providers
│   ├── rootProvider.tsx   # Web3 + React Query providers
│   ├── explore/           # Pool Discovery page
│   │   ├── page.tsx       # Main explore UI
│   │   └── components/    # PoolList, LiquidityChart, Simulator
│   ├── lp/                # LP Portfolio page
│   │   ├── page.tsx       # Position tracker UI
│   │   ├── components/    # Header, Portfolio, Charts
│   │   ├── hooks/         # usePositions, useTheme
│   │   ├── utils/         # sortPositions, portfolioStats
│   │   └── types.ts       # LpResult, CLPosition types
│   ├── api/               # API Routes
│   │   ├── pools/         # Pool listing & details
│   │   ├── cl-positions/  # CL position fetching
│   │   ├── simulate/      # Investment simulation
│   │   └── subgraph/      # Aerodrome subgraph proxy
│   ├── hooks/             # Shared hooks
│   └── components/        # Shared components
├── lib/                   # Core libraries
│   ├── explore/           # Pool exploration services
│   │   ├── types.ts       # PoolData, LiquidityDistribution
│   │   ├── poolService.ts # Pool fetching logic
│   │   ├── liquidityService.ts # Tick data analysis
│   │   ├── aprCalculator.ts    # APR calculations
│   │   ├── tickMath.ts    # Tick <-> Price conversions
│   │   └── simulator.ts   # Investment simulator
│   ├── abis.ts            # Contract ABIs
│   ├── addresses.ts       # Contract addresses
│   └── viemClient.ts      # Viem client config
├── components/            # Global components
│   └── BottomNav.tsx      # Tab navigation
└── scripts/               # Build scripts
    ├── prebuild-pool-cache.js
    └── generate-manifest.js
```

## Key Features

### 1. Discover Page (`/explore`)
- Browse Aerodrome CL pools sorted by APR, TVL, Volume, Fees
- Filter by token symbol and minimum TVL
- View pool details: APR breakdown (Fee + Emission), trends, IL risk
- **Liquidity Chart:** Visualize tick distribution with emission range
- **Investment Simulator:** Estimate returns for custom ranges

### 2. LP Portfolio Page (`/lp`)
- Auto-detects connected wallet's CL positions
- Shows position value, earned rewards, APR, in-range status
- Expandable rows with detailed token amounts, price ranges
- Support for staked (gauge) positions with reward breakdowns
- Address lookup via `?view=0x...` query parameter

## Data Flow

### Pool Data
1. **Subgraph Query** → Fetch pool list with metrics
2. **On-chain Enrichment** → Get gauge status, emission rates
3. **APR Calculation** → Fee APR + Emission APR
4. **Client Display** → Sorted, filtered pool list

### Position Data
1. **SugarHelper Contract** → Fetch user's CL positions
2. **Gauge Contract** → Get staking status, earned rewards
3. **Price API** → Token USD prices
4. **Client Aggregation** → Portfolio overview with totals

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pools` | GET | List pools with sorting/filtering |
| `/api/pools/[address]` | GET | Pool detail with liquidity distribution |
| `/api/cl-positions` | GET | User's CL positions |
| `/api/simulate` | POST | Investment simulation |
| `/api/subgraph` | POST | Aerodrome subgraph proxy |

## Key Types

```typescript
// Pool data structure
interface PoolData {
  id: Address
  token0: TokenInfo
  token1: TokenInfo
  tickSpacing: number
  fee: number
  tvlUSD: number
  feeAPR: number
  emissionAPR: number
  totalAPR: number
  gauge: Address | null
  // ... trends, risk metrics
}

// CL Position
interface CLPosition {
  tokenId: string
  pool: Address
  tickLower: number
  tickUpper: number
  liquidity: string
  estimatedValueUSD: string
  isStaked: boolean
  earnedAmount: string
  estimatedAPR: string
}
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_ONCHAINKIT_API_KEY=  # Coinbase CDP API key
NEXT_PUBLIC_URL=                  # Production URL

# Optional
NEXT_PUBLIC_ROOT_URL=            # Override root URL
NEXT_PUBLIC_FEE_BPS_VOLATILE=30  # Volatile pool fee (0.30%)
NEXT_PUBLIC_FEE_BPS_STABLE=2     # Stable pool fee (0.02%)
NEXT_PUBLIC_LP_COOLDOWN_MS=15000 # Auto-refresh interval
```

## Development Commands

```bash
npm run dev -- -p 4000   # Start dev server on port 4000
npm run build            # Production build (with prebuild scripts)
npm run lint             # ESLint check
npm run test             # Vitest unit tests
npm run test:run         # Run tests once
```

> **Note:** This project uses port 4000+ locally. Other projects run on different ports - do not terminate them.

## Contracts (Base Mainnet)

- **Aerodrome SugarHelper:** Position aggregation
- **CL Gauge Factory:** Gauge lookups
- **CL Pool Factory:** Pool registry
- **AERO Token:** Reward token

## Mini App Integration

- Configured via `minikit.config.ts`
- Manifest at `/.well-known/farcaster.json`
- Uses `SafeArea` from OnchainKit for proper viewport handling
- Locale fix for Korean language fallback
- Wallet extension conflict suppression

## Notes for Development

1. **Scrolling:** Handled by Base App natively, don't override
2. **Wallet Errors:** Suppressed via early-loading scripts
3. **Pool Cache:** Pre-built during `npm run build` for faster loads
4. **Subgraph:** Uses Aerodrome's public subgraph endpoint
5. **Prices:** Derived from on-chain sqrtPriceX96 or external APIs

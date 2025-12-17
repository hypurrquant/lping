import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock fetch
global.fetch = vi.fn()

// Mock viem client
vi.mock('@/lib/viemClient', () => ({
  publicClient: {
    readContract: vi.fn(),
    multicall: vi.fn(),
  },
}))

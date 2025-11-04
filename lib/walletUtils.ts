/**
 * Wallet utilities for Account Abstraction and Smart Wallet functionality
 * @see https://docs.base.org/onchainkit/latest/utilities/wallet/is-valid-aa-entrypoint
 * @see https://docs.base.org/onchainkit/latest/utilities/wallet/is-wallet-a-coinbase-smart-wallet
 */

import { isValidAAEntrypoint, isWalletACoinbaseSmartWallet } from '@coinbase/onchainkit/wallet';
import { Address, type PublicClient, type Hex } from 'viem';
import { publicClient } from './viemClient';

// Type for UserOperation as required by isWalletACoinbaseSmartWallet
type RpcUserOperationV06 = {
  sender: Address;
  initCode?: Hex;
  nonce?: bigint;
  callData?: Hex;
  callGasLimit?: bigint;
  verificationGasLimit?: bigint;
  preVerificationGas?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  paymasterAndData?: Hex;
  signature?: Hex;
};

/**
 * Validates if an Account Abstraction entrypoint address is valid (v0.6)
 * This is useful before sponsoring transactions to ensure compatibility
 * 
 * @param entrypoint - The entrypoint address to validate
 * @returns true if the entrypoint is valid (v0.6), false otherwise
 * 
 * @example
 * ```ts
 * const entrypoint = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
 * if (isValidEntrypoint(entrypoint)) {
 *   // Safe to sponsor transactions
 * }
 * ```
 */
export function isValidEntrypoint(entrypoint: string): boolean {
  return isValidAAEntrypoint({ entrypoint });
}

/**
 * Checks if a sender address is a Coinbase Smart Wallet
 * This verifies if the address is a Smart Wallet proxy with the expected implementation
 * Useful before sponsoring transactions
 * 
 * @param client - Viem PublicClient instance
 * @param sender - The sender address to check
 * @param initCode - Optional init code for new wallets
 * @returns Promise that resolves to true if it's a Coinbase Smart Wallet, false otherwise
 * 
 * @example
 * ```ts
 * import { publicClient } from '@/lib/viemClient';
 * 
 * const { address } = useAccount();
 * if (address) {
 *   const result = await checkCoinbaseSmartWallet(publicClient, address);
 *   if (result.isCoinbaseSmartWallet) {
 *     // Enable Smart Wallet specific features
 *   }
 * }
 * ```
 */
export async function checkCoinbaseSmartWallet(
  client: PublicClient,
  sender: Address,
  initCode?: Hex
): Promise<{ isCoinbaseSmartWallet: boolean; error?: string; code?: string }> {
  const userOp: RpcUserOperationV06 = {
    sender,
    ...(initCode && { initCode }),
  };

  const result = await isWalletACoinbaseSmartWallet({
    client,
    userOp: userOp as any, // Type assertion for OnchainKit compatibility
  });

  return result;
}

/**
 * Convenience function to check if connected wallet is a Coinbase Smart Wallet
 * Uses the default publicClient from viemClient
 * 
 * @param sender - The wallet address to check
 * @param initCode - Optional init code for new wallets
 * @returns Promise that resolves to true if it's a Coinbase Smart Wallet
 * 
 * @example
 * ```ts
 * const { address } = useAccount();
 * if (address) {
 *   const isSmartWallet = await isCoinbaseSmartWallet(address);
 *   if (isSmartWallet) {
 *     console.log('User is using Coinbase Smart Wallet');
 *   }
 * }
 * ```
 */
export async function isCoinbaseSmartWallet(
  sender: Address,
  initCode?: Hex
): Promise<boolean> {
  const result = await checkCoinbaseSmartWallet(publicClient as PublicClient, sender, initCode);
  return result.isCoinbaseSmartWallet;
}

/**
 * Base EntryPoint v0.6 address for Account Abstraction
 * This is the standard entrypoint used by Coinbase Smart Wallet and other ERC-4337 wallets
 */
export const BASE_ENTRYPOINT_V06 = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as const;

/**
 * Validates if the Base EntryPoint v0.6 is valid
 * @returns true if Base EntryPoint is valid
 */
export function isBaseEntrypointValid(): boolean {
  return isValidEntrypoint(BASE_ENTRYPOINT_V06);
}


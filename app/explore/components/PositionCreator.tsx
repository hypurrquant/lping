"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useChainId, useSwitchChain } from "wagmi";
import { Address } from "viem";
import { PoolData, LiquidityDistribution } from "@/lib/explore/types";
import { ZapQuote, ZapStepInfo } from "@/lib/zap/types";

interface PositionCreatorProps {
  pool: PoolData;
  distribution: LiquidityDistribution;
  onClose: () => void;
}

type RangePreset = "emission" | "narrow" | "medium" | "wide";

const BASE_CHAIN_ID = 8453;

export default function PositionCreator({
  pool,
  distribution,
  onClose,
}: PositionCreatorProps) {
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { sendTransaction, data: txHash, isPending: isWriting, error: writeError } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const [rangePreset, setRangePreset] = useState<RangePreset>("emission");
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [autoStake, setAutoStake] = useState(true);
  const [quote, setQuote] = useState<ZapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const currentPrice = distribution.currentPrice;

  // Get tick range from preset
  const getTickRange = useCallback((): { tickLower: number; tickUpper: number } => {
    const emissionRange = distribution.emissionRange;

    switch (rangePreset) {
      case "emission":
        return emissionRange
          ? { tickLower: emissionRange.tickLower, tickUpper: emissionRange.tickUpper }
          : { tickLower: -2000, tickUpper: 2000 };
      case "narrow":
        return {
          tickLower: Math.floor(Math.log(0.95) / Math.log(1.0001)),
          tickUpper: Math.ceil(Math.log(1.05) / Math.log(1.0001)),
        };
      case "medium":
        return {
          tickLower: Math.floor(Math.log(0.85) / Math.log(1.0001)),
          tickUpper: Math.ceil(Math.log(1.15) / Math.log(1.0001)),
        };
      case "wide":
        return {
          tickLower: Math.floor(Math.log(0.7) / Math.log(1.0001)),
          tickUpper: Math.ceil(Math.log(1.3) / Math.log(1.0001)),
        };
    }
  }, [rangePreset, distribution.emissionRange]);

  // Fetch quote when inputs change
  useEffect(() => {
    if (!userAddress || (!amount0 && !amount1)) {
      setQuote(null);
      return;
    }

    const fetchQuote = async () => {
      setIsLoadingQuote(true);
      try {
        const { tickLower, tickUpper } = getTickRange();
        const response = await fetch("/api/zap/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            poolAddress: pool.id,
            userAddress,
            tickLower,
            tickUpper,
            amount0Desired: amount0 || "0",
            amount1Desired: amount1 || "0",
            slippagePercent: parseFloat(slippage) || 0.5,
            autoStake,
          }),
        });

        const data = await response.json();
        if (data.quote) {
          setQuote(data.quote);
          setCurrentStep(0);
          setCompletedSteps([]);
        }
      } catch (error) {
        console.error("Error fetching quote:", error);
      } finally {
        setIsLoadingQuote(false);
      }
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [userAddress, amount0, amount1, slippage, autoStake, pool.id, getTickRange]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && quote) {
      setCompletedSteps((prev) => [...prev, currentStep]);
      if (currentStep < quote.steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  }, [isConfirmed, currentStep, quote]);

  // Execute current step
  const executeStep = async () => {
    if (!quote || !quote.steps[currentStep]?.transaction) return;

    const step = quote.steps[currentStep];
    const tx = step.transaction!;

    sendTransaction({
      to: tx.to,
      data: tx.data,
      value: tx.value,
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const getStepLabel = (step: ZapStepInfo): string => {
    switch (step.step) {
      case "approve_token0":
        return `Approve ${pool.token0.symbol}`;
      case "approve_token1":
        return `Approve ${pool.token1.symbol}`;
      case "mint":
        return "Create Position";
      case "approve_nft":
        return "Approve NFT";
      case "stake":
        return "Stake Position";
      default:
        return step.step;
    }
  };

  // Check if on wrong network
  const isWrongNetwork = chainId !== BASE_CHAIN_ID;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">
            Create Position
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Pool Info */}
          <div className="flex items-center justify-between bg-[#0a0a0a] rounded-xl p-3">
            <div>
              <div className="font-semibold text-white">
                {pool.token0.symbol}/{pool.token1.symbol}
              </div>
              <div className="text-xs text-gray-500">
                Fee: {(pool.fee / 10000).toFixed(2)}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-emerald-400 font-bold">
                {pool.totalAPR.toFixed(1)}% APR
              </div>
              <div className="text-xs text-gray-500">
                Current: {formatPrice(currentPrice)}
              </div>
            </div>
          </div>

          {/* Wallet Connection */}
          {!isConnected ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
              <div className="text-yellow-400 font-medium mb-2">
                Wallet Not Connected
              </div>
              <div className="text-sm text-gray-400">
                Connect your wallet to create a position
              </div>
            </div>
          ) : isWrongNetwork ? (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
              <div className="text-orange-400 font-medium mb-2">
                Wrong Network
              </div>
              <div className="text-sm text-gray-400 mb-3">
                Please switch to Base network
              </div>
              <button
                onClick={() => switchChain({ chainId: BASE_CHAIN_ID })}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
              >
                Switch to Base
              </button>
            </div>
          ) : (
            <>
              {/* Range Selection */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Price Range</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "emission", label: "Emission", desc: "AERO range" },
                    { id: "narrow", label: "±5%", desc: "High APR" },
                    { id: "medium", label: "±15%", desc: "Balanced" },
                    { id: "wide", label: "±30%", desc: "Safe" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setRangePreset(preset.id as RangePreset)}
                      className={`p-2 rounded-lg text-center transition border ${
                        rangePreset === preset.id
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                          : "bg-[#0a0a0a] border-gray-800 text-gray-400 hover:border-gray-700"
                      }`}
                    >
                      <div className="text-xs font-medium">{preset.label}</div>
                      <div className="text-[10px] opacity-70">{preset.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Token Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    {pool.token0.symbol} Amount
                  </label>
                  <input
                    type="text"
                    value={amount0}
                    onChange={(e) => setAmount0(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0.0"
                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl py-3 px-4 text-white outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">
                    {pool.token1.symbol} Amount
                  </label>
                  <input
                    type="text"
                    value={amount1}
                    onChange={(e) => setAmount1(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0.0"
                    className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl py-3 px-4 text-white outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Settings */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-400">Slippage:</label>
                  <input
                    type="text"
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="w-16 bg-[#0a0a0a] border border-gray-800 rounded-lg py-1 px-2 text-white text-sm outline-none focus:border-emerald-500 transition text-center"
                  />
                  <span className="text-sm text-gray-400">%</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoStake}
                    onChange={(e) => setAutoStake(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-400">Auto-stake for AERO</span>
                </label>
              </div>

              {/* Quote Display */}
              {isLoadingQuote ? (
                <div className="bg-[#0a0a0a] rounded-xl p-4 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2" />
                  <div className="text-sm text-gray-400">Calculating...</div>
                </div>
              ) : quote ? (
                <div className="space-y-3">
                  {/* Position Summary */}
                  <div className="bg-[#0a0a0a] rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-2">Position Value</div>
                    <div className="text-xl font-bold text-white">
                      ${quote.position.totalValueUSD.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {quote.position.amount0} {pool.token0.symbol} + {quote.position.amount1} {pool.token1.symbol}
                    </div>
                  </div>

                  {/* Warnings */}
                  {quote.warnings.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                      {quote.warnings.map((warning, i) => (
                        <div key={i} className="text-sm text-yellow-400 flex items-start gap-2">
                          <span>⚠️</span>
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Transaction Steps */}
                  <div className="bg-[#0a0a0a] rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-3">Transaction Steps</div>
                    <div className="space-y-2">
                      {quote.steps.map((step, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            completedSteps.includes(i)
                              ? "bg-emerald-500/10"
                              : i === currentStep
                                ? "bg-blue-500/10"
                                : "bg-gray-800/50"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              completedSteps.includes(i)
                                ? "bg-emerald-500 text-white"
                                : i === currentStep
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-700 text-gray-400"
                            }`}
                          >
                            {completedSteps.includes(i) ? "✓" : i + 1}
                          </div>
                          <div className="flex-1">
                            <div
                              className={`text-sm font-medium ${
                                completedSteps.includes(i)
                                  ? "text-emerald-400"
                                  : i === currentStep
                                    ? "text-white"
                                    : "text-gray-500"
                              }`}
                            >
                              {getStepLabel(step)}
                            </div>
                          </div>
                          {i === currentStep && (isWriting || isConfirming) && (
                            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Error Display */}
                  {writeError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                      <div className="text-sm text-red-400">
                        {writeError.message.slice(0, 100)}...
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={executeStep}
                    disabled={isWriting || isConfirming || completedSteps.length === quote.steps.length}
                    className={`w-full py-4 rounded-xl font-bold transition ${
                      completedSteps.length === quote.steps.length
                        ? "bg-emerald-500 text-white"
                        : isWriting || isConfirming
                          ? "bg-gray-700 text-gray-400 cursor-wait"
                          : "bg-emerald-500 hover:bg-emerald-600 text-white"
                    }`}
                  >
                    {completedSteps.length === quote.steps.length
                      ? "✓ Position Created!"
                      : isWriting
                        ? "Confirm in Wallet..."
                        : isConfirming
                          ? "Confirming..."
                          : getStepLabel(quote.steps[currentStep])}
                  </button>
                </div>
              ) : (
                <div className="bg-[#0a0a0a] rounded-xl p-4 text-center text-gray-400">
                  Enter amounts to see quote
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

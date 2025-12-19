"use client";

import React, { useState, useEffect } from "react";
import { PoolData, SimulationResult, LiquidityDistribution } from "@/lib/explore/types";

interface InvestmentSimulatorProps {
  pool: PoolData;
  distribution: LiquidityDistribution;
  onSimulate?: (result: SimulationResult) => void;
}

type RangePreset = "emission" | "narrow" | "medium" | "wide" | "custom";

export default function InvestmentSimulator({
  pool,
  distribution,
  onSimulate,
}: InvestmentSimulatorProps) {
  const [investmentAmount, setInvestmentAmount] = useState("1000");
  const [rangePreset, setRangePreset] = useState<RangePreset>("emission");
  const [customRange, setCustomRange] = useState({ lower: 0, upper: 0 });
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currentPrice = distribution.currentPrice;

  // Calculate price range based on preset
  const getRange = (): { lower: number; upper: number; tickLower: number; tickUpper: number } => {
    const emissionRange = distribution.emissionRange;

    switch (rangePreset) {
      case "emission":
        return emissionRange
          ? {
              lower: emissionRange.priceLower,
              upper: emissionRange.priceUpper,
              tickLower: emissionRange.tickLower,
              tickUpper: emissionRange.tickUpper,
            }
          : {
              lower: currentPrice * 0.8,
              upper: currentPrice * 1.2,
              tickLower: -2000,
              tickUpper: 2000,
            };
      case "narrow":
        return {
          lower: currentPrice * 0.95,
          upper: currentPrice * 1.05,
          tickLower: Math.round(Math.log(0.95) / Math.log(1.0001)),
          tickUpper: Math.round(Math.log(1.05) / Math.log(1.0001)),
        };
      case "medium":
        return {
          lower: currentPrice * 0.85,
          upper: currentPrice * 1.15,
          tickLower: Math.round(Math.log(0.85) / Math.log(1.0001)),
          tickUpper: Math.round(Math.log(1.15) / Math.log(1.0001)),
        };
      case "wide":
        return {
          lower: currentPrice * 0.7,
          upper: currentPrice * 1.3,
          tickLower: Math.round(Math.log(0.7) / Math.log(1.0001)),
          tickUpper: Math.round(Math.log(1.3) / Math.log(1.0001)),
        };
      case "custom":
        return {
          lower: customRange.lower || currentPrice * 0.9,
          upper: customRange.upper || currentPrice * 1.1,
          tickLower: Math.round(
            Math.log((customRange.lower || currentPrice * 0.9) / currentPrice) /
              Math.log(1.0001)
          ),
          tickUpper: Math.round(
            Math.log((customRange.upper || currentPrice * 1.1) / currentPrice) /
              Math.log(1.0001)
          ),
        };
    }
  };

  const range = getRange();
  const rangePercent = ((range.upper - range.lower) / currentPrice) * 100;

  // Run simulation
  const runSimulation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poolAddress: pool.id,
          investmentUSD: parseFloat(investmentAmount) || 1000,
          tickLower: range.tickLower,
          tickUpper: range.tickUpper,
          durationDays: 30,
        }),
      });

      const data = await response.json();
      if (data.result) {
        setSimulationResult(data.result);
        onSimulate?.(data.result);
      }
    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.id, investmentAmount, rangePreset, customRange]);

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const getRiskLevel = () => {
    if (rangePercent >= 40) return { label: "Low", color: "text-emerald-400", bg: "bg-emerald-500/10" };
    if (rangePercent >= 20) return { label: "Medium", color: "text-yellow-400", bg: "bg-yellow-500/10" };
    return { label: "High", color: "text-red-400", bg: "bg-red-500/10" };
  };

  const risk = getRiskLevel();

  return (
    <div className="space-y-4">
      {/* Investment Amount */}
      <div className="bg-[#111] rounded-xl border border-gray-800 p-4">
        <h3 className="text-sm font-medium text-white mb-3">Investment Amount</h3>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            $
          </span>
          <input
            type="text"
            value={investmentAmount}
            onChange={(e) =>
              setInvestmentAmount(e.target.value.replace(/[^0-9.]/g, ""))
            }
            className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl py-3 pl-8 pr-4 text-xl font-bold outline-none focus:border-emerald-500 transition text-white"
            placeholder="1,000"
          />
        </div>
        <div className="flex gap-2 mt-3">
          {["1000", "5000", "10000", "50000"].map((amount) => (
            <button
              key={amount}
              onClick={() => setInvestmentAmount(amount)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                investmentAmount === amount
                  ? "bg-emerald-500 text-white"
                  : "bg-[#1a1a1a] text-gray-400 hover:text-white border border-gray-700"
              }`}
            >
              ${parseInt(amount).toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Range Selection */}
      <div className="bg-[#111] rounded-xl border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Price Range</h3>
          <span className={`px-2 py-1 rounded text-xs font-medium ${risk.bg} ${risk.color}`}>
            {risk.label} Risk
          </span>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[
            { id: "emission", label: "Emission", desc: "AERO rewards" },
            { id: "narrow", label: "±5%", desc: "High APR" },
            { id: "medium", label: "±15%", desc: "Balanced" },
            { id: "wide", label: "±30%", desc: "Safe" },
            { id: "custom", label: "Custom", desc: "Your range" },
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

        {/* Custom Range Inputs */}
        {rangePreset === "custom" && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">
                Min Price
              </label>
              <input
                type="text"
                value={customRange.lower || ""}
                onChange={(e) =>
                  setCustomRange({
                    ...customRange,
                    lower: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder={formatPrice(currentPrice * 0.9)}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg py-2 px-3 text-sm outline-none focus:border-emerald-500 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">
                Max Price
              </label>
              <input
                type="text"
                value={customRange.upper || ""}
                onChange={(e) =>
                  setCustomRange({
                    ...customRange,
                    upper: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder={formatPrice(currentPrice * 1.1)}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg py-2 px-3 text-sm outline-none focus:border-emerald-500 text-white"
              />
            </div>
          </div>
        )}

        {/* Range Display */}
        <div className="bg-[#0a0a0a] rounded-lg p-3 border border-gray-800">
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="text-[10px] text-gray-500">Min</div>
              <div className="text-red-400 font-medium">
                {formatPrice(range.lower)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-gray-500">Current</div>
              <div className="text-white font-bold">
                {formatPrice(currentPrice)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-500">Max</div>
              <div className="text-emerald-400 font-medium">
                {formatPrice(range.upper)}
              </div>
            </div>
          </div>
          <div className="mt-2 text-center text-xs text-gray-500">
            Range Width: ±{(rangePercent / 2).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Simulation Results */}
      {isLoading ? (
        <div className="bg-[#111] rounded-xl border border-gray-800 p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
          <div className="text-gray-400">Simulating...</div>
        </div>
      ) : simulationResult ? (
        <div className="bg-emerald-500/5 rounded-xl border-2 border-emerald-500/30 p-4">
          <h3 className="text-sm font-medium text-emerald-400 mb-4">
            Projected Earnings
          </h3>

          {/* Earnings Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#0a0a0a] rounded-lg p-3">
              <div className="text-[10px] text-gray-500 mb-1">Daily</div>
              <div className="text-lg font-bold text-white">
                {formatUSD(simulationResult.totalEarnings.daily)}
              </div>
            </div>
            <div className="bg-[#0a0a0a] rounded-lg p-3">
              <div className="text-[10px] text-gray-500 mb-1">Weekly</div>
              <div className="text-lg font-bold text-white">
                {formatUSD(simulationResult.totalEarnings.weekly)}
              </div>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/30">
              <div className="text-[10px] text-emerald-400 mb-1">Monthly</div>
              <div className="text-xl font-bold text-emerald-400">
                {formatUSD(simulationResult.totalEarnings.monthly)}
              </div>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/30">
              <div className="text-[10px] text-emerald-400 mb-1">Yearly</div>
              <div className="text-xl font-bold text-emerald-400">
                {formatUSD(simulationResult.totalEarnings.yearly)}
              </div>
            </div>
          </div>

          {/* APR Breakdown */}
          <div className="bg-[#0a0a0a] rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Fee APR</span>
              <span className="text-sm font-medium text-blue-400">
                {simulationResult.feeEarnings.apr.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Emission APR</span>
              <span className="text-sm font-medium text-purple-400">
                {simulationResult.emissionEarnings.apr.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <span className="text-xs text-white font-medium">Total APR</span>
              <span className="text-lg font-bold text-emerald-400">
                {simulationResult.totalEarnings.apr.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-[#0a0a0a] rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-500">IL at ±10%</div>
              <div className="text-sm font-medium text-red-400">
                {simulationResult.impermanentLoss.at10PercentMove.toFixed(2)}%
              </div>
            </div>
            <div className="bg-[#0a0a0a] rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-500">In-Range Prob</div>
              <div className="text-sm font-medium text-blue-400">
                {simulationResult.inRangeProbability}%
              </div>
            </div>
            <div className="bg-[#0a0a0a] rounded-lg p-2 text-center">
              <div className="text-[10px] text-gray-500">Capital Eff.</div>
              <div className="text-sm font-medium text-emerald-400">
                {simulationResult.capitalEfficiency.toFixed(1)}x
              </div>
            </div>
          </div>

          {/* Share of Pool */}
          <div className="text-center text-xs text-gray-400">
            Your share of emission range:{" "}
            <span className="text-white font-medium">
              {(simulationResult.shareOfEmissionRange * 100).toFixed(4)}%
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

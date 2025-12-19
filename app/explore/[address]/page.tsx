"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LiquidityChart from "../components/LiquidityChart";
import InvestmentSimulator from "../components/InvestmentSimulator";
import PositionCreator from "../components/PositionCreator";
import { PoolData, LiquidityDistribution } from "@/lib/explore/types";

export default function PoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const address = params.address as string;

  const [pool, setPool] = useState<PoolData | null>(null);
  const [liquidityDistribution, setLiquidityDistribution] =
    useState<LiquidityDistribution | null>(null);
  const [liquidityHistogram, setLiquidityHistogram] = useState<
    { price: number; liquidity: number; isInEmissionRange: boolean }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPositionCreator, setShowPositionCreator] = useState(false);

  useEffect(() => {
    async function fetchPoolDetail() {
      if (!address) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/pools/${address}`);
        if (!response.ok) {
          throw new Error("Pool not found");
        }
        const data = await response.json();

        if (!data.id) {
          throw new Error("Pool not found");
        }

        setPool(data);
        setLiquidityDistribution(data.liquidityDistribution);
        setLiquidityHistogram(data.liquidityHistogram || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load pool");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPoolDetail();
  }, [address]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-gray-400">Loading pool data...</div>
        </div>
      </div>
    );
  }

  if (error || !pool) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <div className="text-xl font-medium mb-2">Pool Not Found</div>
          <div className="text-gray-400 mb-6">{error || "This pool does not exist"}</div>
          <Link
            href="/explore"
            className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition"
          >
            Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Pool Header */}
        <div className="bg-[#111] rounded-xl border border-gray-800 p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-white">
                {pool.token0.symbol}/{pool.token1.symbol}
              </h1>
              <div className="text-xs text-gray-500 mt-1">
                Fee: {(pool.fee / 10000).toFixed(2)}% • Tick Spacing: {pool.tickSpacing}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-400">
                {pool.totalAPR.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Total APR</div>
            </div>
          </div>

          {/* APR Breakdown */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-800">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Fee APR</div>
              <div className="text-sm font-semibold text-blue-400">
                {pool.feeAPR.toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Emission APR</div>
              <div className="text-sm font-semibold text-purple-400">
                {pool.emissionAPR.toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">TVL</div>
              <div className="text-sm font-semibold text-white">
                ${pool.tvlUSD >= 1000000
                  ? (pool.tvlUSD / 1000000).toFixed(2) + "M"
                  : pool.tvlUSD >= 1000
                    ? (pool.tvlUSD / 1000).toFixed(0) + "K"
                    : pool.tvlUSD.toFixed(0)}
              </div>
            </div>
          </div>

          {/* APR Trend & Risk */}
          <div className="grid grid-cols-4 gap-2 pt-3 mt-3 border-t border-gray-800">
            <div className="text-center">
              <div className="text-[10px] text-gray-500 mb-1">24h</div>
              <div
                className={`text-xs font-medium ${
                  pool.aprChange1d > 0
                    ? "text-emerald-400"
                    : pool.aprChange1d < 0
                      ? "text-red-400"
                      : "text-gray-400"
                }`}
              >
                {pool.aprChange1d > 0 ? "+" : ""}
                {pool.aprChange1d.toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-gray-500 mb-1">7d</div>
              <div
                className={`text-xs font-medium ${
                  pool.aprChange7d > 0
                    ? "text-emerald-400"
                    : pool.aprChange7d < 0
                      ? "text-red-400"
                      : "text-gray-400"
                }`}
              >
                {pool.aprChange7d > 0 ? "+" : ""}
                {pool.aprChange7d.toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-gray-500 mb-1">30d Avg</div>
              <div className="text-xs font-medium text-gray-300">
                {pool.aprMean30d.toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-gray-500 mb-1">IL Risk</div>
              <div
                className={`text-xs font-medium ${
                  pool.ilRisk === "no" || pool.isStablecoin
                    ? "text-emerald-400"
                    : pool.ilRisk === "yes"
                      ? "text-yellow-400"
                      : "text-gray-400"
                }`}
              >
                {pool.isStablecoin
                  ? "Low"
                  : pool.ilRisk === "yes"
                    ? "High"
                    : pool.ilRisk === "no"
                      ? "Low"
                      : "Med"}
              </div>
            </div>
          </div>
        </div>

        {/* Emission Info */}
        {liquidityDistribution?.emissionRange && (
          <div className="bg-[#111] rounded-xl border border-gray-800 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <span className="text-lg">🎯</span>
                AERO Emissions
              </h3>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  liquidityDistribution.emissionRange.isGaugeActive
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {liquidityDistribution.emissionRange.isGaugeActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-[#0a0a0a] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Daily AERO</div>
                <div className="text-lg font-bold text-purple-400">
                  {liquidityDistribution.emissionRange.aeroPerDay.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="text-xs text-gray-500">
                  ≈ $
                  {liquidityDistribution.emissionRange.aeroValuePerDay.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                  /day
                </div>
              </div>
              <div className="bg-[#0a0a0a] rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Liquidity in Range</div>
                <div className="text-lg font-bold text-white">
                  {liquidityDistribution.emissionRange.percentOfTotal.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">of total liquidity</div>
              </div>
            </div>

            {/* Per $1000 investment */}
            <div className="bg-gradient-to-r from-purple-500/10 to-emerald-500/10 rounded-lg p-3 border border-purple-500/20">
              <div className="text-xs text-gray-400 mb-1">Per $1,000 Investment</div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-white">
                    {liquidityDistribution.emissionRange.aeroPerDayPer1000.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400 ml-1">AERO/day</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-emerald-400">
                    ${liquidityDistribution.emissionRange.usdPerDayPer1000.toFixed(2)}
                  </span>
                  <span className="text-sm text-gray-400 ml-1">/day</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liquidity Chart */}
        {liquidityDistribution && (
          <LiquidityChart distribution={liquidityDistribution} histogram={liquidityHistogram} />
        )}

        {/* Investment Simulator */}
        {liquidityDistribution && (
          <div className="mt-4">
            <InvestmentSimulator pool={pool} distribution={liquidityDistribution} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mt-4">
          <button
            onClick={() => setShowPositionCreator(true)}
            className="block w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 text-center"
          >
            Create Position
          </button>
          <a
            href={`https://aerodrome.finance/deposit?token0=${pool.token0.address}&token1=${pool.token1.address}&type=-1&tickSpacing=${pool.tickSpacing}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-[#111] hover:bg-[#1a1a1a] text-gray-400 hover:text-white font-medium rounded-xl transition border border-gray-800 text-center text-sm"
          >
            Or use Aerodrome directly →
          </a>
        </div>

        {/* Position Creator Modal */}
        {showPositionCreator && liquidityDistribution && (
          <PositionCreator
            pool={pool}
            distribution={liquidityDistribution}
            onClose={() => setShowPositionCreator(false)}
          />
        )}
      </main>
    </div>
  );
}

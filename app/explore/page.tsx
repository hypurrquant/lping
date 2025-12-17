"use client";

import React, { useState, useEffect } from "react";
import PoolList from "./components/PoolList";
import LiquidityChart from "./components/LiquidityChart";
import InvestmentSimulator from "./components/InvestmentSimulator";
import {
  PoolData,
  PoolsAPIResponse,
  LiquidityDistribution,
} from "@/lib/explore/types";

type SortOption = "apr" | "tvl" | "volume" | "fees";

export default function ExplorePage() {
  // State
  const [pools, setPools] = useState<PoolData[]>([]);
  const [selectedPool, setSelectedPool] = useState<PoolData | null>(null);
  const [liquidityDistribution, setLiquidityDistribution] =
    useState<LiquidityDistribution | null>(null);
  const [liquidityHistogram, setLiquidityHistogram] = useState<
    { price: number; liquidity: number; isInEmissionRange: boolean }[]
  >([]);

  // Filters
  const [sortBy, setSortBy] = useState<SortOption>("apr");
  const [tokenFilter, setTokenFilter] = useState("");
  const [minTVL, setMinTVL] = useState("");

  // Loading states
  const [isLoadingPools, setIsLoadingPools] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Fetch pools
  useEffect(() => {
    async function fetchPools() {
      setIsLoadingPools(true);
      try {
        const params = new URLSearchParams({
          sortBy,
          sortOrder: "desc",
          limit: "50",
        });
        if (tokenFilter) params.set("token", tokenFilter);
        if (minTVL) params.set("minTVL", minTVL);

        const response = await fetch(`/api/pools?${params}`);
        const data: PoolsAPIResponse = await response.json();
        setPools(data.pools);
      } catch (error) {
        console.error("Error fetching pools:", error);
      } finally {
        setIsLoadingPools(false);
      }
    }

    fetchPools();
  }, [sortBy, tokenFilter, minTVL]);

  // Fetch pool detail when selected
  useEffect(() => {
    async function fetchPoolDetail() {
      if (!selectedPool) {
        setLiquidityDistribution(null);
        setLiquidityHistogram([]);
        return;
      }

      setIsLoadingDetail(true);
      try {
        const response = await fetch(`/api/pools/${selectedPool.id}`);
        const data = await response.json();
        setLiquidityDistribution(data.liquidityDistribution);
        setLiquidityHistogram(data.liquidityHistogram || []);
      } catch (error) {
        console.error("Error fetching pool detail:", error);
      } finally {
        setIsLoadingDetail(false);
      }
    }

    fetchPoolDetail();
  }, [selectedPool?.id]);

  return (
    <div className="min-h-screen bg-black text-white pb-4">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <svg
              className="w-6 h-6 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Discover
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Find pools, analyze APR breakdown, and simulate your investment
          </p>
        </div>

        {/* Filters */}
        <div className="bg-[#111] rounded-xl border border-gray-800 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Sort */}
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                <option value="apr">APR (Highest)</option>
                <option value="tvl">TVL (Highest)</option>
                <option value="volume">Volume (Highest)</option>
                <option value="fees">Fees (Highest)</option>
              </select>
            </div>

            {/* Token Filter */}
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">
                Filter by Token
              </label>
              <input
                type="text"
                value={tokenFilter}
                onChange={(e) => setTokenFilter(e.target.value)}
                placeholder="WETH, USDC..."
                className="bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 w-32"
              />
            </div>

            {/* Min TVL */}
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">
                Min TVL
              </label>
              <input
                type="text"
                value={minTVL}
                onChange={(e) =>
                  setMinTVL(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="100000"
                className="bg-[#0a0a0a] border border-gray-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 w-28"
              />
            </div>

            {/* Clear Filters */}
            {(tokenFilter || minTVL) && (
              <button
                onClick={() => {
                  setTokenFilter("");
                  setMinTVL("");
                }}
                className="text-xs text-gray-400 hover:text-white mt-4"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Pool List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-white">
                Available Pools ({pools.length})
              </h2>
            </div>
            <div className="max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
              <PoolList
                pools={pools}
                onSelectPool={setSelectedPool}
                selectedPoolId={selectedPool?.id}
                isLoading={isLoadingPools}
              />
            </div>
          </div>

          {/* Right: Pool Detail & Simulator */}
          <div>
            {selectedPool ? (
              <div className="space-y-4">
                {/* Pool Header with APR Breakdown */}
                <div className="bg-[#111] rounded-xl border border-gray-800 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {selectedPool.token0.symbol}/
                        {selectedPool.token1.symbol}
                      </h2>
                      <div className="text-xs text-gray-500 mt-1">
                        Fee: {(selectedPool.fee / 10000).toFixed(2)}% • Tick
                        Spacing: {selectedPool.tickSpacing}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">
                        {selectedPool.totalAPR.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Total APR</div>
                    </div>
                  </div>

                  {/* APR Breakdown */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-800">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Fee APR</div>
                      <div className="text-sm font-semibold text-blue-400">
                        {selectedPool.feeAPR.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Emission APR</div>
                      <div className="text-sm font-semibold text-purple-400">
                        {selectedPool.emissionAPR.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">TVL</div>
                      <div className="text-sm font-semibold text-white">
                        ${selectedPool.tvlUSD >= 1000000
                          ? (selectedPool.tvlUSD / 1000000).toFixed(2) + 'M'
                          : selectedPool.tvlUSD >= 1000
                            ? (selectedPool.tvlUSD / 1000).toFixed(0) + 'K'
                            : selectedPool.tvlUSD.toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Liquidity Chart */}
                {isLoadingDetail ? (
                  <div className="bg-[#111] rounded-xl border border-gray-800 p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
                    <div className="text-gray-400">
                      Loading liquidity data...
                    </div>
                  </div>
                ) : liquidityDistribution ? (
                  <LiquidityChart
                    distribution={liquidityDistribution}
                    histogram={liquidityHistogram}
                  />
                ) : null}

                {/* Investment Simulator */}
                {liquidityDistribution && (
                  <InvestmentSimulator
                    pool={selectedPool}
                    distribution={liquidityDistribution}
                  />
                )}

                {/* Action Button */}
                <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-500/20">
                  Create Position
                </button>
              </div>
            ) : (
              <div className="bg-[#111] rounded-xl border border-gray-800 p-8 text-center h-full min-h-[400px] flex flex-col items-center justify-center">
                <div className="text-6xl mb-4">👈</div>
                <div className="text-xl font-medium text-white mb-2">
                  Select a Pool
                </div>
                <div className="text-gray-400 text-sm">
                  Choose a pool from the list to view liquidity distribution
                  <br />
                  and simulate your investment
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

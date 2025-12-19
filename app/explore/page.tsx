"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PoolData, PoolsAPIResponse } from "@/lib/explore/types";
import { getCuratedAddresses } from "@/lib/explore/curatedPools";

export default function ExplorePage() {
  const router = useRouter();
  const [pools, setPools] = useState<PoolData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch curated pools
  useEffect(() => {
    async function fetchPools() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/pools?sortBy=tvl&sortOrder=desc&limit=100`);
        const data: PoolsAPIResponse = await response.json();

        // Filter to only curated pools
        const curatedAddresses = getCuratedAddresses();
        const curatedPools = data.pools.filter((pool) =>
          curatedAddresses.includes(pool.id.toLowerCase())
        );

        // Sort by TVL
        curatedPools.sort((a, b) => b.tvlUSD - a.tvlUSD);

        setPools(curatedPools);
      } catch (error) {
        console.error("Error fetching pools:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPools();
  }, []);

  const formatTVL = (tvl: number) => {
    if (tvl >= 1000000) return `$${(tvl / 1000000).toFixed(1)}M`;
    if (tvl >= 1000) return `$${(tvl / 1000).toFixed(0)}K`;
    return `$${tvl.toFixed(0)}`;
  };

  const handlePoolClick = (pool: PoolData) => {
    router.push(`/explore/${pool.id}`);
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <main className="max-w-2xl mx-auto px-4 py-4">
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
            Curated high-quality Aerodrome CL pools
          </p>
        </div>

        {/* Pool List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-[#111] rounded-xl border border-gray-800 p-4 animate-pulse"
              >
                <div className="h-5 bg-gray-800 rounded w-32 mb-2" />
                <div className="h-4 bg-gray-800 rounded w-24" />
              </div>
            ))}
          </div>
        ) : pools.length === 0 ? (
          <div className="bg-[#111] rounded-xl border border-gray-800 p-8 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-gray-400">No pools available</div>
          </div>
        ) : (
          <div className="space-y-3">
            {pools.map((pool) => (
              <button
                key={pool.id}
                onClick={() => handlePoolClick(pool)}
                className="w-full bg-[#111] rounded-xl border border-gray-800 p-4 hover:border-emerald-500/50 hover:bg-[#151515] transition text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">
                      {pool.token0.symbol}/{pool.token1.symbol}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTVL(pool.tvlUSD)} TVL • {(pool.fee / 10000).toFixed(2)}% fee
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">
                      {pool.totalAPR.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-gray-500">APR</div>
                  </div>
                </div>

                {/* APR Breakdown Bar */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden flex">
                    {pool.feeAPR > 0 && (
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${(pool.feeAPR / pool.totalAPR) * 100}%`,
                        }}
                      />
                    )}
                    {pool.emissionAPR > 0 && (
                      <div
                        className="h-full bg-purple-500"
                        style={{
                          width: `${(pool.emissionAPR / pool.totalAPR) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    {pool.feeAPR > 0 && (
                      <span className="text-blue-400">Fee {pool.feeAPR.toFixed(1)}%</span>
                    )}
                    {pool.emissionAPR > 0 && (
                      <span className="text-purple-400">AERO {pool.emissionAPR.toFixed(1)}%</span>
                    )}
                  </div>
                </div>

                {/* Risk & Status */}
                <div className="mt-2 flex items-center gap-2">
                  {pool.isGaugeAlive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      Active Gauge
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      pool.isStablecoin || pool.ilRisk === "no"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : pool.ilRisk === "yes"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {pool.isStablecoin ? "Stable" : pool.ilRisk === "no" ? "Low IL" : "IL Risk"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

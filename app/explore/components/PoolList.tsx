"use client";

import React from "react";
import { PoolData } from "@/lib/explore/types";

interface PoolListProps {
  pools: PoolData[];
  onSelectPool: (pool: PoolData) => void;
  selectedPoolId?: string;
  isLoading?: boolean;
}

function formatNumber(num: number, decimals: number = 2): string {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`;
  return `$${num.toFixed(decimals)}`;
}

export default function PoolList({
  pools,
  onSelectPool,
  selectedPoolId,
  isLoading,
}: PoolListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-[#111] rounded-xl border border-gray-800 p-4 animate-pulse"
          >
            <div className="h-6 bg-gray-800 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-800 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <div className="bg-[#111] rounded-xl border border-gray-800 p-8 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <div className="text-gray-400">No pools found</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pools.map((pool, index) => (
        <button
          key={pool.id}
          onClick={() => onSelectPool(pool)}
          className={`w-full text-left p-4 rounded-xl border transition ${
            selectedPoolId === pool.id
              ? "bg-emerald-500/10 border-emerald-500"
              : index === 0
              ? "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500"
              : "bg-[#111] border-gray-800 hover:border-gray-700"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {index === 0 && (
                <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded">
                  TOP APR
                </span>
              )}
              <span className="font-bold text-white">
                {pool.token0.symbol}/{pool.token1.symbol}
              </span>
              <span className="text-xs text-gray-500">
                {(pool.fee / 10000).toFixed(2)}%
              </span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-400">
                {pool.totalAPR.toFixed(1)}%
              </div>
              <div className="text-[10px] text-gray-500">Total APR</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-sm">
            <div>
              <div className="text-[10px] text-gray-500">TVL</div>
              <div className="font-medium text-white">
                {formatNumber(pool.tvlUSD)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500">Volume 24h</div>
              <div className="font-medium text-white">
                {formatNumber(pool.volume24hUSD)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500">Fee APR</div>
              <div className="font-medium text-blue-400">
                {pool.feeAPR.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500">Emission APR</div>
              <div className="font-medium text-purple-400">
                {pool.emissionAPR.toFixed(1)}%
              </div>
            </div>
          </div>

          {pool.isGaugeAlive && (
            <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Gauge Active
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

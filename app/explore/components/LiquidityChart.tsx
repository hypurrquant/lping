"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { LiquidityDistribution } from "@/lib/explore/types";

interface LiquidityChartProps {
  distribution: LiquidityDistribution;
  histogram: { price: number; liquidity: number; isInEmissionRange: boolean }[];
  selectedRange?: { lower: number; upper: number };
  onRangeSelect?: (lower: number, upper: number) => void;
}

export default function LiquidityChart({
  distribution,
  histogram,
  selectedRange,
  onRangeSelect,
}: LiquidityChartProps) {
  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatLiquidity = (value: number) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const maxLiquidity = Math.max(...histogram.map((h) => h.liquidity));

  return (
    <div className="bg-[#111] rounded-xl border border-gray-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <svg
            className="w-4 h-4 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Liquidity Distribution
        </h3>
        {distribution.emissionRange && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-gray-400">Emission Range</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-600" />
              <span className="text-gray-400">Outside Range</span>
            </div>
          </div>
        )}
      </div>

      {/* Current Price */}
      <div className="mb-4 p-3 bg-[#0a0a0a] rounded-lg border border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Current Price</span>
          <span className="text-lg font-bold text-white">
            {formatPrice(distribution.currentPrice)}
          </span>
        </div>
        {distribution.emissionRange && (
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-gray-500">Emission Range</span>
            <span className="text-emerald-400">
              {formatPrice(distribution.emissionRange.priceLower)} -{" "}
              {formatPrice(distribution.emissionRange.priceUpper)}
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={histogram}
            margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
          >
            <XAxis
              dataKey="price"
              tickFormatter={formatPrice}
              tick={{ fill: "#6b7280", fontSize: 10 }}
              axisLine={{ stroke: "#374151" }}
              tickLine={{ stroke: "#374151" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatLiquidity}
              tick={{ fill: "#6b7280", fontSize: 10 }}
              axisLine={{ stroke: "#374151" }}
              tickLine={{ stroke: "#374151" }}
              width={50}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 shadow-lg">
                      <div className="text-xs text-gray-400 mb-1">Price</div>
                      <div className="text-sm font-bold text-white mb-2">
                        {formatPrice(data.price)}
                      </div>
                      <div className="text-xs text-gray-400 mb-1">
                        Liquidity
                      </div>
                      <div className="text-sm font-bold text-white">
                        {formatLiquidity(data.liquidity)}
                      </div>
                      {data.isInEmissionRange && (
                        <div className="mt-2 text-xs text-emerald-400">
                          In Emission Range
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              x={distribution.currentPrice}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{
                value: "Current",
                position: "top",
                fill: "#f59e0b",
                fontSize: 10,
              }}
            />
            <Bar dataKey="liquidity" radius={[2, 2, 0, 0]}>
              {histogram.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isInEmissionRange ? "#10b981" : "#4b5563"}
                  fillOpacity={
                    entry.liquidity / maxLiquidity > 0.1
                      ? 0.8
                      : 0.4
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      {distribution.emissionRange && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-[#0a0a0a] rounded-lg p-3 text-center">
            <div className="text-[10px] text-gray-500 mb-1">
              Liquidity in Range
            </div>
            <div className="text-lg font-bold text-emerald-400">
              {distribution.emissionRange.percentOfTotal.toFixed(1)}%
            </div>
          </div>
          <div className="bg-[#0a0a0a] rounded-lg p-3 text-center">
            <div className="text-[10px] text-gray-500 mb-1">
              Tick Spacing
            </div>
            <div className="text-lg font-bold text-white">
              {distribution.tickSpacing}
            </div>
          </div>
          <div className="bg-[#0a0a0a] rounded-lg p-3 text-center">
            <div className="text-[10px] text-gray-500 mb-1">Active Ticks</div>
            <div className="text-lg font-bold text-white">
              {distribution.ticks.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { Address, isAddress } from "viem";
import { generateZapQuote } from "@/lib/zap/zapService";
import { ZapMintRequest } from "@/lib/zap/types";

// Enso API for token prices
const BASE_CHAIN_ID = 8453;
const ENSO_BATCH_PRICES_URL = `https://api.enso.finance/api/v1/prices/${BASE_CHAIN_ID}`;

async function fetchTokenPrices(addresses: Address[]): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();

  if (addresses.length === 0) return priceMap;

  try {
    const addressesParam = addresses.join(",");
    const response = await fetch(`${ENSO_BATCH_PRICES_URL}?addresses=${addressesParam}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.error(`[zap] Enso API error: ${response.status}`);
      return priceMap;
    }

    const data = await response.json();

    for (const [address, priceData] of Object.entries(data)) {
      if (priceData && typeof priceData === "object" && "price" in priceData) {
        priceMap.set(address.toLowerCase(), (priceData as { price: number }).price);
      }
    }
  } catch (error) {
    console.error("[zap] Error fetching token prices:", error);
  }

  return priceMap;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const {
      poolAddress,
      userAddress,
      tickLower,
      tickUpper,
      amount0Desired,
      amount1Desired,
      slippagePercent = 0.5,
      autoStake = true,
    } = body;

    if (!poolAddress || !isAddress(poolAddress)) {
      return NextResponse.json({ error: "Invalid pool address" }, { status: 400 });
    }

    if (!userAddress || !isAddress(userAddress)) {
      return NextResponse.json({ error: "Invalid user address" }, { status: 400 });
    }

    if (typeof tickLower !== "number" || typeof tickUpper !== "number") {
      return NextResponse.json({ error: "Invalid tick range" }, { status: 400 });
    }

    if (tickLower >= tickUpper) {
      return NextResponse.json({ error: "tickLower must be less than tickUpper" }, { status: 400 });
    }

    // Build request
    const zapRequest: ZapMintRequest = {
      poolAddress: poolAddress as Address,
      userAddress: userAddress as Address,
      tickLower,
      tickUpper,
      amount0Desired: amount0Desired?.toString() || "0",
      amount1Desired: amount1Desired?.toString() || "0",
      slippagePercent: Number(slippagePercent),
      autoStake: Boolean(autoStake),
    };

    // Get pool token addresses first (we need them for price fetching)
    const { getPoolStateForZap } = await import("@/lib/zap/zapService");
    const poolState = await getPoolStateForZap(zapRequest.poolAddress);

    // Fetch token prices
    const tokenPrices = await fetchTokenPrices([poolState.token0, poolState.token1]);

    // Generate quote
    const quote = await generateZapQuote(zapRequest, tokenPrices);

    return NextResponse.json({ quote });
  } catch (error) {
    console.error("[zap/quote] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate quote" },
      { status: 500 }
    );
  }
}

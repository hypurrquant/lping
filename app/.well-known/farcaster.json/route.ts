import { NextResponse } from "next/server";
import { minikitConfig } from "../../../../minikit.config";

export async function GET() {
  return NextResponse.json(minikitConfig);
}

import { withValidManifest } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "../../../minikit.config";

export async function GET() {
  return Response.json(withValidManifest(minikitConfig));
}

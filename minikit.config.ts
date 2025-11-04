const ROOT_URL =
  process.env.NEXT_PUBLIC_ROOT_URL ||
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: ""
  },
  miniapp: {
    version: "1",
    name: "LPing", 
    subtitle: "Track Your LP Positions Like a Pro", 
    description: "Real-time monitoring of your Aerodrome Concentrated Liquidity positions. Track rewards, analyze performance, and never miss an opportunity.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["defi", "lp", "aerodrome", "liquidity", "crypto"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`, 
    tagline: "Track Your LP Positions Like a Pro",
    ogTitle: "LPing - LP Position Tracker",
    ogDescription: "Real-time monitoring of your Aerodrome Concentrated Liquidity positions",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
  },
} as const;


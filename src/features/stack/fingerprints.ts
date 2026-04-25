import type {
  HostingProviderKind,
  TechnologyFingerprint
} from "../../shared/types/audit";

const BRAND = {
  react: "#61dafb",
  nextjs: "#9ca3af",
  vue: "#41b883",
  svelte: "#ff6d3b",
  vercel: "#6366f1",
  cloudflare: "#f6821f",
  cloudfront: "#f59e0b",
  aws: "#f59e0b",
  digitalocean: "#0080ff",
  linode: "#00a95c",
  vultr: "#007bfc",
  heroku: "#79589f",
  gcp: "#4285f4",
  azure: "#0078d4",
  openai: "#10a37f",
  anthropic: "#d97706",
  googleAi: "#60a5fa",
  ga4: "#f9a825",
  gtm: "#f59e0b",
  cloudflareInsights: "#f6821f",
  amazonAds: "#ff9900",
  cloudwatchRum: "#22c55e",
  metaPixel: "#60a5fa",
  segment: "#6ee7ff",
  plausible: "#a78bfa",
  mixpanel: "#8b5cf6",
  sentry: "#8b5cf6",
  algolia: "#5468ff",
  prism: "#dc5e5e",
  three: "#38bdf8",
  webpack: "#60a5fa",
  openGraph: "#f472b6",
  lodash: "#2563eb",
  coreJs: "#22c55e",
  reactFlow: "#06b6d4",
  stripe: "#6772e5",
  bitpay: "#10b981",
  shopify: "#7ab55c",
  paddle: "#6d5efc"
} as const;

function hostingFingerprint(
  id: string,
  label: string,
  minScore: number,
  patterns: TechnologyFingerprint["patterns"],
  brandColor: string,
  providerKind?: HostingProviderKind,
  implies?: string[]
): TechnologyFingerprint {
  return {
    id,
    label,
    group: "hostingCdn",
    minScore,
    patterns,
    brandColor,
    providerKind,
    costRelevant: true,
    implies
  };
}

export const TECHNOLOGY_FINGERPRINTS: TechnologyFingerprint[] = [
  {
    id: "react",
    label: "React 18",
    group: "framework",
    minScore: 5,
    brandColor: BRAND.react,
    costRelevant: false,
    patterns: [
      { source: "global", keyIncludes: ["global:react"], minWeight: 5 },
      { source: "resource", keyIncludes: ["react-dom", "react.production", "react.development"], minWeight: 3 }
    ]
  },
  {
    id: "nextjs",
    label: "Next.js 14",
    group: "framework",
    minScore: 4,
    brandColor: BRAND.nextjs,
    costRelevant: false,
    implies: ["react"],
    patterns: [
      { source: "global", keyIncludes: ["global:nextjs"], minWeight: 5 },
      { source: "path", keyIncludes: ["/_next/"], minWeight: 4 }
    ]
  },
  {
    id: "vue",
    label: "Vue",
    group: "framework",
    minScore: 5,
    brandColor: BRAND.vue,
    costRelevant: false,
    patterns: [{ source: "global", keyIncludes: ["global:vue"], minWeight: 5 }]
  },
  {
    id: "svelte",
    label: "Svelte",
    group: "framework",
    minScore: 4,
    brandColor: BRAND.svelte,
    costRelevant: false,
    patterns: [{ source: "resource", keyIncludes: ["svelte"], minWeight: 4 }]
  },
  hostingFingerprint(
    "vercel",
    "Vercel",
    4,
    [
      { source: "host", keyIncludes: ["vercel.live", "vercel-insights.com", "vercel-scripts.com"], minWeight: 4 },
      { source: "path", keyIncludes: ["/_vercel/"], minWeight: 4 },
      { source: "answer", keyIncludes: ["answer:hostingProvider:vercel", "answer:stackCdnProvider:vercelEdge"], minWeight: 2 }
    ],
    BRAND.vercel,
    "app-platform"
  ),
  hostingFingerprint(
    "cloudflare",
    "Cloudflare CDN",
    4,
    [
      { source: "host", keyIncludes: ["workers.dev", "pages.dev", "cloudflareinsights.com", "cdnjs.cloudflare.com"], minWeight: 3 },
      { source: "path", keyIncludes: ["/cdn-cgi/"], minWeight: 4 },
      { source: "answer", keyIncludes: ["answer:hostingProvider:cloudflare", "answer:stackCdnProvider:cloudflare"], minWeight: 2 }
    ],
    BRAND.cloudflare
  ),
  hostingFingerprint(
    "cloudfront",
    "CloudFront",
    4,
    [
      { source: "host", keyIncludes: ["cloudfront.net"], minWeight: 4 },
      { source: "resource", keyIncludes: ["x-amz-cf"], minWeight: 3 }
    ],
    BRAND.cloudfront,
    "cloudfront",
    ["aws"]
  ),
  hostingFingerprint(
    "aws-s3",
    "AWS S3",
    4,
    [{ source: "host", keyIncludes: [".s3.amazonaws.com", ".s3.", "s3.amazonaws.com"], minWeight: 4 }],
    BRAND.aws,
    "s3",
    ["aws"]
  ),
  hostingFingerprint(
    "aws-api-gateway",
    "AWS API Gateway",
    4,
    [{ source: "host", keyIncludes: ["execute-api."], minWeight: 4 }],
    BRAND.aws,
    "api-gateway",
    ["aws"]
  ),
  hostingFingerprint(
    "aws",
    "AWS",
    4,
    [
      { source: "host", keyIncludes: ["amazonaws.com", "awsstatic.com", "amazoncognito.com", "amplifyapp.com", "appsync-api.", ".on.aws", "awswaf.com", "amazontrust.com"], minWeight: 4 },
      { source: "answer", keyIncludes: ["answer:hostingProvider:aws"], minWeight: 2 }
    ],
    BRAND.aws,
    "aws-generic"
  ),
  hostingFingerprint(
    "digitalocean",
    "DigitalOcean",
    4,
    [
      { source: "host", keyIncludes: ["ondigitalocean.app", "digitaloceanspaces.com", "digitaloceanspaces"], minWeight: 4 }
    ],
    BRAND.digitalocean,
    "app-platform"
  ),
  hostingFingerprint(
    "linode",
    "Linode",
    4,
    [{ source: "host", keyIncludes: ["linodeobjects.com", "linodeusercontent.com"], minWeight: 4 }],
    BRAND.linode,
    "vps"
  ),
  hostingFingerprint(
    "vultr",
    "Vultr",
    4,
    [{ source: "host", keyIncludes: ["vultrusercontent.com", "vultrobjects.com"], minWeight: 4 }],
    BRAND.vultr,
    "vps"
  ),
  hostingFingerprint(
    "gcp",
    "Google Cloud",
    4,
    [{ source: "host", keyIncludes: ["run.app", "appspot.com", "googleapis.com"], minWeight: 4 }],
    BRAND.gcp,
    "container"
  ),
  hostingFingerprint(
    "azure",
    "Azure",
    4,
    [{ source: "host", keyIncludes: ["azurewebsites.net", "windows.net", "azureedge.net"], minWeight: 4 }],
    BRAND.azure,
    "app-platform"
  ),
  hostingFingerprint(
    "heroku",
    "Heroku",
    4,
    [{ source: "host", keyIncludes: ["herokuapp.com", "herokudns.com"], minWeight: 4 }],
    BRAND.heroku,
    "app-platform"
  ),
  {
    id: "openai",
    label: "OpenAI GPT-4",
    group: "aiProviders",
    minScore: 4,
    brandColor: BRAND.openai,
    costRelevant: true,
    patterns: [
      { source: "host", keyIncludes: ["openai.com", "oaistatic.com"], minWeight: 4 },
      { source: "answer", keyIncludes: ["answer:stackAiProvider:openai"], minWeight: 2 }
    ]
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    group: "aiProviders",
    minScore: 4,
    brandColor: BRAND.anthropic,
    costRelevant: true,
    patterns: [
      { source: "host", keyIncludes: ["anthropic.com"], minWeight: 4 },
      { source: "answer", keyIncludes: ["answer:stackAiProvider:anthropic"], minWeight: 2 }
    ]
  },
  {
    id: "google-ai",
    label: "Google AI",
    group: "aiProviders",
    minScore: 4,
    brandColor: BRAND.googleAi,
    costRelevant: true,
    patterns: [
      { source: "host", keyIncludes: ["generativelanguage.googleapis.com", "vertexai", "ai.google.dev"], minWeight: 4 },
      { source: "answer", keyIncludes: ["answer:stackAiProvider:google"], minWeight: 2 }
    ]
  },
  {
    id: "ga4",
    label: "Google Analytics 4",
    group: "analyticsAdsRum",
    minScore: 4,
    brandColor: BRAND.ga4,
    costRelevant: true,
    patterns: [
      { source: "host", keyIncludes: ["google-analytics.com"], minWeight: 4 },
      { source: "global", keyIncludes: ["global:datalayer"], minWeight: 4 },
      { source: "answer", keyIncludes: ["answer:stackAnalytics:ga4"], minWeight: 2 }
    ]
  },
  {
    id: "gtm",
    label: "Google Tag Manager",
    group: "analyticsAdsRum",
    minScore: 4,
    brandColor: BRAND.gtm,
    costRelevant: true,
    patterns: [
      { source: "host", keyIncludes: ["googletagmanager.com"], minWeight: 4 },
      { source: "answer", keyIncludes: ["answer:stackAnalytics:gtm"], minWeight: 2 }
    ]
  },
  {
    id: "cloudflare-browser-insights",
    label: "Cloudflare Browser Insights",
    group: "analyticsAdsRum",
    minScore: 4,
    brandColor: BRAND.cloudflareInsights,
    costRelevant: true,
    implies: ["cloudflare"],
    patterns: [
      { source: "host", keyIncludes: ["cloudflareinsights.com"], minWeight: 4 },
      { source: "path", keyIncludes: ["/beacon.min.js"], minWeight: 4 }
    ]
  },
  {
    id: "amazon-ads",
    label: "Amazon Advertising",
    group: "analyticsAdsRum",
    minScore: 4,
    brandColor: BRAND.amazonAds,
    costRelevant: true,
    patterns: [
      { source: "host", keyIncludes: ["amazon-adsystem.com"], minWeight: 4 },
      { source: "answer", keyIncludes: ["answer:stackAnalytics:amazonAdvertising"], minWeight: 2 }
    ]
  },
  {
    id: "cloudwatch-rum",
    label: "CloudWatch RUM",
    group: "analyticsAdsRum",
    minScore: 4,
    brandColor: BRAND.cloudwatchRum,
    costRelevant: true,
    implies: ["aws"],
    patterns: [
      { source: "host", keyIncludes: ["client.rum.us-east-1.amazonaws.com"], minWeight: 4 },
      { source: "resource", keyIncludes: ["cloudwatchrum", "cloudwatch-rum"], minWeight: 3 },
      { source: "answer", keyIncludes: ["answer:stackAnalytics:cloudwatchRum"], minWeight: 2 }
    ]
  },
  {
    id: "meta-pixel",
    label: "Meta Pixel",
    group: "analyticsAdsRum",
    minScore: 4,
    brandColor: BRAND.metaPixel,
    costRelevant: true,
    patterns: [
      { source: "host", keyIncludes: ["connect.facebook.net"], minWeight: 4 },
      { source: "global", keyIncludes: ["global:meta-pixel"], minWeight: 4 },
      { source: "answer", keyIncludes: ["answer:stackAnalytics:metaPixel"], minWeight: 2 }
    ]
  },
  {
    id: "segment",
    label: "Segment",
    group: "analyticsAdsRum",
    minScore: 4,
    brandColor: BRAND.segment,
    costRelevant: true,
    patterns: [
      { source: "host", keyIncludes: ["segment.com", "cdn.segment.com"], minWeight: 4 },
      { source: "answer", keyIncludes: ["answer:stackAnalytics:segment"], minWeight: 2 }
    ]
  },
  {
    id: "plausible",
    label: "Plausible",
    group: "analyticsAdsRum",
    minScore: 4,
    brandColor: BRAND.plausible,
    costRelevant: true,
    patterns: [
      { source: "host", keyIncludes: ["plausible.io"], minWeight: 4 },
      { source: "global", keyIncludes: ["global:plausible"], minWeight: 4 },
      { source: "answer", keyIncludes: ["answer:stackAnalytics:plausible"], minWeight: 2 }
    ]
  },
  {
    id: "mixpanel",
    label: "Mixpanel",
    group: "analyticsAdsRum",
    minScore: 4,
    brandColor: BRAND.mixpanel,
    costRelevant: true,
    patterns: [
      { source: "host", keyIncludes: ["mixpanel.com", "api-js.mixpanel.com", "cdn.mxpnl.com"], minWeight: 4 },
      { source: "global", keyIncludes: ["global:mixpanel"], minWeight: 4 },
      { source: "answer", keyIncludes: ["answer:stackAnalytics:mixpanel"], minWeight: 2 }
    ]
  },
  {
    id: "sentry",
    label: "Sentry",
    group: "monitoring",
    minScore: 4,
    brandColor: BRAND.sentry,
    costRelevant: false,
    patterns: [
      { source: "host", keyIncludes: ["sentry.io", "sentry-cdn.com"], minWeight: 4 },
      { source: "resource", keyIncludes: ["sentry"], minWeight: 3 },
      { source: "global", keyIncludes: ["global:sentry"], minWeight: 4 }
    ]
  },
  {
    id: "algolia",
    label: "Algolia",
    group: "search",
    minScore: 4,
    brandColor: BRAND.algolia,
    costRelevant: false,
    patterns: [
      { source: "host", keyIncludes: ["algolia.net", "algolia.com"], minWeight: 4 },
      { source: "resource", keyIncludes: ["algolia"], minWeight: 3 },
      { source: "path", keyIncludes: ["algolia"], minWeight: 4 },
      { source: "global", keyIncludes: ["global:algolia"], minWeight: 4 }
    ]
  },
  {
    id: "prism",
    label: "Prism",
    group: "misc",
    minScore: 3,
    brandColor: BRAND.prism,
    costRelevant: false,
    patterns: [
      { source: "resource", keyIncludes: ["prism"], minWeight: 3 },
      { source: "path", keyIncludes: ["prism"], minWeight: 4 },
      { source: "global", keyIncludes: ["global:prism"], minWeight: 4 }
    ]
  },
  {
    id: "threejs",
    label: "Three.js",
    group: "graphics",
    minScore: 3,
    brandColor: BRAND.three,
    costRelevant: false,
    patterns: [
      { source: "resource", keyIncludes: ["three.js", "three.min.js", "three.module.js"], minWeight: 3 },
      { source: "path", keyIncludes: ["three", "three.module"], minWeight: 4 },
      { source: "global", keyIncludes: ["global:three"], minWeight: 4 }
    ]
  },
  {
    id: "webpack",
    label: "Webpack",
    group: "misc",
    minScore: 4,
    brandColor: BRAND.webpack,
    costRelevant: false,
    patterns: [
      { source: "global", keyIncludes: ["global:webpack"], minWeight: 4 },
      { source: "resource", keyIncludes: ["webpack"], minWeight: 3 }
    ]
  },
  {
    id: "open-graph",
    label: "Open Graph",
    group: "misc",
    minScore: 2,
    brandColor: BRAND.openGraph,
    costRelevant: false,
    patterns: [{ source: "dom", keyIncludes: ["meta:open-graph"], minWeight: 2 }]
  },
  {
    id: "lodash",
    label: "Lodash",
    group: "libraries",
    minScore: 3,
    brandColor: BRAND.lodash,
    costRelevant: false,
    patterns: [
      { source: "resource", keyIncludes: ["lodash"], minWeight: 3 },
      { source: "path", keyIncludes: ["lodash"], minWeight: 4 },
      { source: "global", keyIncludes: ["global:lodash"], minWeight: 4 }
    ]
  },
  {
    id: "core-js",
    label: "core-js",
    group: "libraries",
    minScore: 3,
    brandColor: BRAND.coreJs,
    costRelevant: false,
    patterns: [
      { source: "resource", keyIncludes: ["core-js"], minWeight: 3 },
      { source: "path", keyIncludes: ["core-js"], minWeight: 4 }
    ]
  },
  {
    id: "react-flow",
    label: "React Flow",
    group: "libraries",
    minScore: 3,
    brandColor: BRAND.reactFlow,
    costRelevant: false,
    patterns: [
      { source: "resource", keyIncludes: ["reactflow", "react-flow"], minWeight: 3 },
      { source: "path", keyIncludes: ["reactflow", "react-flow"], minWeight: 4 },
      { source: "global", keyIncludes: ["global:reactflow"], minWeight: 4 }
    ]
  },
  {
    id: "stripe",
    label: "Stripe v3",
    group: "payment",
    minScore: 4,
    brandColor: BRAND.stripe,
    costRelevant: false,
    patterns: [
      { source: "host", keyIncludes: ["js.stripe.com"], minWeight: 4 },
      { source: "global", keyIncludes: ["global:stripe"], minWeight: 4 },
      { source: "answer", keyIncludes: ["answer:stackPayment:stripe"], minWeight: 2 }
    ]
  },
  {
    id: "bitpay",
    label: "BitPay",
    group: "payment",
    minScore: 4,
    brandColor: BRAND.bitpay,
    costRelevant: false,
    patterns: [
      { source: "host", keyIncludes: ["bitpay.com", "bitpay"], minWeight: 4 },
      { source: "resource", keyIncludes: ["bitpay"], minWeight: 3 }
    ]
  },
  {
    id: "shopify",
    label: "Shopify",
    group: "payment",
    minScore: 4,
    brandColor: BRAND.shopify,
    costRelevant: false,
    patterns: [
      { source: "host", keyIncludes: ["shopify", "shopifycdn.com"], minWeight: 4 },
      { source: "answer", keyIncludes: ["answer:stackPayment:shopify"], minWeight: 2 }
    ]
  },
  {
    id: "paddle",
    label: "Paddle",
    group: "payment",
    minScore: 4,
    brandColor: BRAND.paddle,
    costRelevant: false,
    patterns: [
      { source: "host", keyIncludes: ["paddle.com", "cdn.paddle.com"], minWeight: 4 },
      { source: "answer", keyIncludes: ["answer:stackPayment:paddle"], minWeight: 2 }
    ]
  }
];

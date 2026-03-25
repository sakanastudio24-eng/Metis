// stack/index.ts detects only cost-relevant technology signals from the current page.
// It combines DOM markers, resource timing hints, element URLs, and user answers into
// one grouped money-stack model that can drive score, report copy, and fallback questions.
import type {
  DetectedStackGroup,
  DetectedStackVendor,
  MoneyStackConfidence,
  MoneyStackDetection,
  MoneyStackGroup,
  MoneyStackVendorSource,
  PlusRefinementAnswers,
  RawScanSnapshot,
  StackSignal
} from "../../shared/types/audit";

const STACK_BRAND_COLORS = {
  react: "#61dafb",
  nextjs: "#9ca3af",
  vue: "#41b883",
  svelte: "#ff6d3b",
  vercel: "#6366f1",
  cloudflare: "#f6821f",
  cloudfront: "#f59e0b",
  aws: "#f59e0b",
  openai: "#10a37f",
  anthropic: "#d97706",
  googleAi: "#60a5fa",
  ga4: "#f9a825",
  gtm: "#f59e0b",
  cloudflareBrowserInsights: "#f6821f",
  amazonAds: "#ff9900",
  cloudwatchRum: "#22c55e",
  metaPixel: "#60a5fa",
  segment: "#6ee7ff",
  plausible: "#a78bfa",
  mixpanel: "#8b5cf6",
  stripe: "#6772e5",
  shopify: "#7ab55c",
  paddle: "#6d5efc"
} as const;

type CostGroup = "hostingCdn" | "aiProviders" | "analyticsAdsRum";
type SignalBucket = {
  names: string[];
  hostnames: string[];
  pathnames: string[];
  sources: StackSignal["source"][];
};

type VendorSpec = {
  id: string;
  label: string;
  group: MoneyStackGroup;
  brandColor?: string;
  sources: Array<{
    kind: "name" | "host" | "path";
    patterns: string[];
  }>;
  domMarkers?: string[];
  answerMatches?: Array<keyof PlusRefinementAnswers>;
  answerValues?: string[];
};

function normalizeSignal(signal: StackSignal): StackSignal {
  return {
    ...signal,
    source: signal.source ?? "resource"
  };
}

function addSignal(
  signals: StackSignal[],
  name: string,
  source: StackSignal["source"],
  baseHref: string,
  fallbackHost = "local.signal",
  fallbackPath = "/"
) {
  try {
    const url = new URL(name, baseHref);
    signals.push({
      name,
      hostname: url.hostname,
      pathname: url.pathname,
      source
    });
  } catch {
    signals.push({
      name,
      hostname: fallbackHost,
      pathname: fallbackPath,
      source
    });
  }
}

export function collectDomStackSignals(pageHref: string): StackSignal[] {
  const signals: StackSignal[] = [];
  const w = window as unknown as Record<string, unknown>;

  // Start with globals because they are the strongest, cheapest hints and help
  // avoid turning every detection into a URL-pattern guess.
  if ("__NEXT_DATA__" in w) {
    addSignal(signals, "global:nextjs", "dom", pageHref);
  }
  if ("React" in w || "__REACT_DEVTOOLS_GLOBAL_HOOK__" in w) {
    addSignal(signals, "global:react", "dom", pageHref);
  }
  if ("Vue" in w || "__VUE__" in w) {
    addSignal(signals, "global:vue", "dom", pageHref);
  }
  if ("dataLayer" in w) {
    addSignal(signals, "global:datalayer", "dom", pageHref);
  }
  if ("plausible" in w) {
    addSignal(signals, "global:plausible", "dom", pageHref);
  }
  if ("mixpanel" in w) {
    addSignal(signals, "global:mixpanel", "dom", pageHref);
  }
  if ("fbq" in w) {
    addSignal(signals, "global:meta-pixel", "dom", pageHref);
  }
  if ("Stripe" in w) {
    addSignal(signals, "global:stripe", "dom", pageHref);
  }

  document
    .querySelectorAll<HTMLScriptElement | HTMLLinkElement | HTMLIFrameElement>(
      "script[src], link[href], iframe[src]"
    )
    .forEach((element) => {
      const url =
        "src" in element && typeof element.src === "string" && element.src.length > 0
          ? element.src
          : "href" in element && typeof element.href === "string"
            ? element.href
            : "";

      if (!url) {
        return;
      }

      addSignal(signals, url, "element", pageHref);
    });

  // Keep the page URL itself as a weak supporting signal because platform-owned
  // routes sometimes reveal hosted products that the resource list misses.
  addSignal(signals, pageHref, "dom", pageHref);
  return signals;
}

function buildSignalBucket(snapshot: RawScanSnapshot): SignalBucket {
  // The stack bucket is intentionally broader than the scored resource list.
  // It answers "which vendors are here?" rather than "which requests counted?"
  const signals = [
    ...(snapshot.stackSignals ?? []),
    ...snapshot.resources.map((resource) => ({
      name: resource.name,
      hostname: resource.hostname,
      pathname: resource.pathname,
      source: "resource" as const
    }))
  ].map(normalizeSignal);

  return {
    names: signals.map((signal) => signal.name.toLowerCase()),
    hostnames: signals.map((signal) => signal.hostname.toLowerCase()),
    pathnames: signals.map((signal) => signal.pathname.toLowerCase()),
    sources: signals.map((signal) => signal.source)
  };
}

function hasPattern(values: string[], patterns: string[]) {
  return patterns.some((pattern) => values.some((value) => value.includes(pattern)));
}

function resolveSource(sources: Set<MoneyStackVendorSource>): MoneyStackVendorSource {
  if (sources.size === 0) {
    return "resource";
  }
  if (sources.size === 1) {
    return Array.from(sources)[0] ?? "resource";
  }
  return "mixed";
}

function resolveConfidence(source: MoneyStackVendorSource, hitCount: number): MoneyStackConfidence {
  if (source === "mixed" || source === "dom") {
    return "high";
  }
  if (source === "answer") {
    return "medium";
  }
  return hitCount >= 1 ? "medium" : "low";
}

const VENDOR_SPECS: VendorSpec[] = [
  {
    id: "react",
    label: "React 18",
    group: "framework",
    brandColor: STACK_BRAND_COLORS.react,
    sources: [
      { kind: "name", patterns: ["global:react", "react-dom", "react.production", "react.development"] }
    ],
    domMarkers: ["global:react"],
    answerMatches: ["stackFramework"],
    answerValues: ["react"]
  },
  {
    id: "nextjs",
    label: "Next.js 14",
    group: "framework",
    brandColor: STACK_BRAND_COLORS.nextjs,
    sources: [
      { kind: "name", patterns: ["global:nextjs", "/_next/", "__next"] },
      { kind: "path", patterns: ["/_next/"] }
    ],
    domMarkers: ["global:nextjs"],
    answerMatches: ["stackFramework"],
    answerValues: ["nextjs"]
  },
  {
    id: "vue",
    label: "Vue",
    group: "framework",
    brandColor: STACK_BRAND_COLORS.vue,
    sources: [{ kind: "name", patterns: ["global:vue", "vue.runtime", "vue.global"] }],
    domMarkers: ["global:vue"],
    answerMatches: ["stackFramework"],
    answerValues: ["vue"]
  },
  {
    id: "svelte",
    label: "Svelte",
    group: "framework",
    brandColor: STACK_BRAND_COLORS.svelte,
    sources: [{ kind: "name", patterns: ["svelte"] }],
    answerMatches: ["stackFramework"],
    answerValues: ["svelte"]
  },
  {
    id: "vercel",
    label: "Vercel",
    group: "hostingCdn",
    brandColor: STACK_BRAND_COLORS.vercel,
    sources: [
      { kind: "host", patterns: ["vercel.live", "vercel-insights.com", "vercel-scripts.com"] },
      { kind: "path", patterns: ["/_vercel/"] }
    ],
    answerMatches: ["hostingProvider", "stackCdnProvider"],
    answerValues: ["vercel", "vercelEdge"]
  },
  {
    id: "cloudflare",
    label: "Cloudflare CDN",
    group: "hostingCdn",
    brandColor: STACK_BRAND_COLORS.cloudflare,
    sources: [
      {
        kind: "host",
        patterns: ["challenges.cloudflare.com", "workers.dev", "pages.dev", "cdnjs.cloudflare.com"]
      },
      { kind: "path", patterns: ["/cdn-cgi/"] }
    ],
    answerMatches: ["hostingProvider", "stackCdnProvider"],
    answerValues: ["cloudflare"]
  },
  {
    id: "cloudfront",
    label: "CloudFront",
    group: "hostingCdn",
    brandColor: STACK_BRAND_COLORS.cloudfront,
    sources: [
      { kind: "host", patterns: ["cloudfront.net"] },
      { kind: "name", patterns: ["x-amz-cf"] }
    ],
    answerMatches: ["stackCdnProvider"],
    answerValues: ["cloudfront"]
  },
  {
    id: "aws",
    label: "AWS",
    group: "hostingCdn",
    brandColor: STACK_BRAND_COLORS.aws,
    sources: [
      {
        kind: "host",
        patterns: [
          "amazonaws.com",
          "awsstatic.com",
          "amazoncognito.com",
          "amplifyapp.com",
          "appsync-api.",
          "execute-api.",
          ".on.aws",
          "awswaf.com",
          "amazontrust.com"
        ]
      },
      { kind: "name", patterns: ["x-amz-", "x-amz-cf", "amz-credential"] }
    ],
    answerMatches: ["hostingProvider"],
    answerValues: ["aws"]
  },
  {
    id: "openai",
    label: "OpenAI GPT-4",
    group: "aiProviders",
    brandColor: STACK_BRAND_COLORS.openai,
    sources: [
      { kind: "host", patterns: ["openai.com", "oaistatic.com"] }
    ],
    answerMatches: ["stackAiProvider"],
    answerValues: ["openai"]
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    group: "aiProviders",
    brandColor: STACK_BRAND_COLORS.anthropic,
    sources: [{ kind: "host", patterns: ["anthropic.com"] }],
    answerMatches: ["stackAiProvider"],
    answerValues: ["anthropic"]
  },
  {
    id: "google-ai",
    label: "Google AI",
    group: "aiProviders",
    brandColor: STACK_BRAND_COLORS.googleAi,
    sources: [{ kind: "host", patterns: ["generativelanguage.googleapis.com", "vertexai", "ai.google.dev"] }],
    answerMatches: ["stackAiProvider"],
    answerValues: ["google"]
  },
  {
    id: "ga4",
    label: "Google Analytics 4",
    group: "analyticsAdsRum",
    brandColor: STACK_BRAND_COLORS.ga4,
    sources: [
      { kind: "host", patterns: ["google-analytics.com"] },
      { kind: "name", patterns: ["global:datalayer"] }
    ],
    domMarkers: ["global:datalayer"],
    answerMatches: ["stackAnalytics"],
    answerValues: ["ga4"]
  },
  {
    id: "gtm",
    label: "Google Tag Manager",
    group: "analyticsAdsRum",
    brandColor: STACK_BRAND_COLORS.gtm,
    sources: [{ kind: "host", patterns: ["googletagmanager.com"] }],
    answerMatches: ["stackAnalytics"],
    answerValues: ["gtm"]
  },
  {
    id: "cloudflare-browser-insights",
    label: "Cloudflare Browser Insights",
    group: "analyticsAdsRum",
    brandColor: STACK_BRAND_COLORS.cloudflareBrowserInsights,
    sources: [
      { kind: "host", patterns: ["cloudflareinsights.com"] },
      { kind: "path", patterns: ["/beacon.min.js"] }
    ]
  },
  {
    id: "amazon-ads",
    label: "Amazon Advertising",
    group: "analyticsAdsRum",
    brandColor: STACK_BRAND_COLORS.amazonAds,
    sources: [{ kind: "host", patterns: ["amazon-adsystem.com"] }],
    answerMatches: ["stackAnalytics"],
    answerValues: ["amazonAdvertising"]
  },
  {
    id: "cloudwatch-rum",
    label: "CloudWatch RUM",
    group: "analyticsAdsRum",
    brandColor: STACK_BRAND_COLORS.cloudwatchRum,
    sources: [
      { kind: "host", patterns: ["client.rum.us-east-1.amazonaws.com", "cwr", "rum"] },
      { kind: "name", patterns: ["cloudwatchrum", "cloudwatch-rum"] }
    ],
    answerMatches: ["stackAnalytics"],
    answerValues: ["cloudwatchRum"]
  },
  {
    id: "meta-pixel",
    label: "Meta Pixel",
    group: "analyticsAdsRum",
    brandColor: STACK_BRAND_COLORS.metaPixel,
    sources: [
      { kind: "host", patterns: ["connect.facebook.net"] },
      { kind: "name", patterns: ["global:meta-pixel", "fbevents.js"] }
    ],
    domMarkers: ["global:meta-pixel"],
    answerMatches: ["stackAnalytics"],
    answerValues: ["metaPixel"]
  },
  {
    id: "segment",
    label: "Segment",
    group: "analyticsAdsRum",
    brandColor: STACK_BRAND_COLORS.segment,
    sources: [{ kind: "host", patterns: ["segment.com", "cdn.segment.com"] }],
    answerMatches: ["stackAnalytics"],
    answerValues: ["segment"]
  },
  {
    id: "plausible",
    label: "Plausible",
    group: "analyticsAdsRum",
    brandColor: STACK_BRAND_COLORS.plausible,
    sources: [
      { kind: "host", patterns: ["plausible.io"] },
      { kind: "name", patterns: ["global:plausible"] }
    ],
    domMarkers: ["global:plausible"],
    answerMatches: ["stackAnalytics"],
    answerValues: ["plausible"]
  },
  {
    id: "mixpanel",
    label: "Mixpanel",
    group: "analyticsAdsRum",
    brandColor: STACK_BRAND_COLORS.mixpanel,
    sources: [
      { kind: "host", patterns: ["mixpanel.com", "api-js.mixpanel.com", "cdn.mxpnl.com"] },
      { kind: "name", patterns: ["global:mixpanel"] }
    ],
    domMarkers: ["global:mixpanel"],
    answerMatches: ["stackAnalytics"],
    answerValues: ["mixpanel"]
  },
  {
    id: "stripe",
    label: "Stripe v3",
    group: "payment",
    brandColor: STACK_BRAND_COLORS.stripe,
    sources: [
      { kind: "host", patterns: ["js.stripe.com"] },
      { kind: "name", patterns: ["global:stripe"] }
    ],
    domMarkers: ["global:stripe"],
    answerMatches: ["stackPayment"],
    answerValues: ["stripe"]
  },
  {
    id: "shopify",
    label: "Shopify",
    group: "payment",
    brandColor: STACK_BRAND_COLORS.shopify,
    sources: [{ kind: "host", patterns: ["shopify", "shopifycdn.com"] }],
    answerMatches: ["stackPayment"],
    answerValues: ["shopify"]
  },
  {
    id: "paddle",
    label: "Paddle",
    group: "payment",
    brandColor: STACK_BRAND_COLORS.paddle,
    sources: [{ kind: "host", patterns: ["paddle.com", "cdn.paddle.com"] }],
    answerMatches: ["stackPayment"],
    answerValues: ["paddle"]
  }
];

function maybeAddVendor(
  vendors: Map<string, { spec: VendorSpec; sources: Set<MoneyStackVendorSource>; hits: number }>,
  spec: VendorSpec,
  source: MoneyStackVendorSource
) {
  const existing = vendors.get(spec.id);
  if (existing) {
    existing.sources.add(source);
    existing.hits += 1;
    return;
  }

  vendors.set(spec.id, {
    spec,
    sources: new Set([source]),
    hits: 1
  });
}

function inferVendor(
  vendors: Map<string, { spec: VendorSpec; sources: Set<MoneyStackVendorSource>; hits: number }>,
  vendorId: string,
  source: MoneyStackVendorSource
) {
  const spec = VENDOR_SPECS.find((entry) => entry.id === vendorId);

  if (!spec) {
    return;
  }

  maybeAddVendor(vendors, spec, source);
}

export function detectMoneyStack(
  snapshot: RawScanSnapshot,
  answers: PlusRefinementAnswers = {}
): MoneyStackDetection {
  const bucket = buildSignalBucket(snapshot);
  const vendors = new Map<string, { spec: VendorSpec; sources: Set<MoneyStackVendorSource>; hits: number }>();

  // Match direct vendor signatures first. Answer hints and light inference only
  // exist to fill obvious gaps, not to replace real page evidence.
  for (const spec of VENDOR_SPECS) {
    let matched = false;

    for (const sourceGroup of spec.sources) {
      const haystack =
        sourceGroup.kind === "host"
          ? bucket.hostnames
          : sourceGroup.kind === "path"
            ? bucket.pathnames
            : bucket.names;

      if (hasPattern(haystack, sourceGroup.patterns)) {
        maybeAddVendor(vendors, spec, sourceGroup.kind === "name" && sourceGroup.patterns.some((pattern) => pattern.startsWith("global:")) ? "dom" : "resource");
        matched = true;
      }
    }

    if (spec.answerMatches && spec.answerValues) {
      const answerMatched = spec.answerMatches.some((key) => {
        const answerValue = answers[key];
        return typeof answerValue === "string" && spec.answerValues?.includes(answerValue);
      });

      if (answerMatched) {
        maybeAddVendor(vendors, spec, "answer");
        matched = true;
      }
    }

    if (!matched && spec.domMarkers && hasPattern(bucket.names, spec.domMarkers)) {
      maybeAddVendor(vendors, spec, "dom");
    }
  }

  // Some vendors imply a broader paid platform behind them even when the page
  // only exposes the edge product directly.
  if (vendors.has("cloudfront") || vendors.has("cloudwatch-rum")) {
    inferVendor(vendors, "aws", "mixed");
  }

  if (vendors.has("cloudflare-browser-insights")) {
    inferVendor(vendors, "cloudflare", "mixed");
  }

  // Empty groups are dropped so the report stays cost-focused and the fallback
  // question layer can ask only for what is still unknown.
  const groups: DetectedStackGroup[] = [
    { id: "framework", label: "Framework", vendors: [] },
    { id: "hostingCdn", label: "Hosting / CDN", vendors: [] },
    { id: "aiProviders", label: "AI Providers", vendors: [] },
    { id: "analyticsAdsRum", label: "Analytics / Ads / RUM", vendors: [] },
    { id: "payment", label: "Payment", vendors: [] }
  ];

  for (const { spec, sources, hits } of vendors.values()) {
    const source = resolveSource(sources);
    const confidence = resolveConfidence(source, hits);
    const vendor: DetectedStackVendor = {
      id: spec.id,
      label: spec.label,
      group: spec.group,
      brandColor: spec.brandColor,
      source,
      confidence
    };
    groups.find((group) => group.id === spec.group)?.vendors.push(vendor);
  }

  const filteredGroups = groups
    .map((group) => ({
      ...group,
      vendors: group.vendors.sort((left, right) => left.label.localeCompare(right.label))
    }))
    .filter((group) => group.vendors.length > 0);

  const missingCostGroups = (["hostingCdn", "aiProviders", "analyticsAdsRum"] as const).filter(
    (group) => !filteredGroups.some((entry) => entry.id === group)
  );

  const directCostGroups = filteredGroups
    .filter((group) => group.id === "hostingCdn" || group.id === "aiProviders" || group.id === "analyticsAdsRum")
    .map((group) => group.id as CostGroup);

  return {
    groups: filteredGroups,
    missingCostGroups,
    directCostGroups
  };
}

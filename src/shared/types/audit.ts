// audit.ts defines the shared contracts that move data through scan, detection,
// scoring, and the later insight stage. Keep these types stable because multiple
// extension surfaces and docs depend on them.
export type Severity = "low" | "medium" | "high";
export type ScoreLabel = "warming up" | "healthy" | "watch" | "high risk";
export type IssueCategory =
  | "requestCount"
  | "duplicateRequests"
  | "pageWeight"
  | "largeImages"
  | "thirdPartySprawl"
  | "aiSpendSurface"
  | "analyticsAdsRumSurface"
  | "hostingCdnSpendSurface";
export type HostingProvider =
  | "vercel"
  | "netlify"
  | "cloudflare"
  | "aws"
  | "render"
  | "railway"
  | "other";
export type HostingPlan = "free" | "pro" | "team" | "enterprise" | "notSure";
export type MonthlyVisitsBand = "under1k" | "1kTo10k" | "10kTo100k" | "100kPlus" | "notSure";
export type SiteSizeBand = "under10" | "10To50" | "50To200" | "200Plus" | "notSure";
export type AppType =
  | "marketing"
  | "portfolio"
  | "ecommerce"
  | "saasDashboard"
  | "mediaHeavy"
  | "aiApp"
  | "marketplace"
  | "internalTool";
export type PageDynamics = "mostlyStatic" | "mixed" | "highlyDynamic" | "notSure";
export type PaidApiUsage = "yes" | "no" | "notSure";
export type AiUsage = "yesOften" | "sometimes" | "no" | "notSure";
export type MediaImportance = "core" | "somewhat" | "no";
export type HighTrafficRoute = "yes" | "somewhat" | "no" | "notSure";
export type OptimizationCoverage = "yes" | "no" | "notSure";
export type StackFramework = "react" | "nextjs" | "vue" | "svelte" | "other";
export type StackCdnProvider =
  | "cloudflare"
  | "cloudfront"
  | "fastly"
  | "vercelEdge"
  | "none"
  | "other";
export type StackAiProvider = "openai" | "anthropic" | "google" | "none" | "other";
export type StackAnalytics =
  | "ga4"
  | "gtm"
  | "amazonAdvertising"
  | "cloudwatchRum"
  | "metaPixel"
  | "plausible"
  | "segment"
  | "mixpanel"
  | "none"
  | "other";
export type StackPayment = "stripe" | "shopify" | "paddle" | "none" | "other";
export type ResourceCategory =
  | "image"
  | "script"
  | "api"
  | "stylesheet"
  | "font"
  | "document"
  | "other";

export interface PageContext {
  href: string;
  origin: string;
  hostname: string;
  pathname: string;
}

export interface ResourceSummary {
  name: string;
  normalizedUrl: string;
  hostname: string;
  pathname: string;
  initiatorType: string;
  category: ResourceCategory;
  transferSize: number;
  encodedBodySize: number;
  duration: number;
  isThirdParty: boolean;
  isMeaningfulImage: boolean;
}

export type StackSignalSource = "resource" | "element" | "dom";

export interface StackSignal {
  name: string;
  hostname: string;
  pathname: string;
  source?: StackSignalSource;
}

export type MoneyStackGroup =
  | "hostingCdn"
  | "aiProviders"
  | "analyticsAdsRum"
  | "framework"
  | "payment";

export type MoneyStackVendorSource = StackSignalSource | "answer" | "mixed";
export type MoneyStackConfidence = "low" | "medium" | "high";

export interface DetectedStackVendor {
  id: string;
  label: string;
  group: MoneyStackGroup;
  brandColor?: string;
  source: MoneyStackVendorSource;
  confidence: MoneyStackConfidence;
}

export interface DetectedStackGroup {
  id: MoneyStackGroup;
  label: string;
  vendors: DetectedStackVendor[];
}

export interface MoneyStackDetection {
  groups: DetectedStackGroup[];
  missingCostGroups: Array<"hostingCdn" | "aiProviders" | "analyticsAdsRum">;
  directCostGroups: Array<"hostingCdn" | "aiProviders" | "analyticsAdsRum">;
}

export interface ResourceAggregate {
  normalizedUrl: string;
  sampleUrl: string;
  hostname: string;
  category: ResourceCategory;
  requestCount: number;
  totalEncodedBodySize: number;
  largestEncodedBodySize: number;
  isThirdParty: boolean;
}

export interface ResourceMetricsSummary {
  rawRequestCount: number;
  requestCount: number;
  uniqueRequestCount: number;
  duplicateRequestCount: number;
  duplicateEndpointCount: number;
  scriptRequestCount: number;
  imageRequestCount: number;
  apiRequestCount: number;
  thirdPartyRequestCount: number;
  thirdPartyDomainCount: number;
  totalEncodedBodySize: number;
  meaningfulImageCount: number;
  meaningfulImageBytes: number;
  largeAssetCount: number;
  droppedZeroTransferCount: number;
  droppedTinyCount: number;
  topOffenders: ResourceAggregate[];
  topMeaningfulImages: ResourceAggregate[];
}

export interface DomSummary {
  scriptCount: number;
  imageCount: number;
  iframeCount: number;
}

export interface RawScanSnapshot {
  scannedAt: string;
  page: PageContext;
  resources: ResourceSummary[];
  stackSignals?: StackSignal[];
  dom: DomSummary;
  metrics: ResourceMetricsSummary;
}

export interface PageScanSnapshot {
  url: string;
  pageKey: string;
  timestamp: number;
  requestCount: number;
  duplicateRequestCount: number;
  duplicateEndpointCount: number;
  thirdPartyDomainCount: number;
  totalEncodedBodySize: number;
  meaningfulImageCount: number;
  meaningfulImageBytes: number;
}

export interface PageScanComparison {
  requestCountDelta: number;
  duplicateRequestCountDelta: number;
  duplicateEndpointCountDelta: number;
  thirdPartyDomainCountDelta: number;
  totalEncodedBodySizeDelta: number;
  meaningfulImageCountDelta: number;
  meaningfulImageBytesDelta: number;
  summary: string[];
}

export interface DetectedIssue {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
  category: IssueCategory;
  metric?: Record<string, number>;
  threshold?: Record<string, number>;
}

export interface ScoreDeduction {
  reason: string;
  points: number;
  category: IssueCategory;
  severity: Severity;
  multiplier: number;
}

export interface ScoreBreakdown {
  score: number;
  label: ScoreLabel;
  deductions: ScoreDeduction[];
}

export interface CostInsight {
  summary: string;
  supportingDetail: string;
  estimateLabel: string;
  nextStep: string;
  primaryCategory: IssueCategory | null;
}

export interface PlusRefinementAnswers {
  hostingProvider?: HostingProvider;
  hostingPlan?: HostingPlan;
  monthlyVisits?: MonthlyVisitsBand;
  siteSize?: SiteSizeBand;
  appType?: AppType;
  pageDynamics?: PageDynamics;
  paidApiUsage?: PaidApiUsage;
  aiUsage?: AiUsage;
  mediaImportance?: MediaImportance;
  highTrafficRoute?: HighTrafficRoute;
  optimizationCoverage?: OptimizationCoverage;
  stackFramework?: StackFramework;
  stackCdnProvider?: StackCdnProvider;
  stackAiProvider?: StackAiProvider;
  stackAnalytics?: StackAnalytics;
  stackPayment?: StackPayment;
}

export interface PlusOptimizationReport {
  summary: string;
  detail: string;
  nextStep: string;
  priorityLabel: string;
  answeredCount: number;
  missingCoreQuestions: Array<keyof PlusRefinementAnswers>;
}

export interface MetisSnapshot {
  raw: RawScanSnapshot;
  issues: DetectedIssue[];
  score: ScoreBreakdown;
  insight: CostInsight | null;
}

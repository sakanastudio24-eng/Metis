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
  | "thirdPartySprawl";
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
  dom: DomSummary;
  metrics: ResourceMetricsSummary;
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
  appType?: AppType;
  pageDynamics?: PageDynamics;
  paidApiUsage?: PaidApiUsage;
  aiUsage?: AiUsage;
  mediaImportance?: MediaImportance;
  highTrafficRoute?: HighTrafficRoute;
  optimizationCoverage?: OptimizationCoverage;
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

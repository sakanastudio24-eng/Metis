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
  | "docsContent"
  | "ecommerce"
  | "saasDashboard"
  | "mediaHeavy"
  | "aiApp"
  | "marketplace"
  | "internalTool"
  | "notSure";
export type PageDynamics = "mostlyStatic" | "mixed" | "highlyDynamic" | "notSure";
export type RepresentativeExperience = "mainPublicPage" | "specificRoute" | "notSure";
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
export type TechnologyEvidenceSource =
  | StackSignalSource
  | "global"
  | "meta"
  | "answer"
  | "mixed"
  | "host"
  | "path";

export interface StackSignal {
  name: string;
  hostname: string;
  pathname: string;
  source?: StackSignalSource;
}

export interface TechnologyEvidence {
  key: string;
  source: TechnologyEvidenceSource;
  value?: string | boolean;
  weight: number;
  original: string;
}

export interface FingerprintPattern {
  source: TechnologyEvidenceSource;
  keyIncludes?: string[];
  valueIncludes?: string[];
  minWeight?: number;
}

export interface TechnologyFingerprint {
  id: string;
  group: MoneyStackGroup;
  label: string;
  minScore: number;
  brandColor?: string;
  providerKind?: HostingProviderKind;
  costRelevant?: boolean;
  implies?: string[];
  patterns: FingerprintPattern[];
}

export type MoneyStackGroup =
  | "hostingCdn"
  | "aiProviders"
  | "analyticsAdsRum"
  | "framework"
  | "payment"
  | "monitoring"
  | "search"
  | "libraries"
  | "graphics"
  | "misc";

export type MoneyStackVendorSource = TechnologyEvidenceSource;
export type MoneyStackConfidence = "low" | "medium" | "high";
export type HostingProviderKind =
  | "cloudfront"
  | "s3"
  | "api-gateway"
  | "aws-generic"
  | "shared-hosting"
  | "vps"
  | "app-platform"
  | "container"
  | "cluster";

export interface DetectedStackVendor {
  id: string;
  label: string;
  group: MoneyStackGroup;
  brandColor?: string;
  source: MoneyStackVendorSource;
  confidence: MoneyStackConfidence;
  providerKind?: HostingProviderKind;
  score?: number;
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

export interface ResolvedTechnology {
  vendor: DetectedStackVendor;
  evidence: TechnologyEvidence[];
}

export type PricingProviderId =
  | "hostinger"
  | "bluehost"
  | "ionos"
  | "dreamhost"
  | "siteground"
  | "hostgator"
  | "godaddy"
  | "a2"
  | "inmotion"
  | "digitalocean"
  | "linode"
  | "vultr"
  | "aws"
  | "gcp"
  | "azure"
  | "heroku"
  | "vercel"
  | "netlify"
  | "cloudflare"
  | "supabase"
  | "openai"
  | "anthropic"
  | "shopify";

export type PricingProviderAlias =
  | PricingProviderId
  | HostingProvider
  | "cloudfront"
  | "aws-s3"
  | "aws-api-gateway"
  | "cloudflare-cdn"
  | "vercel-edge";

export type PricingPlanTier =
  | "entry"
  | "shared"
  | "sharedPlus"
  | "cloud"
  | "managed"
  | "vpsSmall"
  | "vpsMedium"
  | "vpsLarge"
  | "appPlatform"
  | "container"
  | "cluster"
  | "usage"
  | "subscription";

export type PricingMetricType =
  | "bandwidth"
  | "compute"
  | "requests"
  | "storage"
  | "buildMinutes"
  | "workers"
  | "database"
  | "authUsers"
  | "inputTokens"
  | "outputTokens"
  | "subscription"
  | "transactionFees";

export interface PricingEntry {
  providerId: PricingProviderId;
  displayName: string;
  rawPlanLabel: string;
  normalizedTier: PricingPlanTier;
  monthlyVisitBaseline: number;
  paidApiBaseline: PaidApiUsage;
  aiUsageBaseline: AiUsage;
  highTrafficRouteBaseline: string;
  appTypeBaseline: string;
  metrics: PricingMetricType[];
  approximateRate: string;
  sourceUrl: string;
  lastVerifiedAt: string;
}

export interface ResolvedPricingProvider {
  providerId: PricingProviderId;
  displayName: string;
  rawPlanLabel: string;
  normalizedTier: PricingPlanTier;
  approximateRate: string;
  sourceUrl: string;
  lastVerifiedAt: string;
  confidence: MoneyStackConfidence;
}

export interface PricingContext {
  primaryProvider: ResolvedPricingProvider | null;
  matchedProviders: ResolvedPricingProvider[];
  estimateSourceNote: string | null;
  heuristicFallback: boolean;
  monthlyVisitBaseline: number | null;
  providerMultiplier: number;
}

export type ControlLabel = "Controlled" | "Mixed" | "Uncontrolled";
export type ConfidenceLabel = "Low" | "Limited" | "Moderate" | "High";

export interface ControlCredit {
  id: string;
  points: number;
  reason: string;
}

export interface ControlPenalty {
  id: string;
  points: number;
  reason: string;
}

export interface ControlAssessment {
  score: number;
  label: ControlLabel;
  reasons: string[];
  credits: ControlCredit[];
  penalties: ControlPenalty[];
}

export interface ConfidenceAssessment {
  label: ConfidenceLabel;
  summary: string;
  detail: string;
  reasons: string[];
}

export type MetisRefreshMode = "smart" | "steady";
export type MetisMotionPreference = "full" | "reduced";
export type MetisScanDelayProfile = "fast" | "balanced" | "thorough";

export interface MetisLocalSettings {
  preferredScanScope: "single" | "multi";
  refreshMode: MetisRefreshMode;
  motionPreference: MetisMotionPreference;
  autoRescanWhilePanelOpen: boolean;
  basicScanEnabled: boolean;
  localHistoryEnabled: boolean;
  bridgeRepairEnabled: boolean;
  attachedWorkspaceEnabled: boolean;
  scanDelayProfile: MetisScanDelayProfile;
  attachedReport: boolean;
  showSampleProgress: boolean;
  launcherTop: number | null;
}

export interface MetisSiteAccessState {
  origin: string | null;
  isGranted: boolean;
  canRequest: boolean;
  isRestricted: boolean;
}

export type MetisAccessTier = "free" | "plus_beta" | "paid";

export interface MetisAccessState {
  isAuthenticated: boolean;
  tier: MetisAccessTier;
  allowPlusUi: boolean;
  allowReportEmail: boolean;
  plusBetaEnabled: boolean;
  apiBetaEnabled: boolean;
}

export interface MetisConnectedAccount {
  id: string;
  email: string | null;
  displayName: string;
}

export interface MetisBridgeAccountState {
  email: string | null;
  username: string | null;
  scansUsed: number;
  sitesTracked: number;
  tier: MetisAccessTier;
  isBeta: boolean;
}

export interface MetisBridgeSyncMessage {
  type: "METIS_BRIDGE_SYNC";
  source: "metis-web";
  bridgeVersion: 1;
  account: MetisBridgeAccountState;
  session?: {
    accessToken: string;
    expiresAt: number | null;
    user: {
      id: string;
      email: string | null;
    };
  };
}

export interface MetisBridgeSyncAck {
  type: "METIS_BRIDGE_SYNC_ACK";
  source: "metis-extension";
  bridgeVersion: 1;
  ok: true;
}

export type MetisBridgeSyncFailureReason =
  | "invalid_origin"
  | "invalid_extension_id"
  | "invalid_message_type"
  | "invalid_payload"
  | "unsupported_bridge_version"
  | "storage_failed"
  | "unknown";

export interface MetisBridgeSyncFailure {
  type: "METIS_BRIDGE_SYNC_FAILURE";
  source: "metis-extension";
  bridgeVersion: 1;
  ok: false;
  reason: MetisBridgeSyncFailureReason;
  detail?: string;
}

export interface MetisAuthSuccessBridgeMessage {
  type: "METIS_AUTH_SUCCESS";
  source: "metis-web";
  version: 1;
  session: {
    accessToken: string;
    expiresAt: number | null;
    user: {
      id: string;
      email: string | null;
    };
  };
}

export interface StoredMetisWebSession {
  accessToken: string;
  expiresAt: number | null;
  user: {
    id: string;
    email: string | null;
  };
  account: {
    plan: MetisAccessTier;
    plusBetaEnabled: boolean;
    apiBetaEnabled: boolean;
    allowPlusUi: boolean;
    allowReportEmail: boolean;
  };
  bridgeAccount: MetisBridgeAccountState;
  connectedAt: number;
}

export interface StoredMetisLastScan {
  route: string;
  scoredAt: number;
  requestCount: number;
  duplicateEndpointCount: number;
  issueCount: number;
}

export interface MetisAnalyticsEventPayload {
  type: string;
  occurredAt: number;
  route?: string;
}

export interface MetisScanSummaryUploadPayload {
  route: string;
  score: number | null;
  issueCount: number;
  confidence: string | null;
}

export interface MetisPremiumReportRequestPayload {
  route: string;
  requestedAt: number;
  source: "panel" | "report" | "popup";
}

export interface MetisUploadQueueItem {
  id: string;
  kind: "event" | "scan_summary" | "premium_report_request";
  payload:
    | MetisAnalyticsEventPayload
    | MetisScanSummaryUploadPayload
    | MetisPremiumReportRequestPayload;
  route: string | null;
  createdAt: number;
  attemptCount: number;
  lastAttemptAt: number | null;
}

export interface MetisUploadQueueState {
  items: MetisUploadQueueItem[];
  lastSummaryByRoute: Record<string, number>;
  lastEventByKey: Record<string, number>;
}

export interface ExportReportSection {
  id: string;
  title: string;
  lines: string[];
}

export interface ExportReportDocument {
  title: string;
  hostname: string;
  generatedAt: string;
  costRiskScore: number;
  controlScore: number;
  confidenceLabel: ConfidenceLabel;
  sections: ExportReportSection[];
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
  representativeExperience?: RepresentativeExperience;
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

export type PageScopedFairnessKey = "appType" | "representativeExperience";

export type PageScopedFairnessAnswers = Pick<
  PlusRefinementAnswers,
  PageScopedFairnessKey
>;

export interface PlusOptimizationReport {
  detailSummary: string;
  contextNotes: string[];
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

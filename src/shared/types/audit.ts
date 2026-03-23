export type Severity = "low" | "medium" | "high";
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
}

export interface ScoreDeduction {
  reason: string;
  points: number;
}

export interface ScoreBreakdown {
  score: number;
  label: string;
  deductions: ScoreDeduction[];
}

export interface CostInsight {
  summary: string;
  estimateLabel?: string;
}

export interface MetisSnapshot {
  raw: RawScanSnapshot;
  issues: DetectedIssue[];
  score: ScoreBreakdown;
  insight: CostInsight | null;
}

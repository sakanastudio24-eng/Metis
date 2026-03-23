export type Severity = "low" | "medium" | "high";

export interface PageContext {
  href: string;
  origin: string;
  hostname: string;
  pathname: string;
}

export interface ResourceSummary {
  name: string;
  initiatorType: string;
  transferSize: number;
  encodedBodySize: number;
  duration: number;
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

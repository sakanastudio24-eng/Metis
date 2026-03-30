// stack/index.ts normalizes raw route clues into weighted evidence, then resolves
// cost-relevant technologies through a fingerprint registry instead of one-off rules.
import { TECHNOLOGY_FINGERPRINTS } from "./fingerprints";
import type {
  DetectedStackGroup,
  DetectedStackVendor,
  MoneyStackConfidence,
  MoneyStackDetection,
  MoneyStackGroup,
  PlusRefinementAnswers,
  RawScanSnapshot,
  ResolvedTechnology,
  StackSignal,
  TechnologyEvidence,
  TechnologyEvidenceSource,
  TechnologyFingerprint
} from "../../shared/types/audit";

const GROUP_LABELS: Record<MoneyStackGroup, string> = {
  hostingCdn: "Hosting / CDN",
  aiProviders: "AI Providers",
  analyticsAdsRum: "Analytics / Ads / RUM",
  framework: "Framework",
  payment: "Payment",
  monitoring: "Monitoring / Issue Trackers",
  search: "Search Engines",
  libraries: "JavaScript Libraries",
  graphics: "JavaScript Graphics",
  misc: "Misc"
};

const COST_GROUP_IDS = ["hostingCdn", "aiProviders", "analyticsAdsRum"] as const;

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

  // Globals are some of the strongest browser-safe clues we can use in a
  // content script. We keep them as raw evidence instead of resolving vendors
  // here so the fingerprint layer stays explainable and testable.
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
  if ("Sentry" in w) {
    addSignal(signals, "global:sentry", "dom", pageHref);
  }
  if ("Prism" in w) {
    addSignal(signals, "global:prism", "dom", pageHref);
  }
  if ("THREE" in w) {
    addSignal(signals, "global:three", "dom", pageHref);
  }
  if ("algoliasearch" in w) {
    addSignal(signals, "global:algolia", "dom", pageHref);
  }
  if ("ReactFlow" in w) {
    addSignal(signals, "global:reactflow", "dom", pageHref);
  }
  if ("_" in w) {
    addSignal(signals, "global:lodash", "dom", pageHref);
  }
  if ("__webpack_require__" in w || Object.keys(w).some((key) => key.startsWith("webpackChunk"))) {
    addSignal(signals, "global:webpack", "dom", pageHref);
  }
  if (document.querySelector('[property^="og:"]')) {
    addSignal(signals, "meta:open-graph", "dom", pageHref);
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

  const metaGenerator = document
    .querySelector<HTMLMetaElement>('meta[name="generator"]')
    ?.content?.trim();

  if (metaGenerator) {
    addSignal(signals, `meta:generator:${metaGenerator}`, "dom", pageHref);
  }

  addSignal(signals, pageHref, "dom", pageHref);
  return signals;
}

function normalizeAnswerEvidence(answers: PlusRefinementAnswers): TechnologyEvidence[] {
  return Object.entries(answers)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([key, value]) => ({
      key: `answer:${key}:${value}`.toLowerCase(),
      source: "answer" as const,
      value,
      weight: 2,
      original: `${key}:${value}`
    }));
}

function normalizeStackSignalEvidence(snapshot: RawScanSnapshot): TechnologyEvidence[] {
  const seen = new Set<string>();
  const rawSignals = [
    ...(snapshot.stackSignals ?? []),
    ...snapshot.resources.map((resource) => ({
      name: resource.name,
      hostname: resource.hostname,
      pathname: resource.pathname,
      source: "resource" as const
    }))
  ];

  const evidence: TechnologyEvidence[] = [];

  for (const signal of rawSignals) {
    const source = signal.source ?? "resource";
    const hostKey = `host:${signal.hostname.toLowerCase()}`;
    const pathKey = `path:${signal.pathname.toLowerCase()}`;
    const nameKey = signal.name.toLowerCase();

    // The same raw clue can produce multiple useful evidence records. For
    // example, `cloudfront.net` is valuable as a host match while `/_next/`
    // is valuable as a path convention. Dedupe happens at the evidence level
    // so repeated resources do not inflate fingerprint scores forever.
    const normalizedItems: Array<{
      dedupe: string;
      key: string;
      source: TechnologyEvidenceSource;
      weight: number;
    }> = [
      {
        dedupe: `${source}:${hostKey}`,
        key: hostKey,
        source: "host",
        weight: source === "resource" ? 4 : source === "element" ? 3 : 2
      },
      {
        dedupe: `${source}:${pathKey}`,
        key: pathKey,
        source: "path",
        weight: source === "resource" ? 4 : source === "element" ? 3 : 2
      },
      {
        dedupe: `${source}:${nameKey}`,
        key: nameKey,
        source: source === "dom" && nameKey.startsWith("global:") ? "global" : source,
        weight:
          source === "dom" && nameKey.startsWith("global:")
            ? 5
            : source === "resource"
              ? 3
              : source === "element"
                ? 2
                : 2
      }
    ];

    for (const item of normalizedItems) {
      if (seen.has(item.dedupe)) {
        continue;
      }

      seen.add(item.dedupe);
      evidence.push({
        key: item.key,
        source: item.source,
        weight: item.weight,
        original: signal.name
      });
    }
  }

  return evidence;
}

export function collectTechnologyEvidence(
  snapshot: RawScanSnapshot,
  answers: PlusRefinementAnswers = {}
): TechnologyEvidence[] {
  return [
    ...normalizeStackSignalEvidence(snapshot),
    ...normalizeAnswerEvidence(answers)
  ];
}

function matchesPattern(
  evidence: TechnologyEvidence,
  fingerprint: TechnologyFingerprint
) {
  return fingerprint.patterns.some((pattern) => {
    if (pattern.source !== evidence.source) {
      return false;
    }
    if (pattern.minWeight && evidence.weight < pattern.minWeight) {
      return false;
    }
    if (pattern.keyIncludes && !pattern.keyIncludes.some((item) => evidence.key.includes(item.toLowerCase()))) {
      return false;
    }
    if (
      pattern.valueIncludes &&
      !pattern.valueIncludes.some((item) =>
        String(evidence.value ?? "").toLowerCase().includes(item.toLowerCase())
      )
    ) {
      return false;
    }
    return true;
  });
}

function confidenceFromScore(score: number, minScore: number): MoneyStackConfidence {
  if (score >= minScore + 4) {
    return "high";
  }
  if (score >= minScore + 1) {
    return "medium";
  }
  return "low";
}

function sourceFromEvidence(evidence: TechnologyEvidence[]): TechnologyEvidenceSource {
  const uniqueSources = [...new Set(evidence.map((item) => item.source))];
  if (uniqueSources.length === 0) {
    return "resource";
  }
  if (uniqueSources.length === 1) {
    return uniqueSources[0] ?? "resource";
  }
  return "mixed";
}

function scoreFingerprints(evidence: TechnologyEvidence[]) {
  const resolved = new Map<string, ResolvedTechnology>();

  for (const fingerprint of TECHNOLOGY_FINGERPRINTS) {
    // Fingerprints win by accumulated evidence, not by one brittle string
    // match. That keeps the detector honest on dynamic sites where some clues
    // are noisy or missing.
    const hits = evidence.filter((entry) => matchesPattern(entry, fingerprint));
    const score = hits.reduce((total, entry) => total + entry.weight, 0);

    if (score < fingerprint.minScore) {
      continue;
    }

    resolved.set(fingerprint.id, {
      vendor: {
        id: fingerprint.id,
        label: fingerprint.label,
        group: fingerprint.group,
        brandColor: fingerprint.brandColor,
        source: sourceFromEvidence(hits),
        confidence: confidenceFromScore(score, fingerprint.minScore),
        providerKind: fingerprint.providerKind,
        score
      },
      evidence: hits
    });
  }

  for (const fingerprint of TECHNOLOGY_FINGERPRINTS) {
    if (!fingerprint.implies || !resolved.has(fingerprint.id)) {
      continue;
    }

    // Explicit implications like Next.js -> React are allowed, but only after
    // the parent fingerprint already resolved from direct evidence.
    for (const impliedId of fingerprint.implies) {
      if (resolved.has(impliedId)) {
        continue;
      }

      const impliedFingerprint = TECHNOLOGY_FINGERPRINTS.find((item) => item.id === impliedId);
      if (!impliedFingerprint) {
        continue;
      }

      resolved.set(impliedId, {
        vendor: {
          id: impliedFingerprint.id,
          label: impliedFingerprint.label,
          group: impliedFingerprint.group,
          brandColor: impliedFingerprint.brandColor,
          source: "mixed",
          confidence: "medium",
          providerKind: impliedFingerprint.providerKind,
          score: impliedFingerprint.minScore
        },
        evidence: resolved.get(fingerprint.id)?.evidence ?? []
      });
    }
  }

  return [...resolved.values()];
}

function sortVendors(left: DetectedStackVendor, right: DetectedStackVendor) {
  const confidenceRank = {
    high: 3,
    medium: 2,
    low: 1
  };

  const confidenceDiff =
    confidenceRank[right.confidence] - confidenceRank[left.confidence];

  if (confidenceDiff !== 0) {
    return confidenceDiff;
  }

  return (right.score ?? 0) - (left.score ?? 0) || left.label.localeCompare(right.label);
}

export function detectMoneyStack(
  snapshot: RawScanSnapshot,
  answers: PlusRefinementAnswers = {}
): MoneyStackDetection {
  const resolved = scoreFingerprints(collectTechnologyEvidence(snapshot, answers));
  const groups = new Map<MoneyStackGroup, DetectedStackVendor[]>();

  for (const item of resolved) {
    const current = groups.get(item.vendor.group) ?? [];
    current.push(item.vendor);
    groups.set(item.vendor.group, current);
  }

  const finalGroups: DetectedStackGroup[] = [...groups.entries()]
    .map(([groupId, vendors]) => ({
      id: groupId,
      label: GROUP_LABELS[groupId],
      vendors: [...vendors].sort(sortVendors)
    }))
    .sort((left, right) => left.label.localeCompare(right.label));

  const directCostGroups = finalGroups
    .filter((group) =>
      COST_GROUP_IDS.includes(group.id as (typeof COST_GROUP_IDS)[number]) && group.vendors.length > 0
    )
    .map((group) => group.id as (typeof COST_GROUP_IDS)[number]);

  const missingCostGroups = COST_GROUP_IDS.filter(
    (groupId) => !directCostGroups.includes(groupId)
  );

  return {
    groups: finalGroups,
    directCostGroups: [...directCostGroups],
    missingCostGroups: [...missingCostGroups]
  };
}

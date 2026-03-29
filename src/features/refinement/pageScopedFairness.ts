import { getPageScanKey } from "../../shared/lib/pageScanHistory";
import type {
  PageScopedFairnessAnswers,
  PageScopedFairnessKey,
  PlusRefinementAnswers
} from "../../shared/types/audit";

export type PageScopedFairnessMap = Record<
  string,
  Partial<PageScopedFairnessAnswers>
>;

export function getFairnessPageKey(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  try {
    return getPageScanKey(url);
  } catch {
    return null;
  }
}

export function pickPageScopedFairnessAnswers(
  answers: PlusRefinementAnswers = {}
): Partial<PageScopedFairnessAnswers> {
  return {
    appType: answers.appType,
    representativeExperience: answers.representativeExperience
  };
}

export function stripPageScopedFairnessAnswers(
  answers: PlusRefinementAnswers = {}
): PlusRefinementAnswers {
  const nextAnswers = { ...answers };
  delete nextAnswers.appType;
  delete nextAnswers.representativeExperience;
  return nextAnswers;
}

export function getPageScopedFairnessAnswers(
  map: PageScopedFairnessMap,
  pageKey: string | null
): Partial<PageScopedFairnessAnswers> {
  if (!pageKey) {
    return {};
  }

  return map[pageKey] ?? {};
}

export function setPageScopedFairnessAnswer(
  map: PageScopedFairnessMap,
  pageKey: string | null,
  key: PageScopedFairnessKey,
  value: string
): PageScopedFairnessMap {
  if (!pageKey) {
    return map;
  }

  return {
    ...map,
    [pageKey]: {
      ...map[pageKey],
      [key]: value
    }
  };
}

export function clearPageScopedFairnessAnswer(
  map: PageScopedFairnessMap,
  pageKey: string | null,
  key: PageScopedFairnessKey
): PageScopedFairnessMap {
  if (!pageKey || !map[pageKey]) {
    return map;
  }

  const nextEntry = {
    ...map[pageKey],
    [key]: undefined
  };

  const hasValue = Object.values(nextEntry).some((value) => value !== undefined);

  if (!hasValue) {
    const nextMap = { ...map };
    delete nextMap[pageKey];
    return nextMap;
  }

  return {
    ...map,
    [pageKey]: nextEntry
  };
}

export function migrateLegacyFairnessAnswers(
  plusAnswers: PlusRefinementAnswers,
  pageFairnessByKey: PageScopedFairnessMap,
  pageKey: string | null
) {
  const legacyFairness = pickPageScopedFairnessAnswers(plusAnswers);
  const hasLegacyFairness = Object.values(legacyFairness).some(
    (value) => value !== undefined
  );

  if (!hasLegacyFairness || !pageKey || pageFairnessByKey[pageKey]) {
    return {
      plusAnswers: stripPageScopedFairnessAnswers(plusAnswers),
      pageFairnessByKey
    };
  }

  return {
    plusAnswers: stripPageScopedFairnessAnswers(plusAnswers),
    pageFairnessByKey: {
      ...pageFairnessByKey,
      [pageKey]: legacyFairness
    }
  };
}

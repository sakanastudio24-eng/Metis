"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildResourceMetrics = buildResourceMetrics;
exports.collectResourceSummaries = collectResourceSummaries;
const RESOURCE_TIMING_BUFFER_SIZE = 2000;
const MIN_RESOURCE_BYTES = 1000;
const MEANINGFUL_IMAGE_BYTES = 50_000;
const TOP_OFFENDER_LIMIT = 3;
const STACK_SIGNAL_LIMIT = 320;
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".ico"];
const SCRIPT_EXTENSIONS = [".js", ".mjs"];
const STYLESHEET_EXTENSIONS = [".css"];
const FONT_EXTENSIONS = [".woff", ".woff2", ".ttf", ".otf"];
function classifyResourceCategory(initiatorType, pathname) {
    const normalizedInitiator = initiatorType.toLowerCase();
    const normalizedPath = pathname.toLowerCase();
    if (normalizedInitiator === "img" || normalizedInitiator === "image") {
        return "image";
    }
    if (normalizedInitiator === "script") {
        return "script";
    }
    if (normalizedInitiator === "fetch" ||
        normalizedInitiator === "xmlhttprequest" ||
        normalizedInitiator === "beacon") {
        return "api";
    }
    if (normalizedInitiator === "link" && normalizedPath.endsWith(".css")) {
        return "stylesheet";
    }
    if (normalizedInitiator === "css") {
        return "stylesheet";
    }
    if (normalizedInitiator === "font") {
        return "font";
    }
    if (normalizedInitiator === "iframe" ||
        normalizedInitiator === "frame" ||
        normalizedInitiator === "navigation") {
        return "document";
    }
    if (IMAGE_EXTENSIONS.some((extension) => normalizedPath.endsWith(extension))) {
        return "image";
    }
    if (SCRIPT_EXTENSIONS.some((extension) => normalizedPath.endsWith(extension))) {
        return "script";
    }
    if (STYLESHEET_EXTENSIONS.some((extension) => normalizedPath.endsWith(extension))) {
        return "stylesheet";
    }
    if (FONT_EXTENSIONS.some((extension) => normalizedPath.endsWith(extension))) {
        return "font";
    }
    return "other";
}
function buildTopOffenders(aggregates) {
    return [...aggregates]
        .sort((left, right) => right.totalEncodedBodySize - left.totalEncodedBodySize)
        .slice(0, TOP_OFFENDER_LIMIT);
}
function buildResourceMetrics(resources, overrides = {}) {
    const resourceCounts = new Map();
    const aggregateByUrl = new Map();
    const thirdPartyDomains = new Set();
    for (const resource of resources) {
        resourceCounts.set(resource.normalizedUrl, (resourceCounts.get(resource.normalizedUrl) ?? 0) + 1);
        const existingAggregate = aggregateByUrl.get(resource.normalizedUrl);
        if (existingAggregate) {
            existingAggregate.requestCount += 1;
            existingAggregate.totalEncodedBodySize += resource.encodedBodySize;
            existingAggregate.largestEncodedBodySize = Math.max(existingAggregate.largestEncodedBodySize, resource.encodedBodySize);
        }
        else {
            aggregateByUrl.set(resource.normalizedUrl, {
                normalizedUrl: resource.normalizedUrl,
                sampleUrl: resource.name,
                hostname: resource.hostname,
                category: resource.category,
                requestCount: 1,
                totalEncodedBodySize: resource.encodedBodySize,
                largestEncodedBodySize: resource.encodedBodySize,
                isThirdParty: resource.isThirdParty
            });
        }
        if (resource.isThirdParty) {
            thirdPartyDomains.add(resource.hostname);
        }
    }
    const aggregates = Array.from(aggregateByUrl.values());
    let duplicateRequestCount = 0;
    let duplicateEndpointCount = 0;
    for (const count of resourceCounts.values()) {
        if (count > 1) {
            duplicateEndpointCount += 1;
            duplicateRequestCount += count - 1;
        }
    }
    return {
        rawRequestCount: overrides.rawRequestCount ?? resources.length,
        requestCount: resources.length,
        uniqueRequestCount: resourceCounts.size,
        duplicateRequestCount,
        duplicateEndpointCount,
        scriptRequestCount: resources.filter((resource) => resource.category === "script").length,
        imageRequestCount: resources.filter((resource) => resource.category === "image").length,
        apiRequestCount: resources.filter((resource) => resource.category === "api").length,
        thirdPartyRequestCount: resources.filter((resource) => resource.isThirdParty).length,
        thirdPartyDomainCount: thirdPartyDomains.size,
        totalEncodedBodySize: resources.reduce((total, resource) => total + resource.encodedBodySize, 0),
        meaningfulImageCount: resources.filter((resource) => resource.isMeaningfulImage).length,
        meaningfulImageBytes: resources
            .filter((resource) => resource.isMeaningfulImage)
            .reduce((total, resource) => total + resource.encodedBodySize, 0),
        largeAssetCount: resources.filter((resource) => resource.encodedBodySize >= MEANINGFUL_IMAGE_BYTES).length,
        droppedZeroTransferCount: overrides.droppedZeroTransferCount ?? 0,
        droppedTinyCount: overrides.droppedTinyCount ?? 0,
        topOffenders: buildTopOffenders(aggregates),
        topMeaningfulImages: buildTopOffenders(aggregates.filter((aggregate) => aggregate.category === "image" && aggregate.largestEncodedBodySize >= MEANINGFUL_IMAGE_BYTES))
    };
}
function collectResourceSummaries(page) {
    try {
        performance.setResourceTimingBufferSize(RESOURCE_TIMING_BUFFER_SIZE);
    }
    catch {
        // Ignore browsers that reject buffer resizing.
    }
    const entries = performance.getEntriesByType("resource");
    const resources = [];
    const stackSignals = [];
    const seenStackSignals = new Set();
    let droppedZeroTransferCount = 0;
    let droppedTinyCount = 0;
    for (const entry of entries) {
        let url;
        try {
            url = new URL(entry.name, page.href);
        }
        catch {
            continue;
        }
        // Stack signals are collected before the heavier filtering because provider
        // hints can still be useful even when the resource itself is too small to score.
        const stackSignalKey = `${url.hostname}${url.pathname}`;
        if (!seenStackSignals.has(stackSignalKey) && stackSignals.length < STACK_SIGNAL_LIMIT) {
            seenStackSignals.add(stackSignalKey);
            stackSignals.push({
                name: entry.name,
                hostname: url.hostname,
                pathname: url.pathname,
                source: "resource"
            });
        }
        const transferSize = entry.transferSize ?? 0;
        const encodedBodySize = entry.encodedBodySize ?? 0;
        // Metis treats zero-transfer and tiny assets as noise for scoring so request
        // totals do not get inflated by cache hits and low-value files.
        if (transferSize === 0) {
            droppedZeroTransferCount += 1;
            continue;
        }
        if (encodedBodySize < MIN_RESOURCE_BYTES) {
            droppedTinyCount += 1;
            continue;
        }
        const category = classifyResourceCategory(entry.initiatorType || "other", url.pathname);
        resources.push({
            name: entry.name,
            normalizedUrl: `${url.origin}${url.pathname}`,
            hostname: url.hostname,
            pathname: url.pathname,
            initiatorType: entry.initiatorType || "other",
            category,
            transferSize,
            encodedBodySize,
            duration: entry.duration ?? 0,
            isThirdParty: url.origin !== page.origin,
            isMeaningfulImage: category === "image" && encodedBodySize >= MEANINGFUL_IMAGE_BYTES
        });
    }
    return {
        resources,
        stackSignals,
        metrics: buildResourceMetrics(resources, {
            rawRequestCount: entries.length,
            droppedZeroTransferCount,
            droppedTinyCount
        })
    };
}

# Scan Signal Flow

This is the plain-language version of how Metis gathers scan data from a page.

The goal is not to collect everything the browser knows. The goal is to collect the parts that are useful for cost risk.

## Pipeline

1. Metis reads browser resource entries from `performance.getEntriesByType("resource")`.
2. It drops obvious noise:
   - cached resources with zero transfer
   - tiny files that do not matter to cost
   - malformed URLs that cannot be parsed safely
3. It normalizes URLs to `origin + pathname` so the same endpoint does not look different just because the query string changed.
4. It classifies each kept request into a stable bucket like `api`, `script`, `image`, or `stylesheet`.
5. It turns the cleaned resource list into metrics Metis can actually explain:
   - request count
   - duplicate activity
   - third-party activity
   - total page weight
   - meaningful image weight
   - biggest offenders
6. It stores the latest page snapshot and the page-history comparison data in extension storage so rescans can be compared later.

## Why This Exists

Raw browser timing data is messy. If Metis scored from that directly, the score would jump around and be hard to trust.

This pipeline exists so detection, scoring, and the final report all work from the same cleaned view of the page.

## What Comes Out

The scan layer gives the rest of Metis:

- one raw snapshot for the current page
- one compact page-comparison snapshot for storage
- one normalized metrics object that detection and scoring can read safely
- one set of stack signals that later help with known-stack and cost-surface detection

See [normalization-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/normalization-flow.md)
for the cleanup layer that sits in the middle of this pipeline.

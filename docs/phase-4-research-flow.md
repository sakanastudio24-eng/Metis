# Phase 4 Research Flow

This document captures the current research direction for Phase 4.

## Goal

Phase 4 should turn technical score output into plain-language guidance that feels useful to a site owner.

The output should answer:

- what looks expensive or risky
- why it matters
- what to look at next

## What Phase 4 Should Not Do

- invent exact dollar amounts
- overclaim confidence
- bury the user in raw metrics

## Inputs Available Today

Phase 4 can already read:

- normalized snapshot metrics
- detected issues
- weighted score breakdown
- top offenders
- large image aggregates
- baseline comparison context

## Research Conclusions

1. Insight output should stay short.
   A user should understand the page condition in a few seconds.

2. Insight copy should be category-aware.
   Duplicate requests, third-party sprawl, and large images should not all sound the same.

3. Estimated language should stay qualitative first.
   Use labels like:
   - low waste
   - moderate waste
   - heavy waste

4. The first implementation should be deterministic.
   No backend and no AI step are needed for v1 insight generation.

5. Insight generation should be driven by issue metadata.
   The issue category, severity, metric values, and thresholds should shape the message.

## Recommended First Deliverables

- one top summary line
- one supporting summary line
- one estimate label
- one next-step hint based on the strongest issue

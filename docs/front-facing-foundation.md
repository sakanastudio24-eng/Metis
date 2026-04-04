# Metis Front-Facing Foundation

This document explains the product from the extension side so future front-facing work has a stable truth to build from.

## What Metis is

Metis is a browser-based cost-risk reader for live pages.

It does not just show performance noise. It reads the current route, identifies waste patterns, explains what looks justified, and frames what that behavior could mean for real spend.

## What makes it different

Metis is not trying to be a generic profiler, a synthetic lab tool, or a backend billing dashboard.

Its job is narrower and more useful:

- scan the page the user is already on
- show where cost pressure is coming from
- rank what deserves attention first
- explain the tradeoff in human language

## Core product truth

The interesting part of Metis already exists:

- deterministic scan to stack to issues to control to score pipeline
- side panel workflow
- fullscreen report
- local settings
- legal surfaces
- copy system

What remains before ship is confidence, packaging, and polish, not inventing the product from scratch.

## Surface roles

- injected `M`: low-friction entry point on the current page
- side panel: compact working surface
- fullscreen report: long-form read and export path
- popup: extension-only controls

Public-facing improvements should respect those roles instead of collapsing them into one generic story.

## How to use Metis

The correct usage flow is simple:

- open a real page
- click the injected `M`
- read the first score and top drivers in the side panel
- open the report when deeper explanation or sharing is needed
- use the website only for account, security, and beta access

Future front-facing work should describe Metis as something people use while they are already on a live route, not as a detached dashboard-first product.

## What Metis scans

Metis scans the current route and the signals available from that live page session.

That includes:

- request activity
- duplicate or repeated fetch behavior
- heavy assets
- third-party scripts
- AI-leaning request patterns
- stack and provider fingerprints
- route-level signals that affect cost framing

Front-facing copy should say that Metis reads what the page is doing, not that it magically knows the whole backend bill.

## How Metis should frame fixes

Metis should not just surface problems. It should frame the next useful fix correctly.

That means fixes should:

- explain the likely root cause in plain language
- rank what should be fixed first
- separate justified heaviness from waste
- keep estimate language directional instead of pretending to know exact invoices
- stay specific enough that an engineer can act on them

## Current insights and suggestions

The current product already supports a meaningful suggestion model.

Today Metis can already speak about:

- top drivers behind the score
- route-level cost risk
- control and justification
- likely waste sources
- fix-first ordering
- estimate framing
- refinement questions when business context is missing

Front-facing improvements should treat those as real product strengths, not hide them behind vague “AI insights” language.

## What is still missing

Some parts still need to mature before front-facing messaging should lean too hard on them.

The biggest missing pieces are:

- wider calibration across more live sites
- export becoming a real report output
- steadier reconnect and multipage polish
- final live verification of the shipped website-to-extension account handoff

Those should be described as product growth areas, not as already-finished foundations.

## What the report button means

The report button should always mean one thing: move from the compact read into the full explanation.

It should not feel like a mode switch, upgrade trick, or random second UI.

The report button exists to:

- open the deeper read
- show ranked issues and explanation
- support export and future report sharing
- give the user the full route-specific story

## What public copy should preserve

- Metis helps teams understand what their frontend is costing them
- the extension is where scanning and reporting happen
- the website is where account and beta access live
- estimates are directional and grounded, not fake precision
- provider presence is context, not automatic blame
- Metis is calm on the page and serious in the report

## What public copy should avoid

- claiming exact invoice math
- implying every heavy page is bad engineering
- overstating full website-to-extension account sync before it ships
- talking like a generic speed-test product
- sounding like a security scanner or bundle analyzer if the feature is not actually that

## Future front-facing improvement directions

- show more believable real-page examples so the estimate framing feels earned
- turn export into a shareable report story, not just a feature mention
- explain reconnect, saved history, and multipage reading as steady product behavior
- make store readiness materials match the real extension experience
- only present Plus as a validated website-backed account state, not a local UI guess

## Simple message ladder

- short line: Metis shows what a page is costing you
- medium line: Metis scans the current route, finds cost-risk patterns, and explains what to fix first
- long line: Metis is a browser extension and report layer that helps teams understand where frontend spend starts, what looks justified, and what is quietly scaling the bill

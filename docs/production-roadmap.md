# Metis Extension Production Roadmap

This document is the extension-side path to production. It assumes `Metis-Web` remains the source of truth for auth, account, legal, beta access, and email flows.

The extension is already past the hard part. The scanner, stack logic, control layer, side panel flow, fullscreen report, settings, legal pages, and copy system are in place. What remains is product confidence, packaging, and shipping discipline.

## Launch goal

Ship a Chrome extension that is stable under real page conditions, honest about permissions, aligned to website-managed account state, and ready for Chrome Web Store review.

## Current production view

What is left now is shorter than it first appears:

- calibration across more live sites so estimates stay believable
- export becoming a real report output instead of a shell
- polish on reconnect, saved history, and multipage reading
- store readiness work like permissions story, listing copy, legal polish, and QA loops
- final live verification of the shipped website-to-extension account bridge and entitlement behavior

## Phase 1: Product confidence

### Priority work

- calibration across more live sites
- export architecture
- reconnect, saved history, and multipage polish

### Scope

- run calibration passes across more live sites so score output and estimate framing feel consistently believable
- turn export into a real report output instead of a shell
- harden reconnect behavior so session recovery feels steady instead of fragile
- polish saved history and multipage reading until they feel like first-class product surfaces
- test the extension across normal pages, heavy apps, redirects, and CSP-sensitive sites

### Exit criteria

- estimates feel believable across a wider real-site sample
- export produces a report worth sharing
- reconnect and history behavior feel steady under normal use
- multipage reading feels intentional, not experimental

## Phase 2: Runtime and account hardening

### Priority work

- permission testing
- runtime injection hardening
- extension auth validation for account type
- Plus Beta handoff
- report to email temporary handoff

### Scope

- verify the current `manifest.json` permission set is the minimum needed for production
- test `host_permissions` and always-mounted content behavior against Chrome Web Store expectations
- make sure the injected `M` launcher mounts once, unmounts cleanly, and does not duplicate across SPA route changes
- test side panel launch, fullscreen report launch, and popup behavior together on the same tab session
- verify the extension does not break pages when scans fail, timing buffers fill, or resource APIs are incomplete
- harden runtime message paths between page bridge, side panel, popup, and background
- validate account type before opening Plus-only extension surfaces
- keep auth, upload, and access-state work aligned to `docs/communication-contracts`
- treat `Metis-Web` account state as the source of truth for free vs Plus Beta behavior
- keep `Manage account` linked to `https://metis.zward.studio/account`
- replace any remaining local purchase, fake entitlement, or fake account-plan flows with website-managed handoff behavior
- if the temporary Plus Beta bridge remains, keep it explicit:
- open account info in a new tab
- exit the current local purchase UI
- allow the injected `M` treatment to switch into the Plus red state only after the intended handoff path
- define the temporary report-to-email handoff from extension output into website email delivery instead of local mail logic

### Exit criteria

- no fake local billing state remains
- account type checks are explicit and testable
- Plus Beta entry behavior is consistent with website-owned entitlement
- temporary report-to-email behavior has a documented handoff contract
- runtime injection is stable across real navigation patterns
- permissions are justified in Chrome Web Store language

## Phase 3: Store submission and production review

### Priority work

- Chrome Web Store pack
- design system pass
- final security pass
- final copy pass
- final extension pass

### Scope

- prepare Chrome Web Store listing copy, screenshots, privacy wording, and permission justification
- lock popup, side panel, page report, export output, and injected `M` to one stable visual system using `docs/design-system-logic.md`
- verify the extension privacy and terms pages match shipped behavior
- do a final audit for hidden state, over-broad permissions, debug affordances, and misleading beta language
- review popup, side panel, and report copy for clarity and consistency with the website
- confirm all public links resolve to `https://metis.zward.studio`

### Exit criteria

- store listing assets and copy are ready
- permission rationale is production-safe
- extension copy and legal text match the shipped runtime
- design-system behavior is consistent across all extension surfaces

## Cross-repo dependencies on `Metis-Web`

- account type source of truth
- Plus Beta eligibility
- temporary report-to-email delivery
- legal promises around account ownership and storage
- communication contract truth for bridge, uploads, and access-state

## Still unresolved

- packaged-extension verification of the shipped account validation contract still needs a final production-style pass with `Metis-Web`
- temporary report-to-email delivery shape is still unresolved and should be treated as a bridge, not the final report system
- the final Plus Beta handoff behavior after website validation is still unresolved in UI detail, even if the ownership boundary is clear

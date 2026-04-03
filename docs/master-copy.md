# Metis Master Copy

This is the main copy reference for the Metis extension.

Use it before changing UI wording, fallback copy, or product labels.

## Copy roles

- `Header` is the main label on a surface
- `Subheader` supports the header
- `Body` explains what is happening
- `CTA` is action text
- `Toast` is short feedback after an action
- `Tag` is a compact status label

## Brand and product names

- Product name: `Metis`
- Product identity in descriptive copy: `Metis extension`
- Premium label: `Metis+`
- Main score labels: `Combined Score`, `Score`, `Control`, `Confidence`

## Core actions

- CTA, launcher tooltip: `Open Metis`
- CTA, launcher helper: `Drag up or down, then click to open Metis`
- CTA, reconnect: `Close and reopen`
- CTA, full report: `Full Report`
- CTA, settings entry: `Settings`
- CTA, copy report: `Copy report`
- CTA, export: `Export`
- CTA, account handoff: `Manage account`
- CTA, Plus action: `Upgrade`
- CTA, local Plus downgrade: `Degrade to free`
- CTA, report scope: `Single Page`
- CTA, report scope: `Multipage Scan (beta)`

## Page and side panel copy

- Body, hover idle state: `Open Metis`
- Body, hover helper:
  `Drag this clip up or down, then click to open the real Metis side panel.`
- Header, reconnect ready: `Start Metis on this page`
- Header, reconnect disconnected: `Close and reopen Metis`
- Body, reconnect ready:
  `Click the page hover or use this button to start the tab session and stream live scan data into the side panel.`
- Body, reconnect disconnected:
  `The page bridge is not ready yet. Close the panel, reopen Metis, and refresh the current tab if needed.`
- Header, activity module: `Latest scan activity`

## Toolbar settings copy

### Section titles

- Header: `Account`
- Header: `Scan behavior`
- Header: `Data`
- Header: `Permissions`
- Header: `About`

### Account

- Header, stat label: `Name`
- Header, stat label: `Email`
- Body:
  `Show the current local account placeholder.`
- CTA: `View my dashboard`

### Scan behavior

- Header: `Auto-rescan while panel open`
- Body:
  `Route changes still rescan even when steady refresh is off.`
- Subheader: `Scan delay`
- CTA options:
  - `Fast`
  - `Balanced`
  - `Thorough`

### Data

- Header, stat label: `Saved snapshots`
- Header, stat label: `Site history`
- CTA: `Clear snapshots`
- CTA: `Clear history`
- Toast: `Saved snapshots cleared`
- Toast: `Site history cleared`

### Permissions

- Header: `Permission ability`
- Body:
  `Turn Metis capabilities on or off here without leaving the extension. Hover a permission to see what it changes.`
- Header: `Web pages`
- Body:
  `When this is off, Metis stops collecting new route scans on normal http and https pages until you turn it back on.`
- Body, ability:
  `Scans current and same-site routes`
- Header: `Storage`
- Body:
  `When this is off, Metis stops saving snapshots and same-site progress locally. Your core settings still remain available so the extension can keep working.`
- Body, ability:
  `Keeps local history on this device`
- Header: `Scripting`
- Body:
  `When this is off, Metis stops reinjecting or repairing the page bridge on older tabs that need a fresh script pass.`
- Body, ability:
  `Repairs the page bridge`
- Header: `Side panel`
- Body:
  `When this is off, Metis stops relying on the attached workspace as an automatic compact-review preference. A direct user-open can still bring Metis forward.`
- Body, ability:
  `Keeps the attached workspace available`

### About

- Header, link title: `Metis site`
- Body, link detail:
  `Product overview, current direction, and website entry.`
- Header, link title: `Privacy`
- Body, link detail:
  `Current privacy policy.`
- Header, link title: `Terms`
- Body, link detail:
  `Current terms of use.`
- Header, link title: `Manage account`
- Body, link detail:
  `Open website account access and Plus Beta entry.`

## Report copy

- Header: `Metis report for {hostname}`
- Header: `Metis+ report for {hostname}`
- Header: `Metis+ Full Report`
- Header: `Score`
- Header: `Confidence`
- Header: `Report Scope`
- Header: `Add page context`
- Header: `Estimated waste`
- Header: `Top drivers`
- Header: `Insight`
- Header: `Current session cost`
- CTA: `Back`
- Header: `Plus read`
- Tag: `Metis+`
- Tag: `Low`
- Tag: `Limited`
- Tag: `Moderate`
- Tag: `High`
- Body, fallback summary:
  `Metis is still building a clean read of this page.`
- Body, export footer:
  `Scanned by Metis (metis.zward.studio)`
- Body, confidence helper:
  `Based on available page data.`
- Body, low confidence:
  `Metis could only see part of this route.`
- Body, limited confidence:
  `This route returned very little network activity.`
- Body, limited confidence detail:
  `Results may reflect a cached or idle state.`
- Body, moderate confidence:
  `Metis has enough signal to guide the read, but not the full picture.`
- Body, high confidence:
  `Metis has a strong signal set for this route.`
- Body, estimate summary:
  `Current waste estimate is roughly {range}.`
- Body, scope helper:
  `Score stays tied to this route. Multipage adds supporting context only.`
- Body, multipage helper:
  `Visit a few more routes to compare this page against the rest of the site.`
- Body, multipage helper:
  `Similar cost patterns were observed across sampled pages.`
- Body, multipage helper:
  `Other sampled pages show higher cost pressure than this page.`
- Body, multipage helper:
  `This page shows more cost pressure than the other sampled pages.`
- Body, multipage helper:
  `Duplicate requests appear across sampled pages.`
- Body, multipage helper:
  `Third-party vendor overhead appears across sampled pages.`
- Body, multipage helper:
  `Large media appears across sampled pages.`
- Header, fairness question:
  `What type of page is this route on?`
- Header, fairness question:
  `Is this the main public page?`
- CTA option:
  `Marketing / landing page`
- CTA option:
  `Product / dashboard`
- CTA option:
  `AI / interactive app`
- CTA option:
  `Docs / content page`
- CTA option:
  `Yes, this is the main page`
- CTA option:
  `No, this is a specific route`
- CTA option:
  `Not sure`
- Body, fairness helper:
  `This answer applies to the current page. It helps Metis judge whether the route looks justified here.`
- Body, fairness helper:
  `Choose this once for the main page. Other routes are treated as separate from it.`
- Body rule:
  `Fairness answers for page type and route role should be stored by normalized page key, not once for the whole tab session.`
- Body, fairness framing:
  `This route is heavy for a marketing page.`
- Body, fairness framing:
  `This route shows moderate complexity for a marketing page.`
- Body, fairness framing:
  `This route is heavier, but some of that is expected for a dashboard.`
- Body, fairness framing:
  `This route is specific and dynamic, so some extra activity is expected.`
- Body rule:
  `Do not call a light route heavy if the page stays under 50 requests, under 500 KB, and clear of duplicate waste.`
- Body rule:
  `Hosting and CDN should stay supporting context unless heavier transfer or repeated work makes them part of the cost story.`
- Body rule:
  `Score means avoidable cost pressure. Control means whether the route complexity looks justified.`
- Body rule:
  `If the current route only resolves hosting or CDN, keep the grouped stack section quiet instead of making the report look more complete than it is.`
- Body rule:
  `Only call a marketing route heavy when both request pressure and payload pressure are meaningfully elevated.`
- Body rule:
  `Multipage scan is supporting context only. It must not change score, control, confidence, issue order, or cost.`
- Body rule:
  `Stack detection should surface broader client-side technologies like monitoring, search, graphics, libraries, and misc page signals when there is direct browser-safe evidence.`
- Body, Plus read:
  `Plus adds context and fix order without changing the base report read.`
- Header: `Endpoint Detail`
- Body:
  `Type: {type}`
- Body:
  `Requests: {count}`
- Body:
  `Size: {size}`
- Header: `Recommendation`
- Header: `Impact`

## Plus and refinement copy

- Tag: `Plus suggestion`
- Body:
  `Upgrade opens the fullscreen Metis+ report preview.`
- Body:
  `Metis+ keeps the same score and estimate, then adds more detail.`
- CTA:
  `Manage account`
- CTA:
  `Upgrade`
- CTA:
  `Degrade to free`

## Export shell copy

- Body rule:
  `Export should read like a report document, not a screenshot.`
- Body rule:
  `Pricing wording should stay approximate when it uses reference pricing.`
- Body rule:
  `Metis+ exports should carry the Metis+ title and include the deeper Plus sections.`

## Error and catchall responses

### Close and reopen

- Header: `Close and reopen failed`
- Body:
  `Metis could not reopen cleanly on the current tab.`
- Header: `Close and reopen started`
- Body:
  `Metis is rebuilding the page bridge for this tab.`

### Report copy

- Toast: `Report copied`
- Body:
  `Metis copied the current report summary to your clipboard.`

### Export

- Toast: `Export outline copied`
- Body:
  `The current export document shape is now on your clipboard.`

### Copy rules

- do not fake pricing precision
- do not blame AI or provider presence by default
- use questions for missing business context
- keep `Plus suggestion` as a tag, not a sentence lead
- keep Free and Plus on the same core report truth
- use plain sentences in copied and exported reports
- avoid bullet dashes in report text when a simple list or label reads better

## Legal copy

- Product descriptor: `Metis extension`
- Header: `Privacy Policy`
- Header: `Terms of Use`
- keep both pages basic, readable, and appropriate for beta
- do not imply enterprise guarantees or legal review that do not exist

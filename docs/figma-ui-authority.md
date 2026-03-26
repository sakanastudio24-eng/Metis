# Figma UI Authority

The current design authority for the live Metis UI is the repo itself.

Primary sources:

- `docs/design-system-flow.md`
- `src/app/components/figures/`
- `src/content/PageBridgeApp.tsx`
- `src/app/App.tsx`

## Implementation Rule

The side panel and the page fullscreen report should follow the live design-system tokens and component rules in the repo, not archived zip fixtures or removed legacy shells.

## Current Mapping

- `src/app/components/figures/liveAdapter.ts`
  - maps current scan, score, insight, and refinement output into the prototype-shaped display model
- `src/app/components/figures/PanelLayout.tsx`
  - renders the compact side-panel body from that display model
- `src/app/components/figures/FullReportLayout.tsx`
  - renders the fullscreen DOM report from that display model

## Do Not Drift

- Keep Jua for display values and Inter for body and control text.
- Keep px-based type sizes and line heights inside the Shadow DOM.
- Keep brand and surface colors aligned to the live design-system doc rather than one-off utility approximations.
- Treat current Phase 4 metrics as authoritative, and treat richer stack/cost rows as display-derived when exact live signals do not yet exist.

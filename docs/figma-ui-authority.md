# Figma UI Authority

The current design authority for the Metis extension UI is the newer archive:

- `Metis DesignVr2.zip/src/app/components/MetisExtension.tsx`
- `Metis DesignVr2.zip/guidelines/MetisStyleGuide.md`
- `Metis DesignVr2.zip/AI_README.md`

## Implementation Rule

The live runtime still starts in `src/app/App.tsx`, but the injected shell should follow the zip-backed hierarchy and token rules, not the older `PhaseOneShell.tsx` layout.

## Current Mapping

- `src/app/components/figures/liveAdapter.ts`
  - maps current scan, score, insight, and refinement output into the prototype-shaped display model
- `src/app/components/figures/PanelLayout.tsx`
  - renders the mini and floating panel body from that display model
- `src/app/components/figures/FullReportLayout.tsx`
  - renders the centered report modal from that display model

## Do Not Drift

- Keep Jua for display values and Inter for body and control text.
- Keep px-based type sizes and line heights inside the Shadow DOM.
- Keep brand and surface colors aligned to the zip spec rather than utility approximations.
- Treat current Phase 4 metrics as authoritative, and treat richer stack/cost rows as display-derived when exact live signals do not yet exist.

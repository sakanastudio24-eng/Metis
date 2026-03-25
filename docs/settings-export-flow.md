# Settings And Export Flow

This note covers the new local-only product surfaces that sit next to the live report.

## Settings

Metis settings are intentionally local in Phase 4.

There is no auth, no cloud sync, and no team model yet.

The settings surface exists to make the extension feel persistent without pretending the backend exists.

Current settings groups:

- scan behavior
- motion and refresh behavior
- layout behavior
- saved scan management

The stored settings contract lives in:

- [src/shared/lib/metisLocalSettings.ts](/Users/zech/Downloads/The-Big-One/Metis/src/shared/lib/metisLocalSettings.ts)
- [src/shared/types/audit.ts](/Users/zech/Downloads/The-Big-One/Metis/src/shared/types/audit.ts)

The UI lives in:

- [src/app/components/figures/MetisUtilityModals.tsx](/Users/zech/Downloads/The-Big-One/Metis/src/app/components/figures/MetisUtilityModals.tsx)

## Saved scans

Settings now make the save model more visible.

There are two different save concepts:

- saved page snapshots across routes
- current-site sampled progress

Those are related, but they are not the same thing.

That distinction matters because a user can see:

- many saved page snapshots overall
- only a few visited pages on the current origin

## Export shell

Export is now being shaped as a report document flow, not a screenshot flow.

The current shell does three things:

- builds a deterministic export document from the live report view model
- shows the section structure that a future PDF/export path will use
- lets the user copy the export outline now

This keeps the architecture honest:

- the export shape comes from product data
- the future PDF system can attach to the same document contract

Core files:

- [src/app/components/figures/exportDocument.ts](/Users/zech/Downloads/The-Big-One/Metis/src/app/components/figures/exportDocument.ts)
- [src/app/components/figures/MetisUtilityModals.tsx](/Users/zech/Downloads/The-Big-One/Metis/src/app/components/figures/MetisUtilityModals.tsx)

## Why auth is deferred

Settings and export are local on purpose.

The product still needs:

- account design
- entitlement design
- sync strategy
- report ownership rules

So this pass stops short of fake auth. It gives Metis a better product shape now without dragging backend promises into the UI too early.

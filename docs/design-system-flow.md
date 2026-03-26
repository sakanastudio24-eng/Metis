# Design System Flow

This is the canonical design-system note for Metis.

The top of this document is written for fast product reading.
The bottom is the technical reference layer.

## Quick Read

Metis should feel like one small product layer attached to the browser, not like a detached dashboard and not like a widget borrowing the host site’s styles.

The product should read in this order:

1. combined score
2. cost risk and control
3. short explanation
4. cost footprint
5. issues
6. stack and refinement detail

The panel stays compact.
The side panel report stays vertical.
Nothing in the product should depend on horizontal scrolling.

## Core Principles

- one connected Metis surface from launcher to compact side panel to page fullscreen report
- stable dark shell that does not drift across websites
- score-first hierarchy with compact density
- status meaning that stays consistent across surfaces
- readable type at small sizes inside Shadow DOM
- motion that explains state changes instead of decorating them

## Canonical Surfaces

Metis has four primary surfaces:

1. launcher
2. side panel
3. page fullscreen report
4. utility modals like settings and export

The full report is not a detached product.
It opens in the page DOM, but it should still feel like the larger expression of the same Metis system.
It should read like the detailed mode of the same side-panel workspace.

That means:

- it opens from the same extension context
- it uses the same shell colors and card rules
- it should not feel like a popup layered on top of a different product

## Layout Rules

Metis should prefer vertical reading, not horizontal exploration.

- the dashboard must fit without horizontal scrolling
- when space gets tight, cards stack earlier instead of introducing sideways movement
- panel content stays summary-first
- the full report can hold more detail, but it should still collapse before it drifts sideways

If a layout only works because the user can scroll sideways, it is the wrong layout for this product.

## Typography

Metis uses two jobs for type and the split should stay strict.

- `Jua`
  - score numbers
  - brand marks
  - short high-emphasis display moments
- `Inter`
  - body copy
  - labels
  - buttons
  - pills
  - metadata
  - helper text

The rule is simple:

- if it needs to be read fast, use `Inter`
- if it needs to feel branded or weighted, use `Jua`

## Color And Status Semantics

The palette is intentionally small.

- navy and dark slate carry the shell
- warm red is the main action and high-risk accent
- amber/yellow is the watch or mixed-state color
- green is the healthy or controlled color
- orange is reserved for help, tooltips, and technical explanation
- brand tints are only for provider context

Status should not rely on color alone.

Current status pattern:

- green dash for healthy or controlled
- yellow arrow for watch or mixed
- red vertical arrow for high risk or uncontrolled

These directional icons are part of the design language and should be reused anywhere status needs a compact read.

## Icon Rules

Use icons, not emoji.

- live state
- badges
- quick actions
- status chips
- report chrome

If something needs emphasis, use layout, color, type weight, or a real icon.

## Tooltip Rules

Metis uses orange acronym tooltips for product shorthand.

These should:

- appear above the acronym
- stay short and plain
- explain the acronym, not add marketing copy
- be used for real shorthand like `AI`, `API`, `CDN`, `RUM`, `PDF`, `SPA`, `AWS`

Tooltips are for reducing friction, not decorating the UI.

## Spacing Rhythm

Metis works better when spacing is consistent than when it is dramatic.

- tight spacing for labels, pills, and metadata
- medium spacing for cards and grouped content
- larger spacing only for major section breaks

The main visual mistake to avoid is oversized hero spacing around very small amounts of information.

## Motion Rules

Motion should make state changes easier to follow.

Use motion for:

- launcher reveal and return
- panel entry and exit
- report mode transitions
- content refresh fades and small lift transitions
- row and card staging

Do not use motion for decoration that does not explain anything.

## Summary Rules

The top of Metis should always answer two questions:

1. how expensive or risky does this route look
2. does that heaviness seem justified

That means the summary system is:

- combined score first
- `Cost Risk` and `Control` directly underneath
- same summary language in the panel and the full report

The panel version stays compact.
The full report version can add more reasoning, but it should still feel like the same component family.

## Copy Rules

Product copy should feel calm and specific.

- do not repeat labels in multiple tones
- do not bury the main meaning inside badge text
- prefer `Plus suggestion` as a tag over stuffing `Plus` into the sentence itself
- avoid harsh blame wording when the signal is contextual

Metis should sound like it is interpreting the page, not accusing the user.

---

## Technical Reference

This section is the implementation-facing source of truth.

## Color Tokens

Current core tokens from [tailwind.css](/Users/zech/Downloads/The-Big-One/Metis/src/styles/tailwind.css):

- `--metis-color-navy: #0d1b2a`
- `--metis-color-orange: #f97316`
- `--metis-color-white: #ffffff`

Current surface colors used in the live product:

- launcher / main dark shell: `#0d1825`
- panel shell: `#111d2b`
- report shell: `#0c1623`
- main action / hot accent: `#dc5e5e`
- warning / tooltip / mixed-state accent: `#f97316`
- healthy / active-state accent: `#22c55e`

Usage rules:

- use `#0d1825` or `--metis-color-navy` family values for shell backgrounds
- use `#dc5e5e` for primary action and high-risk emphasis
- use `#f97316` for help, explanation, warning, and tooltip accents
- use `#22c55e` only for healthy or active-state feedback
- use provider colors only when tied to detected stack context

Avoid introducing one-off bright accents unless they map to an existing semantic role.

## Spacing Scale

Metis should use a small, repeatable spacing system.

Preferred spacing scale:

- `4px` for tiny separators and inline icon gaps
- `8px` for tight chip and metadata spacing
- `12px` for compact grouped controls
- `16px` for default card padding or local section padding
- `24px` for card-to-card spacing and main report gaps
- `32px` only for major section separation

Current live examples:

- launcher tooltip uses `px-4` and small inline gaps
- panel and report headers commonly use `px-4 py-4`
- reconnect state uses `px-6 py-8`
- report grid gap is `24px`

Rules:

- prefer `8`, `12`, `16`, `24`
- avoid odd spacing jumps that do not align with that ladder
- if a section needs more than `24px`, confirm it is a major break, not just loose layout

## Radius Rules

Current radius tokens from [tailwind.css](/Users/zech/Downloads/The-Big-One/Metis/src/styles/tailwind.css):

- `--metis-radius-panel: 28px`
- `--metis-radius-card: 24px`
- `--metis-radius-chip: 999px`

Usage rules:

- use `28px` for major shell containers
- use `24px` or `22px` for cards and grouped panels
- use full-pill radius for chips, badges, tooltip bubbles, and compact controls
- launcher can use a tighter custom shape when it docks to the page edge

## Type Scale

Metis pins text sizing in pixels so host sites cannot distort the UI.

Current normalized text sizes:

- `11px / 14px` for overlines and tiny metadata
- `12px / 17px` for compact body text and pills
- `14px / 20px` for default body text
- `18px / 24px` for local section emphasis
- `22px / 28px` for medium headings
- `28px / 32px` for score-adjacent display text
- `36px / 40px` for large branded numbers

Usage rules:

- default readable UI text should stay around `12px` to `14px`
- headings in the side panel should rarely exceed `22px`
- only score and brand moments should hit the `28px+` display range

## Size Rules

Launcher:

- minimum launcher width should stay around `48px`
- launcher badge core should stay around `28px`
- the launcher should feel clickable without becoming a floating tile

Panel:

- the side panel should optimize for narrow reading first
- summary modules should compress before they wrap into unstable layouts
- internal sections should assume a constrained width by default

Report mode:

- report grids should collapse before they overflow
- wide two-column layouts are acceptable only when both columns stay readable
- if a card requires horizontal scrolling, the card design is wrong

Controls:

- pill buttons should stay compact and legible
- icon buttons should keep a stable hit area even when the icon itself is small
- badges should not grow taller than the content around them unless they are a focal status object

## Shadow DOM Normalization Rules

Metis owns its own typography and spacing inside the injected root.

Important rules from [tailwind.css](/Users/zech/Downloads/The-Big-One/Metis/src/styles/tailwind.css):

- `#metis-react-root` resets host-page inheritance
- text sizes are normalized in pixels
- shell classes like `.metis-panel-shell` and `.metis-report-shell` define extension-owned surfaces
- `.metis-report-grid` is the source of truth for report-column collapse behavior

If a host site changes root font size or layout defaults, Metis should still look the same.

## Authority

The current visual authority is:

- figure components inside `src/app/components/figures`
- the page bridge in [src/content/PageBridgeApp.tsx](/Users/zech/Downloads/The-Big-One/Metis/src/content/PageBridgeApp.tsx)
- extension-owned normalization rules in [src/styles/tailwind.css](/Users/zech/Downloads/The-Big-One/Metis/src/styles/tailwind.css)
- runtime shell structure in [src/app/App.tsx](/Users/zech/Downloads/The-Big-One/Metis/src/app/App.tsx)

When design and logic are in tension, keep the logic and reshape the presentation to fit this system instead of inventing a one-off layout.

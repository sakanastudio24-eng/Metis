# Design System Flow

This is the canonical design-system note for Metis.

The short version: Metis should feel like one small product layer attached to the page, not like a detached dashboard and not like a widget borrowing the host site’s styles.

## What The System Is Protecting

- a stable dark shell that does not drift across websites
- one connected Metis surface from launcher to panel to full report
- a score-first top section with clear hierarchy
- compact information density without sideways scrolling
- status color and icon meaning that stays consistent
- readable type at small sizes inside Shadow DOM
- motion that explains state changes instead of decorating them

## Canonical Surfaces

Metis has four primary surfaces:

1. launcher
2. side panel
3. attached full report
4. utility modals like settings and export

The full report is not a separate centered product. It should read like an expansion of the right-side panel.

That means:

- it opens from the same side
- it uses the same shell colors and card logic
- it should not feel like a popup layered on top of an unrelated panel

## Layout Rules

Metis should prefer vertical reading, not horizontal exploration.

Current rule:

- the dashboard must fit without horizontal scrolling
- when space gets tight, cards should stack earlier instead of pushing the user into sideways movement
- panel content stays narrow and prioritizes summary
- full report gets more room, but still collapses to one column before it introduces horizontal drift

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

Metis should keep explicit pixel sizing inside the Shadow DOM so host pages cannot inflate or shrink the UI.

## Color And Status Semantics

The palette is intentionally small.

- dark navy for shell backgrounds
- slate for neutral cards
- warm red for action and high-risk states
- amber/yellow for watch or mixed states
- green for healthy or controlled states
- orange for hover help and acronym explanations
- brand tints only when tied to detected providers

Status should not rely on color alone.

Current status pattern:

- green dash for healthy or controlled
- yellow right arrow for watch or mixed
- red up-right arrow for high risk or uncontrolled

These directional icons are now part of the design language and should be reused anywhere status needs a compact read.

## Icon Rules

Use icons, not emoji.

- live state
- badges
- quick actions
- status chips
- report chrome

Emoji should not appear in the product UI. If something needs emphasis, use layout, color, type weight, or a real icon.

## Tooltip Rules

Metis now uses orange acronym tooltips for product shorthand.

These should:

- appear above the acronym
- stay short and plain
- explain the acronym, not add marketing copy
- be used for real shorthand like `AI`, `API`, `CDN`, `RUM`, `PDF`, `SPA`, `AWS`

Do not turn normal product labels into tooltip bait. Tooltips are for reducing friction, not for decorating the UI.

## Surface Hierarchy

Metis mostly uses four visual levels:

1. page backdrop or overlay
2. shell background
3. card surface
4. elevated highlight surface

If two neighboring sections have the same importance, they should usually share the same level. If they blur together, increase contrast one step. If they feel too busy, reduce contrast one step.

## Spacing Rhythm

Metis works better when spacing is consistent than when it is dramatic.

- tight spacing for labels, pills, and metadata
- medium spacing for cards and grouped content
- larger spacing only for major section breaks

The main visual mistake to avoid is oversized hero spacing around very small amounts of information.

## Motion Rules

Motion should make state changes easier to follow.

Use motion for:

- launcher reveal
- panel entry and exit
- attached report expansion
- content refresh fades and small lift transitions
- row and card staging

Do not use motion for decoration that does not explain anything.

Metis uses:

- `motion/react` for structural animation
- `requestAnimationFrame` only for frame-based effects like score drawing
- no CSS keyframes as the main animation system

## Summary Rules

The top of Metis should always answer two questions:

1. how expensive or risky does this route look
2. does that heaviness seem justified

That means the summary system is:

- combined score first
- `Cost Risk` and `Control` directly underneath
- same summary language in the panel and the full report

The panel version should stay compact.
The full report version can add more reasoning, but it should still feel like the same component family.

## Panel Rules

The side panel should feel compact and confident.

It should prioritize:

1. combined score and split read
2. quick explanation
3. current cost footprint
4. top issues
5. stack context

If the panel starts reading like a full report, too much detail has leaked into it.

## Full Report Rules

The full report is where detail belongs, but it still should not feel bloated.

It should prioritize:

1. combined score and split read
2. current session cost and projection
3. problems
4. known stack
5. improve accuracy
6. simulation and recommendations

If a section is useful but not essential, it should appear lower instead of competing with the summary area.

## Copy Rules

Product copy should feel calm and specific.

- do not repeat labels in multiple tones
- do not bury the main meaning inside badge text
- prefer `Plus suggestion` as a tag over stuffing `Plus` into the sentence itself
- avoid harsh blame wording when the signal is contextual

Metis should sound like it is interpreting the page, not accusing the user.

## Design Authority

The current visual authority is:

- the figure components inside `src/app/components/figures`
- the extension-owned normalization rules in `src/styles/tailwind.css`
- the attached panel/report shell in `src/app/components/PhaseOneShell.tsx`

When design and logic are in tension, keep the logic but reshape the presentation to fit this system instead of inventing a one-off layout.

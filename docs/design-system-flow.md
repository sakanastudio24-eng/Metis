# Design System Flow

This is the visual system Metis is trying to stay inside while the product keeps evolving.

The short version: Metis should feel like one small app living on top of the page, not like a random widget borrowing styles from whatever site it landed on.

## What The System Is Trying To Protect

- a stable dark shell that does not drift across websites
- a score-first layout with clear visual hierarchy
- a compact panel and a wider report that still feel like the same product
- branded accents that help meaning, not just decoration
- readable typography at small sizes
- motion that explains transitions instead of showing off

## Typography

Metis uses two jobs for type, and the split should stay strict.

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

Metis should keep explicit pixel sizing inside the Shadow DOM so the host page cannot inflate or shrink the UI.

## Color Roles

The palette is small on purpose.

- dark navy backgrounds for the shell
- slightly lighter slate surfaces for cards
- warm red for brand and upgrade actions
- orange for watch or moderate-risk states
- green for healthy or live states
- yellow for lower-severity warnings
- brand tints for known stack chips when a provider is detected

These colors should carry meaning:

- red means action or premium emphasis
- orange means risk is building
- green means healthy or live
- neutral slate means structural UI, not semantic status

## Surface Hierarchy

Metis mostly uses four surface levels:

1. page backdrop / overlay
2. main shell background
3. card surface
4. elevated highlight surface

If two neighboring sections have the same importance, they should usually share the same surface level. If they feel merged together, increase contrast one step. If they feel too busy, reduce contrast one step.

## Spacing Rhythm

Metis works better when spacing is consistent than when it is dramatic.

- tight spacing for labels, pills, and metadata
- medium spacing for cards and grouped content
- larger spacing only for section breaks and major score areas

The main visual mistake to avoid is oversized hero spacing around small amounts of information.

## Motion Rules

Motion should make state changes easier to follow.

Use motion for:

- launcher reveal
- panel entry and exit
- fullscreen modal entry and exit
- content refresh fades and small lift transitions
- row and card staging

Do not use motion for decoration that does not explain anything.

Metis uses:

- `motion/react` for structural animation
- `requestAnimationFrame` only for frame-by-frame effects like score drawing
- no CSS keyframes as the main animation system

## Panel Rules

The side panel should feel compact and confident.

It should prioritize:

1. score
2. risk label
3. quick explanation
4. current cost footprint
5. top issues
6. stack context

If the panel starts reading like a report, too much has been pushed into it.

## Full Report Rules

The full report is where detail belongs, but it still should not feel bloated.

It should prioritize:

1. score and waste estimate
2. current session cost
3. problems
4. known stack
5. improve accuracy
6. simulation and recommendations

If a section is useful but not essential, it should appear lower in the report rather than compete with the score area.

## Design Authority

The current visual authority is:

- the zip-backed prototype implementation
- the figure components inside `src/app/components/figures`
- the extension-owned normalization rules in `src/styles/tailwind.css`

When design and logic are in tension, keep the logic but reshape the presentation to fit the system instead of inventing a new layout.

# Updates

This is the canonical release history for the Metis extension.

The entries below are reconstructed from git commit history because this repo does not currently use git tags.

The historical `0.0.0.x` line is preserved exactly as it happened. The new SemVer cutover starts at `0.1.0`.

Notes:

- There are no git tags in this repo right now.
- The earliest version bump still present in git history is `0.0.0.10`.
- There is no `0.0.0.71` version bump in the available history.

Release workflow from `0.1.0` onward:

- normal pre-ship product work uses minor releases
- patch releases are reserved for small fixes after a minor release
- feature and docs work land first
- the version bump stays in its own commit
- the updates entry lands in the same release prep pass

## 0.1.0

Release type: Minor

This release starts the minor-first pre-ship version line and adds a canonical updates history for the repo.

What changed

- Added this release history so product and docs changes are easy to trace from git.
- Documented the new version policy in the root docs.
- Cut over from the old `0.0.0.x` pattern to the new `0.1.x` line.

## 0.0.0.102

Release type: Patch

This release tightened fairness calibration so refinement changes the numbers more visibly and stops light routes from getting harsh framing.

What changed

- Strengthened context-aware fairness scoring.
- Added a light-route safeguard in the insight layer.
- Updated the flow notes for the new fairness guard.

Notable commits

- `9e89748` `fix(report): strengthen context-aware fairness calibration`
- `d7ec8ce` `docs(flow): clarify light-route fairness guard`

## 0.0.0.101

Release type: Patch

This release made page context a first-class fairness input in the report pipeline.

What changed

- Added page type and route-role fairness controls.
- Wired the new context into score, control, and insight logic.
- Added matching flow notes.

Notable commits

- `dcf6256` `feat(report): add context-aware fairness controls`
- `890badc` `docs(flow): add context fairness wording`

## 0.0.0.100

Release type: Patch

This release stabilized live session state and stopped the launcher badge from shifting around on noisy pages.

What changed

- Treated live scan updates as proof of an active session.
- Locked the launcher footprint so it stops shrinking and growing unexpectedly.

Notable commits

- `a41dec0` `fix(runtime): stabilize launcher and live session state`

## 0.0.0.99

Release type: Patch

This release replaced reconnect language with clearer close-and-reopen copy.

What changed

- Renamed the reconnect action to `Close and reopen`.
- Updated matching user-facing copy in the docs.

Notable commits

- `70251a5` `fix(ui): replace reconnect copy with close and reopen`
- `8a5836e` `docs(copy): align close and reopen wording`

## 0.0.0.98

Release type: Patch

This release polished Free and Plus report copy so the read feels cleaner and less repetitive.

What changed

- Removed repeated confidence helper phrasing.
- Tightened report labels, endpoint wording, and export copy.

Notable commits

- `915f84f` `fix(report): polish free and plus report copy`
- `bc8a99c` `docs(copy): tighten report and export wording`

## 0.0.0.97

Release type: Patch

This release gave Metis+ deeper report and export content instead of looking like the same report with a badge.

What changed

- Added stronger Plus-only breakdown and endpoint detail.
- Closed the fullscreen report before opening export.
- Updated Plus export wording.

Notable commits

- `91dca08` `feat(report): deepen plus report and export flow`
- `d955603` `docs(copy): update plus export copy`

## 0.0.0.96

Release type: Patch

This release unified the base truth used by Free and Plus reports.

What changed

- Locked Free and Plus to the same score direction and cost story.
- Made Plus additive instead of letting it replace the base read.
- Updated report wording and flow notes.

Notable commits

- `bc19621` `feat(report): unify base and plus report truth`
- `e002894` `docs(copy): tighten report wording and flow`

## 0.0.0.95

Release type: Patch

This release changed Upgrade so it opens the fullscreen upgraded report directly.

What changed

- Opened the upgraded DOM report from the Upgrade action.
- Added a visible `Metis+` badge in upgraded UI surfaces.

Notable commits

- `47989b8` `feat(ui): open upgraded full report from plus action`

## 0.0.0.94

Release type: Patch

This release made Upgrade open a local Plus preview from inside the extension.

What changed

- Added a local Plus preview state for the current session.
- Opened the page report in Plus preview mode from the Upgrade action.

Notable commits

- `15da908` `feat(ui): open local plus preview from upgrade`

## 0.0.0.93

Release type: Patch

This release added the confidence layer to the Metis report.

What changed

- Added deterministic `Low`, `Moderate`, and `High` confidence reads.
- Surfaced confidence in the report and copy docs.

Notable commits

- `7e6275c` `feat(confidence): add scan confidence assessment`
- `25f3f2f` `docs(copy): add confidence to report and copy docs`

## 0.0.0.92

Release type: Patch

This release moved Upgrade into the account menu and cleaned up the main runtime copy and docs.

What changed

- Moved the upgrade entry into the account menu.
- Centralized product links and tightened runtime copy.
- Refreshed the main docs and master copy.

Notable commits

- `ff8500c` `feat(ui): move upgrade into account menu`
- `8f5fa57` `chore(code): centralize links and tidy runtime copy`
- `2839158` `docs(copy): refresh core docs and master copy`

## 0.0.0.91

Release type: Patch

This release removed the leftover local Plus entitlement flow and committed the alignment packet.

What changed

- Removed stale local Plus entitlement code.
- Committed the repo alignment packet and supporting flow notes.

Notable commits

- `f6fe2a0` `fix(alignment): remove local plus entitlement flow`
- `c0e892d` `docs(flow): commit repo alignment packet`

## 0.0.0.90

Release type: Patch

This release removed the old agency-style fix-for-me button from the UI.

What changed

- Removed the dead agency CTA and its leftover wiring.

Notable commits

- `6147369` `fix(ui): remove agency fix-for-me button`

## 0.0.0.89

Release type: Patch

This release made the master copy document label header, subheader, and body roles explicitly.

What changed

- Structured the copy reference by role instead of only by raw strings.

Notable commits

- `813f71a` `docs(copy): label header and body roles in master copy`

## 0.0.0.88

Release type: Patch

This release clarified that descriptive product copy should explicitly say `Metis extension`.

What changed

- Updated the copy guide to include the extension identity in descriptive language.

Notable commits

- `35d37a4` `docs(copy): clarify metis extension naming`

## 0.0.0.87

Release type: Patch

This release added internal legal pages and a single master copy reference.

What changed

- Added Terms and Privacy pages inside the extension.
- Added the first master copy document.

Notable commits

- `d5d31fc` `feat(legal): add internal terms and privacy pages`
- `d65ffd1` `docs(copy): add master copy reference`

## 0.0.0.86

Release type: Patch

This release expanded the AI context note with operating rules for future work.

What changed

- Added working rules for git segmentation, docs, env handling, and security posture.

Notable commits

- `92629fe` `docs(flow): expand ai context operating rules`

## 0.0.0.85

Release type: Patch

This release added a root AI context note for faster repo orientation.

What changed

- Added `AI.md` as a short repo context note for agents and code helpers.

Notable commits

- `4b1adf0` `docs(flow): add root ai context note`

## 0.0.0.84

Release type: Patch

This release removed the remaining visual test fixture files.

What changed

- Deleted the last tracked visual fixture assets.
- Cleaned up the README so it no longer points at those fixtures.

Notable commits

- `fbc2682` `chore(cleanup): remove visual test fixtures`

## 0.0.0.83

Release type: Patch

This release moved the Metis+ overlay back into the page DOM.

What changed

- Opened the Plus overlay from the page bridge instead of the side panel.
- Kept Plus unlock state shared through the tab session.

Notable commits

- `2612dae` `feat(runtime): open Metis+ overlay in page dom`

## 0.0.0.82

Release type: Patch

This release aligned the manifest with the toolbar settings flow.

What changed

- Removed unused permission and dead toolbar activation wiring.
- Updated the docs so the toolbar icon is clearly for settings.

Notable commits

- `9d1dba6` `fix(manifest): align permissions with toolbar settings flow`

## 0.0.0.81

Release type: Patch

This release removed assumption controls from settings so those inputs stay in questions, not hidden config.

What changed

- Removed hosting and traffic assumption controls from the popup.
- Updated report logic and docs to keep that context in questions.

Notable commits

- `3822c9b` `fix(settings): remove assumption controls from popup`

## 0.0.0.80

Release type: Patch

This release moved settings into the toolbar popup instead of a separate options page.

What changed

- Added a real action popup for settings.
- Wired the side panel settings entry into the toolbar popup flow.

Notable commits

- `0c67dc2` `feat(settings): move settings into toolbar popup`

## 0.0.0.79

Release type: Patch

This release added the first browser-native settings page.

What changed

- Added an extension settings surface for scan behavior, cleanup, and trust copy.

Notable commits

- `c19b451` `feat(settings): add browser-native options page`

## 0.0.0.78

Release type: Patch

This release removed the local visual fixture scaffolding.

What changed

- Deleted the local visual test site and its fixture server.

Notable commits

- `20cdd8a` `chore(cleanup): remove local visual fixture scaffolding`

## 0.0.0.77

Release type: Patch

This release cleaned out dead panel code and stale runtime state.

What changed

- Removed old shell components and dead state helpers.
- Scrubbed stale doc references to the removed runtime pieces.

Notable commits

- `e6f318e` `chore(code): remove dead panel shells and stale runtime state`
- `4fdca6f` `docs(flow): remove legacy shell and archive references`

## 0.0.0.76

Release type: Patch

This release moved the fullscreen report back into the page DOM while keeping the side panel compact.

What changed

- Opened the full report as a page overlay again.
- Clarified the split between the compact side panel and the DOM report.

Notable commits

- `d79663f` `feat(runtime): move full report back to page overlay`
- `73d074d` `docs(flow): clarify compact side panel and page report split`

## 0.0.0.75

Release type: Patch

This release aligned live UI surfaces with the design system palette.

What changed

- Updated report and settings colors to the documented palette.
- Expanded the design-system doc with clearer token rules.

Notable commits

- `8326e86` `docs(flow): expand design system tokens and rules`
- `88c38f1` `fix(ui): align live surfaces with design system palette`

## 0.0.0.74

Release type: Patch

This release restored the launcher when the side panel disconnects.

What changed

- Used side panel disconnect as the real signal that the launcher should return.

Notable commits

- `2031a7a` `fix(runtime): restore launcher when side panel disconnects`

## 0.0.0.73

Release type: Patch

This release animated the launcher around side panel visibility.

What changed

- Added hide and return animations tied to panel open and close state.

Notable commits

- `5ac14f7` `fix(runtime): animate launcher around side panel visibility`

## 0.0.0.72

Release type: Patch

This release repaired the content build and restored the Metis mark in the launcher.

What changed

- Bundled the content bridge as a classic script.
- Replaced the arrow launcher with the `M` mark and hid it while active.

Notable commits

- `4136221` `fix(build): bundle content bridge as classic script`
- `e0247c1` `fix(content): restore metis mark and hide launcher while active`

## 0.0.0.70

Release type: Patch

This release restored the hover bridge on already-open tabs after extension reloads.

What changed

- Primed eligible open tabs so the hover comes back without waiting for a manual page refresh.

Notable commits

- `c0efa3c` `fix(runtime): restore hover bridge on existing tabs`

## 0.0.0.69

Release type: Patch

This release moved Metis to the side panel runtime model.

What changed

- Added a side panel session coordinator.
- Shrunk the page UI into a lightweight hover bridge.
- Moved the main Metis shell into the Chrome side panel.
- Added tests and flow docs for the new runtime split.

Notable commits

- `96353d2` `feat(runtime): add side panel session coordinator`
- `0731816` `feat(content): shrink injected ui to hover bridge`
- `2fb3816` `feat(sidepanel): move metis shell into chrome side panel`

## 0.0.0.68

Release type: Patch

This release refreshed the design-system reference and switched summary badges to icon-only status chips.

What changed

- Updated the design system reference.
- Reworked summary badges into icon-only chips.

Notable commits

- `fc4a2ad` `docs(flow): refresh design system reference`
- `47f93e9` `fix(ui): switch summary badges to icon-only status chips`

## 0.0.0.67

Release type: Patch

This release restyled summary badges and changed Plus copy from a partial read to a suggestion.

What changed

- Tightened summary badge styling.
- Reframed partial Plus copy into a clearer suggestion.

Notable commits

- `31606ed` `fix(ui): restyle summary badges and remove report x-scroll`
- `41c7212` `fix(copy): replace partial plus read with plus suggestion`

## 0.0.0.66

Release type: Patch

This release skipped refinement questions that scan context had already answered and cleaned up report savings wording.

What changed

- Reduced unnecessary refinement questions.
- Clarified scope and aligned savings totals in the report.

Notable commits

- `ed9cc2d` `fix(refinement): skip questions resolved by scan context`
- `704a7c0` `fix(report): clarify scope and align savings totals`

## 0.0.0.65

Release type: Patch

This release added acronym hover tooltips to the UI.

What changed

- Surfaced acronym help directly in the interface.

Notable commits

- `670d0a5` `feat(ui): add acronym hover tooltips`

## 0.0.0.64

Release type: Patch

This release centered the attached full report sheet.

What changed

- Cleaned up the full report layout so the sheet sits correctly in the viewport.

Notable commits

- `7c0c2ed` `fix(layout): center attached full report sheet`

## 0.0.0.63

Release type: Patch

This release restored the combined score ring and breakdown.

What changed

- Brought back the combined score ring while keeping the split summary structure.

Notable commits

- `abff9a3` `feat(ui): restore combined score ring and breakdown`

## 0.0.0.62

Release type: Patch

This release added the split cost-risk and control summary, plus the attached report, export shell, and local settings.

What changed

- Added the split summary model.
- Added the attached report shell, export shell, and settings.
- Added tests and flow docs for the new surfaces.

Notable commits

- `e2ed4ba` `feat(ui): add split cost-risk and control summary`
- `082deca` `feat(shell): add attached report, export shell, and local settings`

## 0.0.0.61

Release type: Patch

This release made sample progress reflect the current site in single mode.

What changed

- Fixed sample progress UI to stay scoped to the current site.

Notable commits

- `9639dc6` `fix(ui): reflect current-site sample progress in single mode`

## 0.0.0.60

Release type: Patch

This release cleaned up the logic test naming.

What changed

- Renamed the core logic suite and runner for consistency.

Notable commits

- `ce033a2` `chore(test): rename core logic suite for consistency`
- `e810a1c` `chore(test): update logic runner naming`

## 0.0.0.59

Release type: Patch

This release kept sampled page count scoped to the current scan.

What changed

- Fixed sampled page count so it reflects the active scan scope instead of a broader history.

Notable commits

- `8944490` `fix(ui): keep sampled page count scoped to current scan`

## 0.0.0.58

Release type: Patch

This release restored the always-visible launcher permission model.

What changed

- Brought back the launcher on normal pages.
- Updated runtime docs to match the launcher-first flow.

Notable commits

- `d8f29f1` `feat(runtime): restore always-visible launcher permissions`
- `99c3862` `docs(runtime): update launcher-first permission flow`

## 0.0.0.57

Release type: Patch

This release added the control assessment layer.

What changed

- Added the core control logic.
- Softened contextual cost copy.
- Surfaced control in the panel and report.

Notable commits

- `d965140` `feat(control): add control assessment layer`
- `d5cc9d7` `feat(ui): surface control in panel and report`

## 0.0.0.56

Release type: Patch

This release flattened the launcher hover tooltip.

What changed

- Simplified the launcher tooltip so it stays cleaner on page.

Notable commits

- `45de3f6` `fix(ui): flatten launcher hover tooltip`

## 0.0.0.55

Release type: Patch

This release clarified the launcher-first injection flow.

What changed

- Injected the launcher without opening the panel automatically.
- Documented the updated launcher-first runtime.

Notable commits

- `1541318` `fix(runtime): inject launcher without opening the panel`
- `def5401` `docs(runtime): clarify launcher-first injection flow`

## 0.0.0.54

Release type: Patch

This release switched beta injection to an action-triggered scan model.

What changed

- Moved scanning to a trust-first action trigger.
- Added docs for the new permission model.

Notable commits

- `fd48371` `feat(runtime): switch beta injection to action-triggered scan`
- `4245bb8` `docs(runtime): explain trust-first beta permission model`

## 0.0.0.53

Release type: Patch

This release widened the side panel and kept sampled pages on one line.

What changed

- Rebalanced the side panel layout for readability.

Notable commits

- `6ff631b` `fix(ui): widen side panel and keep sampled pages on one line`

## 0.0.0.52

Release type: Patch

This release added a repo flow overview and tightened project docs.

What changed

- Added the main flow overview doc.
- Added code notes to the live analysis path.

Notable commits

- `7c5d19c` `docs(flow): add flow overview and tighten project docs`
- `828111b` `chore(code): add notes to live analysis path`

## 0.0.0.51

Release type: Patch

This release added the provider-aware pricing reference layer and normalized stack evidence registry.

What changed

- Added normalized evidence and fingerprint-based stack resolution.
- Added pricing references and report copy that uses pricing context.
- Added tests and pricing docs.

Notable commits

- `c2623fe` `feat(stack): add normalized evidence registry`
- `8e1f3b0` `feat(pricing): add provider pricing reference layer`
- `0064562` `feat(report): use pricing context in estimates and copy`

## 0.0.0.50

Release type: Patch

This release replaced the capture action with saved state and improved refinement flow.

What changed

- Swapped capture actions for saved-state behavior.
- Added a question back step and related tests.
- Added refinement autosave and copy-review docs.

Notable commits

- `52b6487` `fix(ui): replace capture action with saved state and add question back step`
- `673879b` `docs(refinement): add copy review sheet and autosave flow`

## 0.0.0.49

Release type: Patch

This release carried saved page count into the UI and refreshed supporting assets.

What changed

- Fixed saved page counts across pages.
- Updated archived design assets and temporary test output.

Notable commits

- `822646a` `fix(capture): carry saved page count into the UI`
- `6af7ce6` `test(capture): cover saved page count across pages`

## 0.0.0.48

Release type: Patch

This release documented the capture-save flow and capture storage behavior.

What changed

- Added flow docs for capture save behavior.
- Added code notes for capture storage.

Notable commits

- `7e57a95` `docs(flow): add capture save flow and keep one project readme`
- `5ef5cc3` `chore(code): document capture storage behavior`

## 0.0.0.47

Release type: Patch

This release kept the latest captured page across routes.

What changed

- Preserved the latest captured snapshot for cross-route use.
- Added tests for the snapshot flow.

Notable commits

- `58e5b53` `feat(storage): keep latest captured page across routes`
- `1c169a8` `test(storage): cover latest captured snapshot flow`

## 0.0.0.46

Release type: Patch

This release delayed scans until the panel opens.

What changed

- Tightened runtime behavior so scans wait for an intentional open action.

Notable commits

- `731dcdf` `fix(runtime): delay scans until the panel opens`

## 0.0.0.45

Release type: Patch

This release classified direct AWS hosts without scoring them as faults.

What changed

- Improved infrastructure context while keeping scoring fair.

Notable commits

- `00548b3` `feat(stack): classify direct AWS hosts without scoring them`

## 0.0.0.44

Release type: Patch

This release added clarifying notes across the phase four code path.

What changed

- Added code notes to make the logic path easier to maintain.

Notable commits

- `91f4cd8` `chore(code): add clarifying notes across phase 4 modules`

## 0.0.0.43

Release type: Patch

This release improved money-stack vendor detection.

What changed

- Expanded and tuned vendor detection for cost-related stack signals.

Notable commits

- `eb832df` `feat(stack): improve money-stack vendor detection`

## 0.0.0.42

Release type: Patch

This release added design-system and humanized-scan guides.

What changed

- Added flow notes for design-system rules and more humanized scan reads.

Notable commits

- `5814216` `docs(flow): add design system and humanized scan guides`

## 0.0.0.41

Release type: Patch

This release moved live status into the profile area and added capture controls.

What changed

- Cleaned up the UI chrome around live status and capture actions.

Notable commits

- `a236500` `fix(ui): move live status into profile and add capture controls`

## 0.0.0.40

Release type: Patch

This release added money-stack signal collection and cost issue wiring.

What changed

- Added signal collection for money-related stack vendors.
- Wired that detection into report scoring and tests.

Notable commits

- `f8e33f9` `feat(stack): add money-stack signal collection and detection`
- `f239f61` `feat(score): add money-stack cost issues and report wiring`

## 0.0.0.39

Release type: Patch

This release added raw stack hints and clarified Free versus Plus account chrome.

What changed

- Added raw stack hints for known stack detection.
- Cleaned up account chrome wording in the UI.

Notable commits

- `b15f699` `feat(stack): add raw stack hints for known stack detection`
- `ba50c81` `fix(ui): clarify free and plus account chrome`

## 0.0.0.38

Release type: Patch

This release allowed host-page scrolling while the side panel stays open.

What changed

- Fixed the page scroll lock behavior.

Notable commits

- `03cb38e` `fix(ui): allow host scrolling while side panel is open`

## 0.0.0.37

Release type: Patch

This release added normalized page-scan snapshot history.

What changed

- Stored normalized page snapshots across routes.
- Added tests for page-scan comparison.

Notable commits

- `f0df963` `feat(storage): add normalized page scan snapshot history`
- `376df21` `test(storage): cover normalized page scan comparison`

## 0.0.0.36

Release type: Patch

This release locked page scroll behind Metis surfaces.

What changed

- Tightened page scroll handling while extension surfaces are open.

Notable commits

- `8bad2b3` `fix(ui): lock page scroll behind metis surfaces`

## 0.0.0.35

Release type: Patch

This release showed the Plus tag after upgrade.

What changed

- Made upgrade state visible in the UI chrome.

Notable commits

- `c0e3091` `fix(ui): show plus tag after upgrade`

## 0.0.0.34

Release type: Patch

This release returned the fullscreen report after the Plus overlay closes.

What changed

- Fixed the fullscreen report flow after leaving the Plus overlay.

Notable commits

- `ce8ff72` `fix(ui): return fullscreen report after plus overlay closes`

## 0.0.0.33

Release type: Patch

This release aligned dashboard sections and tightened report copy.

What changed

- Improved layout consistency and report wording.

Notable commits

- `578b38e` `fix(ui): align dashboard sections and report copy`

## 0.0.0.32

Release type: Patch

This release added stack fallback questions and richer report sections.

What changed

- Added fallback stack questions and adapter metadata.
- Refined launcher and mini-panel hierarchy.
- Added scale simulation and fix recommendation sections.

Notable commits

- `bc48804` `feat(refinement): add stack fallback questions and adapter metadata`
- `552c9a3` `feat(report): add scale simulation and fix recommendation sections`

## 0.0.0.31

Release type: Patch

This release restored the prototype shell flow and chrome.

What changed

- Recentered the live UI around the prototype shell.

Notable commits

- `4eeaea0` `feat(ui): restore prototype shell flow and chrome`

## 0.0.0.30

Release type: Patch

This release added motion-driven shell polish and toast feedback.

What changed

- Introduced more polished motion and action feedback in the UI.

Notable commits

- `99f9834` `feat(ui): add motion-driven shell polish and toast feedback`

## 0.0.0.29

Release type: Patch

This release simplified the panel flow and tightened dashboard layout.

What changed

- Streamlined the panel flow and reduced layout noise.

Notable commits

- `65dd409` `fix(ui): simplify panel flow and tighten dashboard layout`

## 0.0.0.28

Release type: Patch

This release widened the report modal and hardened the normalization layer.

What changed

- Rebalanced the desktop report layout.
- Hardened extension normalization against host quirks.

Notable commits

- `8a63dcf` `fix(ui): widen report modal and rebalance desktop layout`
- `65f3838` `fix(ui): harden extension normalization layer`

## 0.0.0.27

Release type: Patch

This release rebuilt the live shell around the zipped design primitives and refreshed the related docs and fixture coverage.

What changed

- Rebuilt the live shell around the archived design primitives.
- Fixed JSX comment issues and refreshed the visual fixture.
- Added updated documentation for the new design authority.

Notable commits

- `2c6a4fb` `feat(ui): rebuild live shell around zip design primitives`
- `0c56c9c` `fix(ui): correct malformed JSX comments in PanelLayout`

## 0.0.0.26

Release type: Patch

This release built Figma-aligned panel and report components.

What changed

- Added Figma-aligned panel and report components.
- Added a design test fixture with mock data.

Notable commits

- `bede854` `feat(ui): build figma-aligned panel and report components`
- `3d24681` `docs(visual-test): add figma design test fixture with mock data`

## 0.0.0.25

Release type: Patch

This release normalized typography and aligned the live shell to the prototype.

What changed

- Tightened the live shell typography and prototype alignment.

Notable commits

- `d837e12` `feat(ui): normalize typography and align live shell to prototype`

## 0.0.0.24

Release type: Patch

This release aligned report hierarchy with the Figma prototype.

What changed

- Reworked the report hierarchy to match the prototype more closely.

Notable commits

- `4b2debe` `feat(ui): align report hierarchy with figma prototype`

## 0.0.0.23

Release type: Patch

This release matched the full report layout to the archived prototype.

What changed

- Updated the full report layout to align with the archived design model.

Notable commits

- `ce4511c` `feat(ui): match full report layout to archived prototype`

## 0.0.0.22

Release type: Patch

This release typed refinement question impacts and normalized answer keys.

What changed

- Added typed impacts and normalized answer handling.
- Added tests and docs for refinement dependencies.

Notable commits

- `c34742d` `feat(refinement): type question impacts and normalize answer keys`
- `7ce2690` `docs(refinement): document typed impacts and question dependencies`

## 0.0.0.21

Release type: Patch

This release polished the full dashboard and guided refinement flow.

What changed

- Improved the dashboard and guided refinement experience.
- Updated the UI flow docs to match.

Notable commits

- `a5d38fb` `feat(ui): polish full dashboard and guided refinement flow`
- `bfeae52` `docs(ui): update guided refinement and dashboard flow`

## 0.0.0.20

Release type: Patch

This release documented question impact and refinement config.

What changed

- Added docs for how refinement questions affect the read.

Notable commits

- `3b622d8` `docs(plus): explain question impact and config`

## 0.0.0.19

Release type: Patch

This release added the refinement question layer.

What changed

- Added the first Plus-oriented refinement question layer.
- Added tests for the refinement logic and flow.

Notable commits

- `c83817d` `feat(plus): add refinement question layer`
- `5f828b0` `test(plus): cover refinement logic and flow`

## 0.0.0.18

Release type: Patch

This release made the phase-four logic deterministic and testable.

What changed

- Added deterministic logic coverage.
- Marked the phase-four logic path as complete and testable in docs.

Notable commits

- `444101b` `test(phase-4): add deterministic logic coverage`
- `b3a6443` `docs(phase-4): mark logic complete and testable`

## 0.0.0.17

Release type: Patch

This release added scan hardening and the first insight engine.

What changed

- Hardened scan collection.
- Added the early insight engine and its runtime docs.

Notable commits

- `056b687` `feat(phase-4): add scan hardening and insight engine`
- `aa3632c` `docs(phase-4): document runtime and insight flows`

## 0.0.0.16

Release type: Patch

This release added normalized-signal and phase-four planning docs.

What changed

- Added docs for normalized signal flow.
- Added the phase-four research and implementation plan.

Notable commits

- `0de8c57` `docs(normalization): add normalized signal flow`
- `81334a1` `docs(phase-4): add research and implementation plan`

## 0.0.0.15

Release type: Patch

This release pinned launcher sizing in pixels.

What changed

- Fixed launcher sizing so it stays stable on host pages.

Notable commits

- `1ace9d1` `fix(ui): pin launcher sizing in pixels`

## 0.0.0.14

Release type: Patch

This release hardened shadow-host isolation.

What changed

- Improved shadow DOM isolation from host page styles.
- Added a runtime note for the isolation rules.

Notable commits

- `1e92d09` `fix(ui): harden shadow host isolation`
- `68ced95` `docs(runtime): note host isolation rules`

## 0.0.0.13

Release type: Patch

This release pinned the extension typography scale.

What changed

- Stabilized typography sizing inside the extension surfaces.

Notable commits

- `0c1004d` `fix(ui): pin extension typography scale`

## 0.0.0.12

Release type: Patch

This release standardized runtime notes and refreshed panel and scoring references.

What changed

- Added clearer runtime code notes.
- Refreshed the panel and scoring docs.

Notable commits

- `b05cc73` `chore(code): standardize runtime file notes`
- `73f78cf` `docs(flows): refresh panel and scoring references`

## 0.0.0.11

Release type: Patch

This release hardened the early panel experience and externalized scoring thresholds.

What changed

- Restored the open click path for the panel.
- Moved weighted scoring thresholds into config.
- Normalized host sizing across sites.

Notable commits

- `b609557` `fix(panel): restore open click handling`
- `4459a08` `feat(scoring): externalize thresholds and weighted config`
- `e681236` `fix(ui): normalize host sizing across sites`

## 0.0.0.10

Release type: Patch

This is the earliest historical version bump still present in the repo. It sits on top of the score-first panel groundwork from the phase-two and phase-three buildout.

What changed

- Shipped the score-first panel experience.
- Hardened host events and stale snapshot reads.
- Landed the first detection and scoring engine in the available history window.

Notable commits

- `06ffa46` `feat(phase-3): ship score-first panel experience`
- `6c16014` `fix(panel): harden host events and stale snapshot reads`
- `fdc636b` `feat(phase-3): add detection and scoring engine`

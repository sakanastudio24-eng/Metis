# Metis Extension Design System Logic

This document defines the extension-side design logic that should stay stable through the final production pass.

## Design goal

Metis should feel precise, calm, and technical without looking generic or overloaded. The extension should read like a focused instrument, not a marketing surface.

## Surface roles

- popup: fast controls, launch points, and compact status
- side panel: steady workspace for the current page session
- page report: immersive long-form read and export entry
- injected `M`: minimal entry point that should feel native to the rest of the system

Each surface has a different density target, but they should still feel like the same product.

## Core visual logic

- keep the side panel narrow, steady, and readable
- reserve the fullscreen report for deeper explanation, not the side panel
- use strong contrast and clear spacing before adding more ornament
- let motion explain state changes, not decorate them
- use red as a meaningful accent, not a constant wash

## Token and component rules

- one token change should affect popup, side panel, and report consistently when the meaning is shared
- shared buttons, chips, badges, dividers, and callout styles should not fork per surface without a reason
- severity, warning, success, and neutral states should map to stable colors and labels
- typography hierarchy should stay consistent across scan summary, issue detail, score blocks, and export surfaces

## Plus and account logic

- website-managed account state should not be faked visually inside the extension
- Plus Beta cues can exist, but they should read like gated product access, not a local billing system
- the Plus red treatment should mean access state or gated pathway, not a pretend purchase confirmation

## Production pass checklist

- popup, side panel, page report, and injected `M` all feel related
- spacing, typography, and badge logic are consistent across surfaces
- no leftover mock-account visual language remains
- export output inherits the same hierarchy and tone as the live report
- reconnect, saved history, and multipage states look intentional, not bolted on

# Metis

Chrome Extension Manifest V3 scaffold for the Metis v1 roadmap.

## Stack

- React
- TypeScript
- Tailwind CSS
- Vite
- Chrome Extension Manifest V3

## Current Scope

This repo is intentionally prepared, not implemented. The extension runtime and project architecture are in place, but the roadmap layers stay unbuilt for now:

- Page scanning
- Detection
- Scoring
- Insight generation
- Refine estimate inputs

## Commands

```bash
pnpm install
pnpm build
pnpm dev
pnpm visual:test:extension
pnpm visual:test
```

`pnpm dev` runs Vite in watch mode so the `dist/` folder updates as you work.

## Load In Chrome

1. Run `pnpm build`
2. Open `chrome://extensions`
3. Turn on Developer Mode
4. Click Load Unpacked
5. Select `dist/`

## Architecture

See [docs/architecture.md](/Users/zech/Downloads/The-Big-One/Metis/docs/architecture.md).

## Visual Testing

See [docs/visual-testing.md](/Users/zech/Downloads/The-Big-One/Metis/docs/visual-testing.md).

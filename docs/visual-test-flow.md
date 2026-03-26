# Visual Test Flow

Use the local fixture pages to validate the injected UI before testing on arbitrary sites.

## Commands

```bash
pnpm visual:test
pnpm build
```

## Loop

1. Run `pnpm build`
2. Reload the unpacked `dist/` extension in `chrome://extensions`
3. Open a local fixture page
4. Refresh the page
5. Check launcher, mini panel, floating full panel, centered report modal, overlap, and scroll behavior
6. Compare against the live design system and current runtime surfaces rather than removed legacy shells

## Pages

- `http://127.0.0.1:4173/`
- `http://127.0.0.1:4173/sites/marketing/`
- `http://127.0.0.1:4173/sites/dashboard/`
- `http://127.0.0.1:4173/sites/media-heavy/`
- `http://127.0.0.1:4173/sites/figma-design/`

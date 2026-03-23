# Visual Testing

Use the local fixtures in `visual-test/` to validate the injected Metis UI against stable page layouts.

## Commands

```bash
pnpm visual:test:extension
pnpm visual:test
```

- `pnpm visual:test:extension` rebuilds the Chrome extension into `dist/`
- `pnpm visual:test` serves the local fixtures at `http://127.0.0.1:4173`

## Pages

- `http://127.0.0.1:4173/`
- `http://127.0.0.1:4173/sites/marketing/`
- `http://127.0.0.1:4173/sites/dashboard/`
- `http://127.0.0.1:4173/sites/media-heavy/`

## Chrome Loop

1. Run `pnpm visual:test:extension`
2. Open `chrome://extensions`
3. Reload the unpacked `dist/` extension
4. Open one of the local fixture pages
5. Refresh the page
6. Check:
   - idle button position
   - panel overlap
   - contrast on bright and dark surfaces
   - mobile width behavior
   - scroll behavior on long pages

## Notes

- These fixtures are intentionally static so screenshot comparisons stay stable.
- They are layout fixtures, not scanning fixtures.
- Chrome blocks content scripts on `chrome://` pages, so use the localhost pages above.

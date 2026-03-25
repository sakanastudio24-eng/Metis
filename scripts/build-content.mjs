import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import tailwindcss from "tailwindcss";

const require = createRequire(import.meta.url);
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const contentEntry = join(rootDir, "src/content/index.tsx");
const contentOutfile = join(rootDir, "dist/assets/content.js");
const cssPath = join(rootDir, "src/styles/tailwind.css");
const viteEntry = require.resolve("vite");
const esbuildEntry = require.resolve("esbuild", {
  paths: [dirname(viteEntry)]
});
const { build } = await import(pathToFileURL(esbuildEntry).href);

async function compileInlineCss() {
  const source = await readFile(cssPath, "utf8");
  const result = await postcss([tailwindcss(), autoprefixer()]).process(source, {
    from: cssPath
  });

  return result.css;
}

const inlineCss = await compileInlineCss();

await build({
  entryPoints: [contentEntry],
  outfile: contentOutfile,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["chrome114"],
  sourcemap: true,
  jsx: "automatic",
  plugins: [
    {
      name: "metis-inline-tailwind-css",
      setup(esbuild) {
        esbuild.onResolve({ filter: /tailwind\.css\?inline$/ }, () => ({
          path: "metis-inline-tailwind.css",
          namespace: "metis-inline-css"
        }));

        esbuild.onLoad(
          { filter: /.*/, namespace: "metis-inline-css" },
          () => ({
            contents: `export default ${JSON.stringify(inlineCss)};`,
            loader: "js"
          })
        );
      }
    }
  ]
});

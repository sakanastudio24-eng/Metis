import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const backgroundEntry = fileURLToPath(
  new URL("./src/background/index.ts", import.meta.url)
);
const manifestPath = fileURLToPath(new URL("./manifest.json", import.meta.url));
const distManifestPath = fileURLToPath(new URL("./dist/manifest.json", import.meta.url));
const popupEntry = fileURLToPath(new URL("./popup.html", import.meta.url));
const sidePanelEntry = fileURLToPath(new URL("./sidepanel.html", import.meta.url));
const privacyEntry = fileURLToPath(new URL("./privacy.html", import.meta.url));
const termsEntry = fileURLToPath(new URL("./terms.html", import.meta.url));
const LOCALHOST_BRIDGE_MATCH = "http://localhost:3000/*";

function manifestBridgePlugin(mode: string) {
  return {
    name: "metis-manifest-bridge",
    async writeBundle() {
      const manifest = JSON.parse(
        await readFile(manifestPath, "utf8")
      ) as {
        externally_connectable?: {
          matches?: string[];
        };
      };

      if (mode !== "development" && manifest.externally_connectable?.matches) {
        manifest.externally_connectable.matches =
          manifest.externally_connectable.matches.filter(
            (pattern) => pattern !== LOCALHOST_BRIDGE_MATCH
          );
      }

      await writeFile(distManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    }
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [{ src: "icons/*.png", dest: "icons" }]
    }),
    manifestBridgePlugin(mode)
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        background: backgroundEntry,
        popup: popupEntry,
        sidepanel: sidePanelEntry,
        privacy: privacyEntry,
        terms: termsEntry
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/chunks/[name]-[hash].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  }
}));

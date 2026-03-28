import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const backgroundEntry = fileURLToPath(
  new URL("./src/background/index.ts", import.meta.url)
);
const popupEntry = fileURLToPath(new URL("./popup.html", import.meta.url));
const sidePanelEntry = fileURLToPath(new URL("./sidepanel.html", import.meta.url));
const privacyEntry = fileURLToPath(new URL("./privacy.html", import.meta.url));
const termsEntry = fileURLToPath(new URL("./terms.html", import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "manifest.json", dest: "." },
        { src: "icons/*.png", dest: "icons" }
      ]
    })
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
});

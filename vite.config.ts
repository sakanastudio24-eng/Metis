import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const backgroundEntry = fileURLToPath(
  new URL("./src/background/index.ts", import.meta.url)
);
const optionsEntry = fileURLToPath(new URL("./options.html", import.meta.url));
const sidePanelEntry = fileURLToPath(new URL("./sidepanel.html", import.meta.url));

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
        options: optionsEntry,
        sidepanel: sidePanelEntry
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/chunks/[name]-[hash].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  }
});

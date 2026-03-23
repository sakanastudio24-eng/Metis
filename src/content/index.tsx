import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../app/App";
import styles from "../styles/tailwind.css?inline";

const HOST_ID = "metis-extension-host";

function createHost() {
  const existingHost = document.getElementById(HOST_ID);

  if (existingHost) {
    return existingHost.shadowRoot;
  }

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.all = "initial";
  host.style.position = "relative";
  host.style.zIndex = "2147483647";

  const shadowRoot = host.attachShadow({ mode: "open" });
  const styleTag = document.createElement("style");
  const appRoot = document.createElement("div");

  styleTag.textContent = styles;
  appRoot.id = "metis-react-root";

  shadowRoot.append(styleTag, appRoot);
  (document.body ?? document.documentElement).appendChild(host);

  return shadowRoot;
}

function mount() {
  const shadowRoot = createHost();

  if (!shadowRoot) {
    return;
  }

  const appRoot = shadowRoot.getElementById("metis-react-root");

  if (!appRoot) {
    return;
  }

  console.info("[Metis] content script loaded");

  createRoot(appRoot).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}

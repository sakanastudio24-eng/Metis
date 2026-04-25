// content/index.tsx mounts only the lightweight page bridge into a Shadow DOM.
// The main Metis workspace now lives in Chrome's side panel, while the page
// layer stays small: hover, scan trigger, route awareness, and messaging.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PageBridgeApp } from "./PageBridgeApp";
import styles from "../styles/tailwind.css?inline";

const HOST_ID = "metis-extension-host";

function hasExtensionRuntime() {
  try {
    const runtime = (globalThis as typeof globalThis & {
      chrome?: {
        runtime?: {
          id?: string;
          onMessage?: { addListener?: unknown };
        };
      };
    }).chrome?.runtime;

    return Boolean(
      runtime?.id &&
      runtime.onMessage &&
      typeof runtime.onMessage.addListener === "function"
    );
  } catch {
    return false;
  }
}

function createHost() {
  const existingHost = document.getElementById(HOST_ID);

  if (existingHost) {
    return existingHost.shadowRoot;
  }

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.all = "initial";
  host.style.position = "fixed";
  host.style.inset = "0";
  host.style.width = "0";
  host.style.height = "0";
  host.style.overflow = "visible";
  host.style.zIndex = "2147483647";
  host.style.fontSize = "16px";
  host.style.lineHeight = "1.5";
  host.style.zoom = "1";
  host.style.isolation = "isolate";
  host.style.contain = "style";
  host.style.setProperty("-webkit-text-size-adjust", "100%");

  const shadowRoot = host.attachShadow({ mode: "open" });
  const styleTag = document.createElement("style");
  const appRoot = document.createElement("div");

  styleTag.textContent = styles;
  appRoot.id = "metis-react-root";
  appRoot.style.position = "fixed";
  appRoot.style.inset = "0";
  appRoot.style.width = "0";
  appRoot.style.height = "0";
  appRoot.style.overflow = "visible";
  appRoot.style.fontSize = "16px";
  appRoot.style.lineHeight = "1.5";

  shadowRoot.append(styleTag, appRoot);
  (document.body ?? document.documentElement).appendChild(host);

  return shadowRoot;
}

function mount() {
  if (!hasExtensionRuntime()) {
    return;
  }

  const existingHost = document.getElementById(HOST_ID) as HTMLDivElement | null;

  if (existingHost?.dataset.metisMounted === "true") {
    return;
  }

  const shadowRoot = createHost();

  if (!shadowRoot) {
    return;
  }

  const appRoot = shadowRoot.getElementById("metis-react-root");

  if (!appRoot) {
    return;
  }

  const host = document.getElementById(HOST_ID) as HTMLDivElement | null;

  if (host) {
    host.dataset.metisMounted = "true";
  }

  console.info("[Metis] content script loaded");

  createRoot(appRoot).render(
    <StrictMode>
      <PageBridgeApp />
    </StrictMode>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount, { once: true });
} else {
  mount();
}

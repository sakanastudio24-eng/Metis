import type {
  MetisBridgeSyncAck,
  MetisBridgeSyncFailure,
  MetisBridgeSyncMessage,
} from "../shared/types/audit";
import {
  METIS_EXTERNAL_BRIDGE_VERSION,
  buildBridgeFailure,
  isAllowedExternalBridgeOrigin,
  isMetisBridgeSyncMessage,
} from "../shared/lib/bridgeAccountState";
import {
  getBridgeStorageDebugSnapshot,
  saveBridgeAccountState,
} from "../shared/lib/bridgeStorage";

type ExternalBridgeDependencies = {
  onBridgeStored: () => Promise<void>;
};

function getSenderOrigin(sender: chrome.runtime.MessageSender) {
  if (sender.origin) {
    return sender.origin;
  }

  if (sender.url) {
    try {
      return new URL(sender.url).origin;
    } catch {
      return null;
    }
  }

  return null;
}

export function registerExternalBridgeListener({
  onBridgeStored,
}: ExternalBridgeDependencies) {
  // Keep the auth bridge in the service worker so the website can connect even
  // when popup, side panel, and injected UI are all closed.
  chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    void (async () => {
      const origin = getSenderOrigin(sender);
      console.info("[Metis bridge] external message received", {
        origin,
        type: typeof message === "object" && message && "type" in message ? (message as { type?: unknown }).type : null,
      });

      if (!origin || !isAllowedExternalBridgeOrigin(origin)) {
        console.warn("[Metis bridge] rejected origin", { origin });
        sendResponse(
          buildBridgeFailure("invalid_origin", `Rejected bridge request from ${origin ?? "unknown origin"}.`)
        );
        return;
      }

      if (!message || typeof message !== "object" || !("type" in message)) {
        console.warn("[Metis bridge] missing message type");
        sendResponse(buildBridgeFailure("invalid_message_type", "No bridge message type was provided."));
        return;
      }

      if ((message as { type?: unknown }).type !== "METIS_BRIDGE_SYNC") {
        console.warn("[Metis bridge] unexpected message type", {
          type: (message as { type?: unknown }).type,
        });
        sendResponse(
          buildBridgeFailure(
            "invalid_message_type",
            `Expected METIS_BRIDGE_SYNC and received ${String((message as { type?: unknown }).type ?? "unknown")}.`
          )
        );
        return;
      }

      if (
        !("bridgeVersion" in (message as Record<string, unknown>)) ||
        (message as { bridgeVersion?: unknown }).bridgeVersion !== METIS_EXTERNAL_BRIDGE_VERSION
      ) {
        console.warn("[Metis bridge] unsupported bridge version", {
          received: (message as { bridgeVersion?: unknown }).bridgeVersion,
          expected: METIS_EXTERNAL_BRIDGE_VERSION,
        });
        sendResponse(
          buildBridgeFailure(
            "unsupported_bridge_version",
            `Expected bridgeVersion ${METIS_EXTERNAL_BRIDGE_VERSION}.`
          )
        );
        return;
      }

      if (!isMetisBridgeSyncMessage(message)) {
        console.warn("[Metis bridge] invalid account payload");
        sendResponse(buildBridgeFailure("invalid_payload", "The bridge payload did not match BridgeAccountState."));
        return;
      }

      try {
        await saveBridgeAccountState((message as MetisBridgeSyncMessage).account);
        console.info("[Metis bridge] stored account snapshot", await getBridgeStorageDebugSnapshot());
        await onBridgeStored();

        const ack: MetisBridgeSyncAck = {
          type: "METIS_BRIDGE_SYNC_ACK",
          source: "metis-extension",
          bridgeVersion: METIS_EXTERNAL_BRIDGE_VERSION,
          ok: true,
        };

        sendResponse(ack);
      } catch (error) {
        const detail = error instanceof Error ? error.message : "The extension could not save the bridge state.";
        console.error("[Metis bridge] storage failed", { detail });
        const failure: MetisBridgeSyncFailure = buildBridgeFailure("storage_failed", detail);
        sendResponse(failure);
      }
    })();

    return true;
  });
}

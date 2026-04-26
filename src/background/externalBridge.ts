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
  clearBridgeAccountState,
  getBridgeStorageDebugSnapshot,
  getStoredBridgeAccountState,
  saveBridgeAccountState,
  updateBridgeDebugState,
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
      const messageType =
        typeof message === "object" && message && "type" in message ? String((message as { type?: unknown }).type ?? "") : null;

      await updateBridgeDebugState({
        lastAttemptAt: Date.now(),
        lastStatus: "received",
        lastFailureReason: null,
        lastFailureDetail: null,
        lastSenderOrigin: origin,
        lastMessageType: messageType,
        targetExtensionId: chrome.runtime.id,
      });

      console.info("[Metis bridge] external message received", {
        origin,
        targetExtensionId: chrome.runtime.id,
        type: messageType,
      });

      if (!origin || !isAllowedExternalBridgeOrigin(origin)) {
        console.warn("[Metis bridge] rejected origin", { origin });
        await updateBridgeDebugState({
          lastStatus: "rejected",
          lastFailureReason: "invalid_origin",
          lastFailureDetail: `Rejected bridge request from ${origin ?? "unknown origin"}.`,
        });
        sendResponse(
          buildBridgeFailure("invalid_origin", `Rejected bridge request from ${origin ?? "unknown origin"}.`)
        );
        return;
      }

      if (!message || typeof message !== "object" || !("type" in message)) {
        console.warn("[Metis bridge] missing message type");
        await updateBridgeDebugState({
          lastStatus: "rejected",
          lastFailureReason: "invalid_message_type",
          lastFailureDetail: "No bridge message type was provided.",
        });
        sendResponse(buildBridgeFailure("invalid_message_type", "No bridge message type was provided."));
        return;
      }

      if ((message as { type?: unknown }).type === "METIS_BRIDGE_DISCONNECT") {
        await clearBridgeAccountState();
        await updateBridgeDebugState({
          lastStatus: "stored",
          lastFailureReason: null,
          lastFailureDetail: "The website requested an external disconnect.",
        });
        await onBridgeStored();
        const ack: MetisBridgeSyncAck = {
          type: "METIS_BRIDGE_SYNC_ACK",
          source: "metis-extension",
          bridgeVersion: METIS_EXTERNAL_BRIDGE_VERSION,
          ok: true,
        };
        sendResponse(ack);
        return;
      }

      if ((message as { type?: unknown }).type !== "METIS_BRIDGE_SYNC") {
        console.warn("[Metis bridge] unexpected message type", {
          type: (message as { type?: unknown }).type,
        });
        await updateBridgeDebugState({
          lastStatus: "rejected",
          lastFailureReason: "invalid_message_type",
          lastFailureDetail: `Expected METIS_BRIDGE_SYNC and received ${String((message as { type?: unknown }).type ?? "unknown")}.`,
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
        await updateBridgeDebugState({
          lastStatus: "rejected",
          lastFailureReason: "unsupported_bridge_version",
          lastFailureDetail: `Expected bridgeVersion ${METIS_EXTERNAL_BRIDGE_VERSION}.`,
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
        await updateBridgeDebugState({
          lastStatus: "rejected",
          lastFailureReason: "invalid_payload",
          lastFailureDetail: "The bridge payload did not match BridgeAccountState.",
        });
        sendResponse(buildBridgeFailure("invalid_payload", "The bridge payload did not match BridgeAccountState."));
        return;
      }

      try {
        const incomingAccount = (message as MetisBridgeSyncMessage).account;
        const previousAccount = await getStoredBridgeAccountState();
        const didSwitchAccount = Boolean(
          previousAccount?.email &&
            incomingAccount.email &&
            previousAccount.email !== incomingAccount.email
        );

        if (didSwitchAccount) {
          console.info("[Metis bridge] overwriting cached account snapshot", {
            previousEmail: previousAccount?.email,
            nextEmail: incomingAccount.email,
          });
        }

        await saveBridgeAccountState(incomingAccount);
        await updateBridgeDebugState({
          lastStatus: "stored",
          lastFailureReason: null,
          lastFailureDetail: null,
        });
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
        await updateBridgeDebugState({
          lastStatus: "failed",
          lastFailureReason: "storage_failed",
          lastFailureDetail: detail,
        });
        const failure: MetisBridgeSyncFailure = buildBridgeFailure("storage_failed", detail);
        sendResponse(failure);
      }
    })();

    return true;
  });
}

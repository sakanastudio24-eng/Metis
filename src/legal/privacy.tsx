import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CopySection, LegalPageShell } from "./LegalPageShell";

function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Metis"
      title="Privacy Policy"
      updatedLabel="Last updated: March 27, 2026"
    >
      <CopySection title="What Metis does">
        <p>
          Metis analyzes the page you choose to scan and surfaces cost-risk, control, stack, and
          optimization signals inside the extension.
        </p>
        <p>
          Metis is designed to stay local-first. The extension reads page context in your browser
          and stores local settings and scan history on your device while account management stays
          on the Metis website.
        </p>
      </CopySection>

      <CopySection title="What data Metis reads">
        <p>
          Metis can read page resource timing data, route context, DOM clues, and stack signals on
          the page where you activate it.
        </p>
        <p>
          This is used to build scan snapshots, issue detection, score output, and provider-aware
          estimate framing.
        </p>
      </CopySection>

      <CopySection title="What data Metis stores">
        <p>
          Metis stores local settings, saved page snapshots, site history, and current tab-session
          state in extension storage so reports stay useful across reloads.
        </p>
        <p>
          That data stays in the extension context unless a future feature explicitly says
          otherwise. Website account data and extension scan data should not be treated as fully
          synced unless Metis explicitly releases that bridge.
        </p>
      </CopySection>

      <CopySection title="What Metis does not do">
        <p>
          Metis does not claim to reproduce exact cloud bills, and it does not treat scans as legal,
          financial, or security advice.
        </p>
        <p>
          Metis also does not rely on hidden user assumptions from settings. User-provided business
          context should come from explicit questions.
        </p>
      </CopySection>

      <CopySection title="Your controls">
        <p>
          You can clear saved snapshots and site history from the extension settings popup. You can
          also stop using the extension at any time by disabling or removing it in Chrome. Account
          and security settings are managed on the Metis website.
        </p>
      </CopySection>

      <CopySection title="Contact">
        <p>
          For product questions, beta access, or account changes, use the Metis website linked from
          the extension settings popup.
        </p>
      </CopySection>
    </LegalPageShell>
  );
}

const root = document.getElementById("metis-react-root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <PrivacyPage />
    </StrictMode>
  );
}

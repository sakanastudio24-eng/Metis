import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CopySection, LegalPageShell } from "./LegalPageShell";

function TermsPage() {
  return (
    <LegalPageShell eyebrow="Metis" title="Terms of Use" updatedLabel="Last updated: March 27, 2026">
      <CopySection title="Beta product">
        <p>
          Metis is a beta extension. Features, pricing, availability, and report behavior may change
          while the product is being developed.
        </p>
      </CopySection>

      <CopySection title="Use at your own judgment">
        <p>
          Metis is a diagnostic and estimation tool. It gives product and engineering guidance, not
          legal, compliance, accounting, or financial advice.
        </p>
        <p>
          You are responsible for reviewing suggestions before using them in production or business
          decisions.
        </p>
      </CopySection>

      <CopySection title="No exact billing guarantee">
        <p>
          Metis uses local scan evidence, stack detection, and pricing references to model likely
          cost pressure. It does not guarantee exact provider invoices, savings, or overage amounts.
        </p>
      </CopySection>

      <CopySection title="Acceptable use">
        <p>
          Use Metis only on pages and systems you are allowed to analyze. Do not use the extension
          to violate platform rules, contracts, or applicable law.
        </p>
      </CopySection>

      <CopySection title="Availability">
        <p>
          Because Metis runs in the browser and depends on live page behavior, some sites or routes
          may be incomplete, blocked, or only partially observable.
        </p>
      </CopySection>

      <CopySection title="Changes">
        <p>
          These terms may be updated as the beta evolves. Continued use after an update means you
          accept the revised terms.
        </p>
      </CopySection>
    </LegalPageShell>
  );
}

const root = document.getElementById("metis-react-root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <TermsPage />
    </StrictMode>
  );
}

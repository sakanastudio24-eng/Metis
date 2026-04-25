import type { ReactNode } from "react";
import "../../src/styles/tailwind.css";

function CopySection({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      className="rounded-[24px] border px-5 py-5"
      style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.08)"
      }}
    >
      <h2
        style={{
          color: "white",
          fontFamily: "Jua, sans-serif",
          fontSize: 24
        }}
      >
        {title}
      </h2>
      <div
        className="mt-3 space-y-3"
        style={{
          color: "rgba(255,255,255,0.74)",
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          lineHeight: "22px"
        }}
      >
        {children}
      </div>
    </section>
  );
}

export function LegalPageShell({
  eyebrow,
  title,
  updatedLabel,
  children
}: {
  eyebrow: string;
  title: string;
  updatedLabel: string;
  children: ReactNode;
}) {
  return (
    <div
      className="min-h-screen px-5 py-8"
      style={{
        background: "#0d1825",
        color: "white"
      }}
    >
      <div className="mx-auto max-w-[820px]">
        <div
          style={{
            color: "#dc5e5e",
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase"
          }}
        >
          {eyebrow}
        </div>
        <h1
          className="mt-3"
          style={{
            color: "white",
            fontFamily: "Jua, sans-serif",
            fontSize: 40,
            lineHeight: "44px"
          }}
        >
          {title}
        </h1>
        <p
          className="mt-3"
          style={{
            color: "rgba(255,255,255,0.56)",
            fontFamily: "Inter, sans-serif",
            fontSize: 13
          }}
        >
          {updatedLabel}
        </p>

        <div className="mt-8 space-y-4">{children}</div>
      </div>
    </div>
  );
}

export { CopySection };

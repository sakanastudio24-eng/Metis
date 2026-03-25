const ACRONYM_EXPLANATIONS: Record<string, string> = {
  AI: "Artificial Intelligence",
  API: "Application Programming Interface",
  APIs: "Application Programming Interfaces",
  AWS: "Amazon Web Services",
  CDN: "Content Delivery Network",
  CPU: "Central Processing Unit",
  DOM: "Document Object Model",
  PDF: "Portable Document Format",
  RUM: "Real User Monitoring",
  SaaS: "Software as a Service",
  SPA: "Single-Page Application",
  UI: "User Interface",
  WP: "WordPress"
};

const ACRONYM_PATTERN = new RegExp(
  `\\b(${Object.keys(ACRONYM_EXPLANATIONS)
    .sort((left, right) => right.length - left.length)
    .join("|")})\\b`,
  "g"
);

function AcronymToken({ token }: { token: string }) {
  const explanation = ACRONYM_EXPLANATIONS[token];

  if (!explanation) {
    return <>{token}</>;
  }

  return (
    <span className="group relative inline-flex cursor-help items-center">
      <span
        style={{
          textDecoration: "underline dotted rgba(255,156,72,0.55)",
          textUnderlineOffset: 3
        }}
      >
        {token}
      </span>
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-[80] mb-2 min-w-max -translate-x-1/2 rounded-full px-3 py-1.5 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100"
        style={{
          background: "#ff8b22",
          border: "1px solid rgba(255,196,132,0.45)",
          color: "#1f1206",
          fontFamily: "Inter, sans-serif",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.02em",
          whiteSpace: "nowrap"
        }}
      >
        {explanation}
      </span>
    </span>
  );
}

export function AcronymText({ text }: { text: string }) {
  const parts = text.split(ACRONYM_PATTERN);

  return (
    <>
      {parts.map((part, index) => (
        <AcronymToken key={`${part}-${index}`} token={part} />
      ))}
    </>
  );
}

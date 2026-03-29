import type { ExportReportDocument } from "../../../shared/types/audit";
import type { MetisDesignViewModel } from "./liveAdapter";

type ExportDocumentOptions = {
  isPlusUser?: boolean;
};

export function buildExportReportDocument(
  viewModel: MetisDesignViewModel,
  options: ExportDocumentOptions = {}
): ExportReportDocument {
  const isPlusUser = options.isPlusUser ?? false;
  const sections: ExportReportDocument["sections"] = [
      {
        id: "overview",
        title: "Overview",
        lines: [
          `Score: ${viewModel.score}/100 (${viewModel.riskLabel})`,
          `Control: ${viewModel.controlScore}/100 (${viewModel.controlLabel})`,
          `Confidence: ${viewModel.confidenceLabel}`,
          viewModel.confidenceDetail,
        `Estimated waste: ${viewModel.estimateRange}`,
        `Session cost: ${viewModel.sessionCost}`,
        `Projection at 10k users: ${viewModel.monthlyProjection}`
      ]
    },
    {
      id: "insight",
      title: "Insight",
      lines: [viewModel.quickInsight, viewModel.supportingDetail]
    },
    {
      id: "issues",
      title: "Top Issues",
      lines:
        viewModel.topIssues.length > 0
          ? viewModel.topIssues.map(
              (issue) => `${issue.title}. Severity: ${issue.severityLabel}. ${issue.detail}`
            )
          : ["No major cost issues surfaced on this route."]
    },
    {
      id: "stack",
      title: "Known Stack",
      lines:
        viewModel.stackGroups.length > 0
          ? viewModel.stackGroups.map(
              (group) => `${group.label}: ${group.items.map((item) => item.label).join(", ")}`
            )
          : ["No strong cost-relevant stack groups were resolved."]
    }
  ];

  if (isPlusUser) {
    sections.push(
      {
        id: "breakdown",
        title: "Cost Breakdown",
        lines:
          viewModel.costRows.length > 0
            ? viewModel.costRows.map((row) => `${row.label}: ${row.amount}`)
            : ["No cost breakdown rows were generated for this route."]
      },
      {
        id: "endpoints",
        title: "Endpoint Detail",
        lines:
          viewModel.plusEndpointRows.length > 0
            ? viewModel.plusEndpointRows.map(
                (row) =>
                  `${row.label}. Type: ${row.categoryLabel}. Requests: ${row.requestCountLabel}. Size: ${row.sizeLabel}.`
              )
            : ["No endpoint detail rows were generated for this route."]
      },
      {
        id: "scale",
        title: "Scale Modeling",
        lines:
          viewModel.scaleSimulationRows.length > 0
            ? viewModel.scaleSimulationRows.map(
                (row) => `${row.trafficLabel}: ${row.amount}. ${row.scenario}`
              )
            : ["No scale simulation rows were generated for this route."]
      },
      {
        id: "recommendations",
        title: "Fix Priority",
        lines:
          viewModel.fixRecommendationCards.length > 0
            ? viewModel.fixRecommendationCards.map((card) => {
                const lines = [card.title];
                if (card.priorityLabel) {
                  lines.push(`Priority: ${card.priorityLabel}`);
                }
                if (card.fix) {
                  lines.push(`Recommendation: ${card.fix}`);
                }
                if (card.scaleImpact) {
                  lines.push(`Impact: ${card.scaleImpact}`);
                }

                return lines.join(". ");
              })
            : ["No fix priorities were generated for this route."]
      }
    );
  }

  // This document shape is the contract the future PDF path should target.
  // Keeping it separate from the rendered UI avoids screenshot-style exports.
  return {
    title: `${isPlusUser ? "Metis+ report" : "Metis report"} for ${viewModel.hostname}`,
    hostname: viewModel.hostname,
    generatedAt: viewModel.scannedAt,
    costRiskScore: viewModel.score,
    controlScore: viewModel.controlScore,
    confidenceLabel: viewModel.confidenceLabel,
    sections
  };
}

export function buildExportOutlineText(document: ExportReportDocument) {
  return [
    document.title,
    `Generated: ${document.generatedAt}`,
    `Score: ${document.costRiskScore}/100`,
    `Control: ${document.controlScore}/100`,
    `Confidence: ${document.confidenceLabel}`,
    ...document.sections.flatMap((section) => [
      "",
      section.title,
      ...section.lines
    ])
  ].join("\n");
}

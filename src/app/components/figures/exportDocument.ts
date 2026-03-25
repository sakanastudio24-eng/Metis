import type { ExportReportDocument } from "../../../shared/types/audit";
import type { MetisDesignViewModel } from "./liveAdapter";

export function buildExportReportDocument(
  viewModel: MetisDesignViewModel
): ExportReportDocument {
  // This document shape is the contract the future PDF path should target.
  // Keeping it separate from the rendered UI avoids screenshot-style exports.
  return {
    title: `Metis report · ${viewModel.hostname}`,
    hostname: viewModel.hostname,
    generatedAt: viewModel.scannedAt,
    costRiskScore: viewModel.score,
    controlScore: viewModel.controlScore,
    sections: [
      {
        id: "overview",
        title: "Overview",
        lines: [
          `Cost Risk: ${viewModel.score}/100 (${viewModel.riskLabel})`,
          `Control: ${viewModel.controlScore}/100 (${viewModel.controlLabel})`,
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
                (issue) => `${issue.title} · ${issue.severityLabel} · ${issue.detail}`
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
      },
      {
        id: "recommendations",
        title: "Recommendations",
        lines:
          viewModel.fixRecommendationCards.length > 0
            ? viewModel.fixRecommendationCards.map((card) => {
                const lines = [card.title];
                if (card.fix) {
                  lines.push(card.fix);
                }
                if (card.scaleImpact) {
                  lines.push(card.scaleImpact);
                }

                return lines.join(" · ");
              })
            : ["No fix recommendations generated yet."]
      }
    ]
  };
}

export function buildExportOutlineText(document: ExportReportDocument) {
  return [
    document.title,
    `Generated: ${document.generatedAt}`,
    `Cost Risk: ${document.costRiskScore}/100`,
    `Control: ${document.controlScore}/100`,
    ...document.sections.flatMap((section) => [
      "",
      section.title,
      ...section.lines.map((line) => `- ${line}`)
    ])
  ].join("\n");
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreSnapshot = scoreSnapshot;
const config_1 = require("./config");
function roundScoreValue(value) {
    return Math.round(value * 10) / 10;
}
function scoreSnapshot(snapshot, issues) {
    const deductions = issues.map((issue) => ({
        reason: issue.title,
        points: roundScoreValue(config_1.SCORE_CONFIG.severityPenalty[issue.severity] *
            config_1.SCORE_CONFIG.categoryMultiplier[issue.category]),
        category: issue.category,
        severity: issue.severity,
        multiplier: config_1.SCORE_CONFIG.categoryMultiplier[issue.category]
    }));
    const totalDeduction = deductions.reduce((total, deduction) => total + deduction.points, 0);
    const score = Math.max(0, roundScoreValue(config_1.SCORE_CONFIG.baseScore - totalDeduction));
    let label = "healthy";
    if (score < config_1.SCORE_CONFIG.labels.watchMin) {
        label = "high risk";
    }
    else if (score < config_1.SCORE_CONFIG.labels.healthyMin) {
        label = "watch";
    }
    if (issues.length === 0 && snapshot.metrics.requestCount === 0) {
        label = "warming up";
    }
    return {
        score,
        label,
        deductions
    };
}

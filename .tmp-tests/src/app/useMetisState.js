"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMetisState = useMetisState;
// useMetisState.ts keeps the injected panel state local to the content script.
// It holds panel mode, scope selection, and the latest scan snapshots used by
// the current scoring, Phase 4 insight flow, and the optional Plus refinement layer.
const react_1 = require("react");
function useMetisState() {
    const [panelMode, setPanelMode] = (0, react_1.useState)("idle");
    const [scanScope, setScanScope] = (0, react_1.useState)("single");
    const [rawSnapshot, setRawSnapshot] = (0, react_1.useState)(null);
    const [baselineSnapshot, setBaselineSnapshot] = (0, react_1.useState)(null);
    const [visitedSnapshots, setVisitedSnapshots] = (0, react_1.useState)([]);
    const [plusAnswers, setPlusAnswers] = (0, react_1.useState)({});
    const [isPlusRefinementOpen, setIsPlusRefinementOpen] = (0, react_1.useState)(false);
    return {
        panelMode,
        setPanelMode,
        scanScope,
        setScanScope,
        isPanelOpen: panelMode !== "idle",
        rawSnapshot,
        setRawSnapshot,
        baselineSnapshot,
        setBaselineSnapshot,
        visitedSnapshots,
        setVisitedSnapshots,
        plusAnswers,
        setPlusAnswers,
        isPlusRefinementOpen,
        setIsPlusRefinementOpen
    };
}

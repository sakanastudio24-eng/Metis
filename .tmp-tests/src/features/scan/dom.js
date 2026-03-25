"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspectDomSurface = inspectDomSurface;
function inspectDomSurface() {
    return {
        scriptCount: document.querySelectorAll("script").length,
        imageCount: document.querySelectorAll("img").length,
        iframeCount: document.querySelectorAll("iframe").length
    };
}

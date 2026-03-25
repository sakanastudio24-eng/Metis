"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePageContext = parsePageContext;
function parsePageContext(href) {
    const url = new URL(href);
    return {
        href: url.href,
        origin: url.origin,
        hostname: url.hostname,
        pathname: url.pathname
    };
}

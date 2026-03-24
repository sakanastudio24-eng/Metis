import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { createServer } from "node:http";

const rootDir = resolve("visual-test");
const host = "127.0.0.1";
const port = Number(process.env.PORT ?? 4173);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function resolveRequestPath(urlPath) {
  const safePath = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(rootDir, safePath);

  if (safePath === "/" || safePath === ".") {
    filePath = join(rootDir, "index.html");
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  return filePath;
}

const server = createServer((req, res) => {
  const urlPath = req.url ?? "/";
  const filePath = resolveRequestPath(urlPath);

  if (!filePath.startsWith(rootDir) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const mimeType = mimeTypes[extname(filePath)] ?? "application/octet-stream";
  res.writeHead(200, { "content-type": mimeType, "cache-control": "no-store" });
  createReadStream(filePath).pipe(res);
});

server.listen(port, host, () => {
  console.log(`Visual test server running at http://${host}:${port}`);
  console.log("Open one of these pages:");
  console.log(`- http://${host}:${port}/sites/capability-lab/`);
  console.log(`- http://${host}:${port}/sites/marketing/`);
  console.log(`- http://${host}:${port}/sites/dashboard/`);
  console.log(`- http://${host}:${port}/sites/media-heavy/`);
});

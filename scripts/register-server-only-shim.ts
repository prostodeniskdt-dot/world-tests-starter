/**
 * Позволяет запускать tsx-скрипты, импортирующие src/lib/db.ts (server-only).
 */
import { createRequire } from "module";
import { dirname } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const Module = require("module") as typeof import("module");
const scriptDir = dirname(fileURLToPath(import.meta.url));
const shimPath = require.resolve("./server-only-shim.cjs", { paths: [scriptDir] });
const mod = Module as unknown as {
  _resolveFilename: (request: string, parent: unknown, isMain: boolean, ...rest: unknown[]) => string;
};
const origResolve = mod._resolveFilename;

mod._resolveFilename = function (
  request: string,
  parent: unknown,
  isMain: boolean,
  ...rest: unknown[]
) {
  if (request === "server-only") return shimPath;
  return origResolve.call(this, request, parent, isMain, ...rest);
};

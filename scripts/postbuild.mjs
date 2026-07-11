/**
 * Post-build script: reorganises tsc output into a flat dist/ directory with
 * extension-based module differentiation, then creates minified variants.
 *
 * Input (from tsc):
 *   dist/.cjs-tmp/index.js     (CommonJS, from tsconfig.cjs.json)
 *   dist/.cjs-tmp/index.d.ts   (CJS declarations)
 *   dist/.esm-tmp/index.js     (ESM, from tsconfig.esm.json)
 *   dist/.esm-tmp/index.d.ts   (ESM declarations)
 *
 * Output (flat dist/):
 *   dist/index.cjs             CommonJS module
 *   dist/index.min.cjs         Minified CommonJS
 *   dist/index.d.cts           CJS type declarations
 *   dist/index.mjs             ES module
 *   dist/index.min.mjs         Minified ESM
 *   dist/index.d.mts           ESM type declarations
 *   + corresponding .map files
 */

import { readFileSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";

const DIST = fileURLToPath(new URL("../dist", import.meta.url));

/**
 * Move a JS file from tmpDir to dist/ with a new extension.
 * Also moves the corresponding .js.map file.
 */
function moveJs(tmpDir, filename, newExt) {
  const src = join(DIST, tmpDir, filename);
  const base = basename(filename, ".js");
  const dest = join(DIST, `${base}${newExt}`);

  copyFileSync(src, dest);

  // Move source map
  try {
    copyFileSync(`${src}.map`, `${dest}.map`);
  } catch {
    // map may not exist
  }
}

/**
 * Move a .d.ts declaration file from tmpDir to dist/ with new extension.
 * "index.d.ts" → "index.d.cts", "index.d.ts.map" → "index.d.cts.map"
 */
function moveDecl(tmpDir, filename, newExt) {
  const src = join(DIST, tmpDir, filename);
  const base = basename(filename, ".d.ts");
  const dest = join(DIST, `${base}${newExt}`);

  copyFileSync(src, dest);

  // Move declaration source map
  try {
    copyFileSync(`${src}.map`, `${dest}.map`);
  } catch {
    // map may not exist
  }
}

/**
 * Minify a JS file with esbuild and write the result + source map.
 */
async function minify(inputPath, outputPath) {
  const inputAbs = join(DIST, inputPath);
  const code = readFileSync(inputAbs, "utf-8");

  const result = await transform(code, {
    loader: inputPath.endsWith(".mjs") ? "js" : "js",
    minify: true,
    sourcemap: true,
    sourcesContent: true,
  });

  writeFileSync(join(DIST, outputPath), result.code);
  if (result.map) {
    writeFileSync(join(DIST, `${outputPath}.map`), result.map);
  }
}

// ── Step 1: Reorganise files ────────────────────────────────────────────

// CJS: .js → .cjs, .d.ts → .d.cts
moveJs(".cjs-tmp", "index.js", ".cjs");
moveDecl(".cjs-tmp", "index.d.ts", ".d.cts");

// ESM: .js → .mjs, .d.ts → .d.mts
moveJs(".esm-tmp", "index.js", ".mjs");
moveDecl(".esm-tmp", "index.d.ts", ".d.mts");

// ── Step 2: Remove temp directories ─────────────────────────────────────

rmSync(join(DIST, ".cjs-tmp"), { recursive: true, force: true });
rmSync(join(DIST, ".esm-tmp"), { recursive: true, force: true });

// ── Step 3: Minify ──────────────────────────────────────────────────────

await Promise.all([
  minify("index.cjs", "index.min.cjs"),
  minify("index.mjs", "index.min.mjs"),
]);

console.log("Post-build complete:");
console.log("  dist/index.cjs        CommonJS");
console.log("  dist/index.min.cjs    Minified CommonJS");
console.log("  dist/index.d.cts      CJS type declarations");
console.log("  dist/index.mjs        ES module");
console.log("  dist/index.min.mjs    Minified ESM");
console.log("  dist/index.d.mts      ESM type declarations");

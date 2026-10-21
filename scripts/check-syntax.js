#!/usr/bin/env node
/**
 * TeaQuest — syntax and global-scope gate
 *
 * A single stray brace in one script silently disables the ENTIRE
 * file (the browser refuses to run a script that fails to parse).
 * That is how a broken login shipped once, so every build now
 * parses every script before anything else happens.
 *
 * The second check is just as important: every <script src> in
 * index.html is a *classic* script, so all of them share one global
 * scope. Two files that declare the same top-level name make the
 * browser reject the whole bundle with
 *   "SyntaxError: Identifier 'x' has already been declared"
 * even though each file parses perfectly on its own.
 *
 * Usage:
 *   node scripts/check-syntax.js            check every .js in the repo
 *   node scripts/check-syntax.js --scripts  also check the scripts
 *                                           index.html loads, for
 *                                           global-scope collisions
 */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

const IGNORED = new Set([
    "node_modules",
    "dist",
    "coverage",
    ".git",
    // Third-party code is not ours to lint or namespace.
    "vendor"
]);

function collectScripts(dir, found = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (IGNORED.has(entry.name)) continue;

        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            collectScripts(full, found);
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
            found.push(full);
        }
    }

    return found;
}

// ---------------------------------------------------------------
// 1. Every file must parse on its own.
// ---------------------------------------------------------------

const files = collectScripts(ROOT);

if (!files.length) {
    console.error("No JavaScript files found to check.");
    process.exit(1);
}

let failures = 0;

for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const relative = path.relative(ROOT, file);

    try {
        // Wrap like a classic script so top-level `return` and
        // browser globals behave the same way the browser sees them.
        new vm.Script(source, {
            filename: file,
            displayErrors: true
        });

        console.log(`  ok  ${relative}`);
    } catch (error) {
        failures += 1;

        const message = error.stack || error.message;

        console.error(` FAIL ${relative}`);
        console.error(
            message
                .split("\n")
                .slice(0, 6)
                .map(line => `      ${line}`)
                .join("\n")
        );
    }
}

// ---------------------------------------------------------------
// 2. The scripts index.html loads must be able to coexist in one
//    global scope.
// ---------------------------------------------------------------

/**
 * Collect the top-level names a classic script declares.
 *
 * This is a deliberately conservative scan: it only looks at
 * declarations that start at column 0, which is exactly the style
 * this codebase uses. Nested declarations live in their own scope
 * and cannot collide.
 */
function topLevelNames(source) {
    const names = new Set();

    const lines = source.split(/\r?\n/);

    for (const line of lines) {
        // Only column 0 counts: anything indented is inside a block.
        if (/^\s/.test(line)) continue;

        let match = /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/.exec(line);
        if (match) {
            names.add(match[1]);
            continue;
        }

        match = /^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/.exec(line);
        if (match) {
            names.add(match[1]);
            continue;
        }

        // Destructuring declarations: const { a, b } = ...
        match = /^(?:export\s+)?(?:const|let|var)\s*\{([^}]*)\}\s*=/.exec(line);
        if (match) {
            for (const part of match[1].split(",")) {
                const name = part.split(":").pop().split("=")[0].trim();
                if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name);
            }
        }
    }

    return names;
}

function collectPageScripts() {
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    const pattern = /<script\s+src="([^"]+\.js)"><\/script>/g;
    const found = [];
    let match;

    while ((match = pattern.exec(html)) !== null) {
        const src = match[1];

        if (/^(https?:)?\/\//.test(src)) continue;
        if (src.startsWith("vendor/")) continue;
        if (!fs.existsSync(path.join(ROOT, src))) continue;
        if (found.includes(src)) continue;

        found.push(src);
    }

    return found;
}

const pageScripts = collectPageScripts();
const owners = new Map();
const collisions = [];

for (const src of pageScripts) {
    const source = fs.readFileSync(path.join(ROOT, src), "utf8");

    for (const name of topLevelNames(source)) {
        if (owners.has(name)) {
            collisions.push({ name, first: owners.get(name), second: src });
        } else {
            owners.set(name, src);
        }
    }
}

if (pageScripts.length) {
    console.log("");
    console.log(
        `  ok  ${pageScripts.length} page script(s) share one global scope ` +
        `(${owners.size} top-level names, no collisions)`
    );
}

for (const collision of collisions) {
    failures += 1;

    console.error(
        ` FAIL global collision: '${collision.name}' is declared in both ` +
        `${collision.first} and ${collision.second}`
    );
}

console.log("");

if (failures) {
    console.error(`Syntax check failed: ${failures} problem(s) found.`);
    process.exit(1);
}

console.log(`Syntax check passed: ${files.length} file(s) parse cleanly.`);

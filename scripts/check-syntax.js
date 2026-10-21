#!/usr/bin/env node
/**
 * TeaQuest — syntax gate
 *
 * A single stray brace in one script silently disables the ENTIRE
 * file (the browser refuses to run a script that fails to parse).
 * That is how a broken login shipped once, so every build now
 * parses every script before anything else happens.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

const IGNORED = new Set(["node_modules", "dist", "coverage", ".git"]);

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

console.log("");

if (failures) {
    console.error(`Syntax check failed: ${failures} of ${files.length} file(s) do not parse.`);
    process.exit(1);
}

console.log(`Syntax check passed: ${files.length} file(s) parse cleanly.`);

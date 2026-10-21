/**
 * TeaQuest — production build smoke test
 *
 * The unit tests and the signup integration test both exercise the
 * *source* files. They cannot catch a broken *bundle*: a minifier
 * that renames two classic scripts into the same global name, or a
 * script tag that points at a file the build never emitted, produces
 * a page where nothing works and every source-level test still
 * passes.
 *
 * So this test builds the real dist/ and loads it in a browser-like
 * environment, over HTTP, exactly the way a visitor would.
 */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
    ".sql": "text/plain; charset=utf-8"
};

function startServer() {
    const server = http.createServer((req, res) => {
        let file = decodeURIComponent(req.url.split("?")[0]);

        if (file === "/") {
            file = "/index.html";
        }

        const full = path.join(DIST, file);

        if (
            !full.startsWith(DIST) ||
            !fs.existsSync(full) ||
            fs.statSync(full).isDirectory()
        ) {
            res.writeHead(404);
            res.end("not found");
            return;
        }

        res.writeHead(200, {
            "Content-Type":
                CONTENT_TYPES[path.extname(full)] ||
                "application/octet-stream"
        });
        res.end(fs.readFileSync(full));
    });

    return new Promise((resolve) => {
        server.listen(0, "127.0.0.1", () => {
            resolve({
                server,
                port: server.address().port
            });
        });
    });
}

describe("production build", () => {
    let dom;
    let server;
    let pageErrors;

    beforeAll(async () => {
        // Build the real thing. This is the artefact users download.
        execFileSync(process.execPath, ["scripts/build.js"], {
            cwd: ROOT,
            stdio: "pipe",
            timeout: 180000
        });

        const started = await startServer();

        server = started.server;
        pageErrors = [];

        const { JSDOM, VirtualConsole, ResourceLoader } = require("jsdom");

        const virtualConsole = new VirtualConsole();

        virtualConsole.on("jsdomError", (error) => {
            // jsdom cannot do WebGL, so a missing canvas context is
            // expected and not a build failure.
            if (/getContext/.test(String(error.message))) {
                return;
            }

            pageErrors.push(String(error.message));
        });

        // Only the local server may be reached. The app also loads
        // Stripe from js.stripe.com; letting that through would make
        // the test depend on the network and on a third party.
        class LocalOnlyLoader extends ResourceLoader {
            fetch(url, options) {
                if (url.startsWith("http://127.0.0.1:")) {
                    return super.fetch(url, options);
                }

                return Promise.resolve(Buffer.from(""));
            }
        }

        dom = await JSDOM.fromURL(
            `http://127.0.0.1:${started.port}/index.html`,
            {
                runScripts: "dangerously",
                resources: new LocalOnlyLoader(),
                pretendToBeVisual: true,
                virtualConsole
            }
        );

        await new Promise((resolve) => {
            if (dom.window.document.readyState === "complete") {
                return resolve();
            }

            dom.window.addEventListener("load", resolve);
        });

        // The app paints before it talks to the server, so a short
        // wait is enough for the first render.
        await new Promise((resolve) => setTimeout(resolve, 1500));
    }, 240000);

    afterAll(() => {
        if (dom) {
            dom.window.close();
        }

        if (server) {
            server.close();
        }
    });

    const page = () => dom.window.document;

    test("the page loads without a script error", () => {
        expect(pageErrors).toEqual([]);
    });

    test("the self-hosted Firebase SDK is available", () => {
        const firebase = dom.window.firebase;

        expect(firebase).toBeTruthy();
        expect(typeof firebase.initializeApp).toBe("function");
        expect(firebase.auth).toBeTruthy();
        expect(firebase.firestore).toBeTruthy();
        expect(firebase.storage).toBeTruthy();
    });

    test("the app exposes its modules", () => {
        expect(dom.window.TeaQuestUtils).toBeTruthy();
        expect(dom.window.Security).toBeTruthy();
        expect(dom.window.db).toBeTruthy();
        expect(typeof dom.window.handleAuthentication).toBe("function");
    });

    test("the Minecraft Quest module is wired up", () => {
        expect(dom.window.MC).toBeTruthy();
        expect(
            page().getElementById("playMinecraftQuest")
        ).toBeTruthy();
    });

    test("the shop renders from the bundled catalogue", () => {
        expect(
            page().querySelectorAll("#shopProducts > *").length
        ).toBeGreaterThan(0);

        expect(
            page().querySelectorAll("#featuredProducts > *").length
        ).toBeGreaterThan(0);
    });

    test("the auth modal has exactly one email field", () => {
        // Two elements used to share id="authEmail": the hidden copy
        // swallowed every login and blocked every signup.
        expect(page().querySelectorAll("#authEmail").length).toBe(1);
    });

    test("every bundled script was emitted", () => {
        const html = fs.readFileSync(
            path.join(DIST, "index.html"),
            "utf8"
        );

        const pattern = /<script\s+src="([^"]+\.js)"><\/script>/g;

        let match;
        const missing = [];

        while ((match = pattern.exec(html)) !== null) {
            const src = match[1];

            if (!fs.existsSync(path.join(DIST, src))) {
                missing.push(src);
            }
        }

        expect(missing).toEqual([]);
    });

    test("the build injects a Firebase config", () => {
        const config = dom.window.FIREBASE_CONFIG;

        expect(config).toBeTruthy();
        expect(typeof config.apiKey).toBe("string");
        expect(config.apiKey.length).toBeGreaterThan(0);
        expect(config.projectId.length).toBeGreaterThan(0);
    });

    test("the service worker precaches the local SDK and fonts", () => {
        const sw = fs.readFileSync(
            path.join(DIST, "sw.js"),
            "utf8"
        );

        expect(sw).toContain("/vendor/firebase-app-compat.js");
        expect(sw).toContain("/fonts/fonts.css");
    });
});

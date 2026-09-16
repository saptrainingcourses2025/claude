/**
 * run-opa5-with-screenshots.js
 *
 * Enhanced OPA5 headless test runner with screenshot capture at every
 * meaningful QUnit/OPA5 event: test start, assertion pass/fail, module boundary,
 * suite completion.
 *
 * Screenshots are saved to:
 *   app/managetravel/webapp/test/screenshots/
 *
 * Strategy:
 *   1. Start an http-server serving webapp/ at port 4100.
 *   2. Launch Chrome headless via Puppeteer.
 *   3. Navigate to indexTestFile_TravelledLocations.html.
 *   4. Inject QUnit hooks (testStart, testDone, moduleDone, done) to trigger
 *      screenshots from inside the page context via a shared window flag.
 *   5. The Node runner polls that flag and captures screenshots via page.screenshot().
 *   6. Wait for QUnit.done then scrape and render the full summary.
 */

"use strict";

const puppeteer = require("puppeteer");
const http      = require("http");
const fs        = require("fs");
const path      = require("path");

// ── Configuration ─────────────────────────────────────────────────────────────

const SERVE_ROOT       = path.resolve(__dirname, "app/managetravel/webapp");
const SCREENSHOT_DIR   = path.resolve(__dirname, "app/managetravel/webapp/test/screenshots");
const PORT             = 4100;
const TEST_PATH        = "/test/indexTestFile_TravelledLocations.html";
const TEST_URL         = `http://localhost:${PORT}${TEST_PATH}`;
const SUITE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const POLL_INTERVAL_MS = 1500;

// ── Ensure screenshots directory exists ──────────────────────────────────────

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Clear previous screenshots so each run starts fresh
fs.readdirSync(SCREENSHOT_DIR).forEach(f => {
    if (f.endsWith(".png")) {
        fs.unlinkSync(path.join(SCREENSHOT_DIR, f));
    }
});
console.log(`[runner] Screenshots will be saved to: ${SCREENSHOT_DIR}`);

// ── Screenshot counter (for ordered filenames) ───────────────────────────────

let screenshotCounter = 0;

function screenshotName(label) {
    screenshotCounter++;
    const idx  = String(screenshotCounter).padStart(3, "0");
    const slug = label.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 60);
    return path.join(SCREENSHOT_DIR, `${idx}_${slug}.png`);
}

async function takeScreenshot(page, label) {
    const filePath = screenshotName(label);
    try {
        await page.screenshot({ path: filePath, fullPage: true });
        console.log(`[screenshot] ${path.basename(filePath)}`);
        return filePath;
    } catch (err) {
        console.warn(`[screenshot] Failed to capture '${label}': ${err.message}`);
        return null;
    }
}

// Track which screenshots were taken for the final summary
const screenshotLog = [];

// ── Minimal static file server ────────────────────────────────────────────────

const MIME_TYPES = {
    ".html":       "text/html",
    ".js":         "application/javascript",
    ".css":        "text/css",
    ".json":       "application/json",
    ".xml":        "application/xml",
    ".png":        "image/png",
    ".gif":        "image/gif",
    ".svg":        "image/svg+xml",
    ".woff":       "font/woff",
    ".woff2":      "font/woff2",
    ".ttf":        "font/ttf",
    ".properties": "text/plain"
};

function createStaticServer(root, port) {
    return new Promise(function (resolve, reject) {
        const server = http.createServer(function (req, res) {
            const urlPath  = req.url.split("?")[0];
            const filePath = path.join(root, urlPath);

            if (!filePath.startsWith(root)) {
                res.writeHead(403);
                res.end("Forbidden");
                return;
            }

            let target = filePath;
            try {
                const stat = fs.statSync(target);
                if (stat.isDirectory()) {
                    target = path.join(target, "index.html");
                }
            } catch (e) {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("Not found: " + urlPath);
                return;
            }

            fs.readFile(target, function (err, data) {
                if (err) {
                    res.writeHead(404, { "Content-Type": "text/plain" });
                    res.end("Not found: " + urlPath);
                    return;
                }
                const ext         = path.extname(target).toLowerCase();
                const contentType = MIME_TYPES[ext] || "application/octet-stream";
                res.writeHead(200, {
                    "Content-Type":  contentType,
                    "Cache-Control": "no-cache"
                });
                res.end(data);
            });
        });

        server.listen(port, "127.0.0.1", function () {
            console.log(`[server] Serving ${root} on http://localhost:${port}`);
            resolve(server);
        });
        server.on("error", reject);
    });
}

// ── QUnit instrumentation injected into the page ──────────────────────────────

/**
 * This function runs INSIDE the browser page (via evaluateOnNewDocument).
 * It waits for QUnit to appear then attaches hooks that write structured
 * events to window.__opaEvents[], which the Node runner polls and consumes.
 */
function installPageHooks() {
    window.__opaEvents = [];
    window.__qunitDone = false;

    function waitForQUnit(cb) {
        if (window.QUnit) {
            cb(window.QUnit);
        } else {
            var t = setInterval(function () {
                if (window.QUnit) {
                    clearInterval(t);
                    cb(window.QUnit);
                }
            }, 100);
        }
    }

    waitForQUnit(function (QUnit) {
        // Fired when a module begins
        QUnit.moduleStart(function (details) {
            window.__opaEvents.push({
                type: "moduleStart",
                name: details.name,
                ts:   Date.now()
            });
        });

        // Fired when a single test starts
        QUnit.testStart(function (details) {
            window.__opaEvents.push({
                type:   "testStart",
                module: details.module,
                name:   details.name,
                ts:     Date.now()
            });
        });

        // Fired when a single test finishes
        QUnit.testDone(function (details) {
            window.__opaEvents.push({
                type:    "testDone",
                module:  details.module,
                name:    details.name,
                passed:  details.passed,
                failed:  details.failed,
                total:   details.total,
                runtime: details.runtime,
                ts:      Date.now()
            });
        });

        // Fired when a module finishes
        QUnit.moduleDone(function (details) {
            window.__opaEvents.push({
                type:   "moduleDone",
                name:   details.name,
                passed: details.passed,
                failed: details.failed,
                total:  details.total,
                ts:     Date.now()
            });
        });

        // Fired when the entire suite finishes
        QUnit.done(function (details) {
            window.__qunitDone    = true;
            window.__qunitDetails = details;
            window.__opaEvents.push({
                type:    "suiteDone",
                passed:  details.passed,
                failed:  details.failed,
                total:   details.total,
                runtime: details.runtime,
                ts:      Date.now()
            });
        });
    });
}

// ── Event poller: drain page events and take screenshots ─────────────────────

/**
 * Reads and clears window.__opaEvents[] from the page, takes a screenshot
 * for each meaningful event, and returns whether the suite is done.
 */
async function pollAndScreenshot(page) {
    const events = await page.evaluate(function () {
        var evts = (window.__opaEvents || []).slice();
        window.__opaEvents = [];
        return evts;
    }).catch(() => []);

    for (const evt of events) {
        let label = null;

        if (evt.type === "moduleStart") {
            label = `module_START_${evt.name}`;
            console.log(`[qunit] Module started: ${evt.name}`);

        } else if (evt.type === "testStart") {
            label = `test_START_${evt.module}__${evt.name}`;
            console.log(`[qunit] Test started: [${evt.module}] ${evt.name}`);

        } else if (evt.type === "testDone") {
            const status = evt.failed > 0 ? "FAIL" : "PASS";
            label = `test_${status}_${evt.module}__${evt.name}`;
            console.log(`[qunit] Test done (${status}): [${evt.module}] ${evt.name} — ${evt.passed}/${evt.total} assertions passed, ${evt.runtime}ms`);

        } else if (evt.type === "moduleDone") {
            const status = evt.failed > 0 ? "FAIL" : "PASS";
            label = `module_DONE_${status}_${evt.name}`;
            console.log(`[qunit] Module done (${status}): ${evt.name} — ${evt.passed}/${evt.total} passed`);

        } else if (evt.type === "suiteDone") {
            const status = evt.failed > 0 ? "FAIL" : "PASS";
            label = `suite_DONE_${status}_total${evt.total}_pass${evt.passed}_fail${evt.failed}`;
            console.log(`[qunit] Suite done (${status}): ${evt.passed}/${evt.total} passed, ${evt.runtime}ms`);
        }

        if (label) {
            const filePath = await takeScreenshot(page, label);
            if (filePath) {
                screenshotLog.push({ event: evt, file: path.basename(filePath), path: filePath });
            }
        }
    }

    const done = await page.evaluate(() => !!window.__qunitDone).catch(() => false);
    return done;
}

// ── QUnit DOM result scraper (runs inside the page) ──────────────────────────

function scrapeQUnitResults() {
    var results = {
        passed:  0,
        failed:  0,
        total:   0,
        runtime: 0,
        modules: []
    };

    var statEl = document.getElementById("qunit-testresult");
    if (statEl) {
        var statText = statEl.textContent || "";
        var mPassed  = statText.match(/(\d+)\s+passed/);
        var mFailed  = statText.match(/(\d+)\s+failed/);
        var mTotal   = statText.match(/of\s+(\d+)\s+/);
        var mRuntime = statText.match(/(\d+)\s*ms/);
        results.passed  = mPassed  ? parseInt(mPassed[1])  : 0;
        results.failed  = mFailed  ? parseInt(mFailed[1])  : 0;
        results.total   = mTotal   ? parseInt(mTotal[1])   : 0;
        results.runtime = mRuntime ? parseInt(mRuntime[1]) : 0;
    }

    var moduleMap  = {};
    var moduleOrder = [];
    var testItems  = document.querySelectorAll("#qunit-tests > li");

    testItems.forEach(function (li) {
        var moduleNameEl = li.querySelector(".module-name");
        var testNameEl   = li.querySelector(".test-name");
        var moduleName   = moduleNameEl ? moduleNameEl.textContent.trim() : "(unknown module)";
        var testName     = testNameEl   ? testNameEl.textContent.trim()   : "(unknown test)";
        var passed       = li.classList.contains("pass");
        var failed       = li.classList.contains("fail");

        if (!moduleMap[moduleName]) {
            moduleMap[moduleName] = { name: moduleName, tests: [] };
            moduleOrder.push(moduleName);
        }

        var failureMessages = [];
        if (failed) {
            li.querySelectorAll(".qunit-assert-list li.fail").forEach(function (assertLi) {
                var msgEl    = assertLi.querySelector(".test-message");
                var sourceEl = assertLi.querySelector(".test-source");
                failureMessages.push({
                    message: msgEl    ? msgEl.textContent.trim()    : "",
                    source:  sourceEl ? sourceEl.textContent.trim() : ""
                });
            });
            li.querySelectorAll(".qunit-assert-list li").forEach(function (assertLi) {
                var msgEl = assertLi.querySelector(".test-message");
                if (msgEl && msgEl.textContent.indexOf("Timeout") > -1) {
                    failureMessages.push({ message: msgEl.textContent.trim(), source: "" });
                }
            });
        }

        moduleMap[moduleName].tests.push({
            name:     testName,
            passed:   passed,
            failed:   failed,
            failures: failureMessages
        });
    });

    results.modules = moduleOrder.map(function (k) { return moduleMap[k]; });
    return results;
}

// ── Console relay ─────────────────────────────────────────────────────────────

function attachConsoleRelay(page) {
    page.on("console", function (msg) {
        const type = msg.type();
        const text = msg.text();
        if (type === "error" || type === "warning") {
            console.log(`[browser:${type}] ${text.substring(0, 300)}`);
        } else if (
            text.indexOf("OPA")    > -1 ||
            text.indexOf("Opa5")   > -1 ||
            text.indexOf("QUnit")  > -1 ||
            text.indexOf("AuthStub") > -1 ||
            text.indexOf("Test")   > -1
        ) {
            console.log(`[browser:${type}] ${text.substring(0, 300)}`);
        }
    });
    page.on("pageerror", function (err) {
        console.error(`[browser:pageerror] ${err.message}`);
    });
}

// ── Summary renderer ──────────────────────────────────────────────────────────

function renderSummary(results, timedOut, executionMs, screenshots) {
    const LINE = "═══════════════════════════════════════════════════════";
    const SEP  = "───────────────────────────────────────────────────────";
    const allOk = results.failed === 0 && !timedOut;

    console.log("\n" + LINE);
    console.log("OPA5 TEST EXECUTION SUMMARY");
    console.log(LINE);
    console.log(`Execution Mode : Headless (Chrome Headless via Puppeteer)`);
    console.log(`Duration       : ${(executionMs / 1000).toFixed(1)} seconds`);
    console.log(`Overall Status : ${allOk ? "PASSED" : "FAILED"}${timedOut ? " (TIMED OUT)" : ""}`);
    console.log("");
    console.log("JOURNEYS TESTED:");
    console.log(SEP);

    let idx = 1;
    results.modules.forEach(function (mod) {
        const passCount = mod.tests.filter(t => t.passed).length;
        const total     = mod.tests.length;
        console.log(`${idx}. ${mod.name} — ${passCount}/${total} tests passed`);
        mod.tests.forEach(function (test) {
            const icon = test.passed ? "PASS" : "FAIL";
            console.log(`   [${icon}] ${test.name}`);
            if (test.failed && test.failures.length > 0) {
                test.failures.forEach(function (f) {
                    if (f.message) {
                        console.log(`         Reason : ${f.message.substring(0, 200)}`);
                    }
                    if (f.source) {
                        console.log(`         Source : ${f.source.substring(0, 160)}`);
                    }
                });
            }
        });
        idx++;
    });

    const totalJourneys = results.modules.length;
    const totalTests    = results.total  || results.modules.reduce((s, m) => s + m.tests.length, 0);
    const totalPassed   = results.passed || results.modules.reduce((s, m) => s + m.tests.filter(t => t.passed).length, 0);
    const totalFailed   = results.failed || results.modules.reduce((s, m) => s + m.tests.filter(t => t.failed).length,  0);

    console.log("");
    console.log("OVERALL METRICS:");
    console.log(SEP);
    console.log(`  Total Journeys   : ${totalJourneys}`);
    console.log(`  Total Test Cases : ${totalTests}`);
    console.log(`  Passed           : ${totalPassed}`);
    console.log(`  Failed           : ${totalFailed}`);
    console.log(`  Skipped          : ${Math.max(0, totalTests - totalPassed - totalFailed)}`);

    if (screenshots && screenshots.length > 0) {
        console.log("");
        console.log("SCREENSHOTS CAPTURED:");
        console.log(SEP);
        screenshots.forEach(function (s) {
            console.log(`  ${s.file}`);
        });
    }

    if (totalFailed > 0 || timedOut) {
        console.log("");
        console.log("FAILURE DETAILS:");
        console.log(SEP);
        if (timedOut) {
            console.log("  TEST SUITE TIMED OUT — QUnit did not report completion within the 5-minute window.");
            console.log("  Possible causes:");
            console.log("    1. SAPUI5 CDN (sapui5.hana.ondemand.com) unreachable or slow");
            console.log("    2. An OPA5 waitFor condition never resolved (sinon stub mismatch)");
            console.log("    3. The app component failed to boot (check [browser:error] lines above)");
        }
        results.modules.forEach(function (mod) {
            mod.tests.filter(t => t.failed).forEach(function (test) {
                console.log(`\n  Journey : ${mod.name}`);
                console.log(`  Test    : ${test.name}`);
                test.failures.forEach(function (f) {
                    if (f.message) {
                        console.log(`  Reason  : ${f.message.substring(0, 300)}`);
                    }
                    if (f.source) {
                        console.log(`  Source  : ${f.source.substring(0, 200)}`);
                    }
                });
            });
        });
    }

    console.log(LINE + "\n");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    const startMs = Date.now();
    let server    = null;
    let browser   = null;
    let timedOut  = false;

    try {
        // 1. Start static server
        server = await createStaticServer(SERVE_ROOT, PORT);

        // 2. Launch Chrome headless
        console.log("[runner] Launching Chrome headless...");
        browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-web-security",
                "--allow-running-insecure-content",
                "--window-size=1280,900"
            ],
            defaultViewport: { width: 1280, height: 900 }
        });

        const page = await browser.newPage();

        // 3. Relay console + errors
        attachConsoleRelay(page);

        // 4. Inject QUnit lifecycle hooks before the page loads
        await page.evaluateOnNewDocument(installPageHooks);

        // 5. Navigate to the test page
        console.log(`[runner] Navigating to ${TEST_URL}`);
        await page.goto(TEST_URL, {
            waitUntil: "domcontentloaded",
            timeout:   30000
        });

        // 6. Screenshot: initial page load
        const initShot = await takeScreenshot(page, "000_initial_page_load");
        if (initShot) { screenshotLog.push({ event: { type: "init" }, file: path.basename(initShot), path: initShot }); }

        // 7. Wait for SAPUI5 core to appear
        console.log("[runner] Waiting for SAPUI5 core to initialize...");
        await page.waitForFunction(function () {
            return typeof window.sap !== "undefined" &&
                   typeof window.sap.ui !== "undefined";
        }, { timeout: 60000 }).catch(function () {
            console.warn("[runner] SAPUI5 did not initialize within 60s");
        });

        // Screenshot: after SAPUI5 bootstrap
        const ui5Shot = await takeScreenshot(page, "001_sapui5_bootstrapped");
        if (ui5Shot) { screenshotLog.push({ event: { type: "ui5boot" }, file: path.basename(ui5Shot), path: ui5Shot }); }

        // 8. Poll for QUnit events + screenshots until suite is done
        console.log("[runner] Polling for QUnit events and capturing screenshots...");
        const deadline = Date.now() + SUITE_TIMEOUT_MS;
        let done = false;

        while (Date.now() < deadline && !done) {
            await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
            done = await pollAndScreenshot(page);
        }

        timedOut = !done;

        if (timedOut) {
            console.warn("[runner] TIMEOUT — QUnit did not finish within the allotted time.");
            const timeoutShot = await takeScreenshot(page, "TIMEOUT_final_state");
            if (timeoutShot) { screenshotLog.push({ event: { type: "timeout" }, file: path.basename(timeoutShot), path: timeoutShot }); }
        }

        // Final screenshot: after suite completes
        const finalShot = await takeScreenshot(page, "FINAL_suite_complete");
        if (finalShot) { screenshotLog.push({ event: { type: "final" }, file: path.basename(finalShot), path: finalShot }); }

        // 9. Scrape QUnit DOM results
        console.log("[runner] Scraping QUnit results from DOM...");
        const results = await page.evaluate(scrapeQUnitResults);

        const executionMs = Date.now() - startMs;

        // 10. Render summary
        renderSummary(results, timedOut, executionMs, screenshotLog);

        // 11. Exit code
        process.exitCode = (results.failed === 0 && !timedOut) ? 0 : 1;

    } catch (err) {
        console.error("[runner] Fatal error:", err.message);
        console.error(err.stack);
        process.exitCode = 1;
    } finally {
        if (browser) {
            await browser.close().catch(() => {});
        }
        if (server) {
            server.close();
        }
    }
}

main();

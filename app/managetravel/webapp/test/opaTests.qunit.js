/**
 * opaTests.qunit.js
 *
 * QUnit / OPA5 bootstrap for the TravelHub integration test suite.
 *
 * Responsibilities:
 *   1. Configure OPA5 global settings (autoWait, timeouts)
 *   2. Install the AuthStub (sinon.fakeServer) before any test runs so that ALL
 *      XHR calls from the app component are intercepted
 *   3. Require AllJourneys to register the QUnit modules + tests
 *   4. Restore the AuthStub once all tests complete
 *
 * App start strategy — iStartMyUIComponent (not iStartMyAppInAFrame):
 *   The app Component is started in-process within the same window as the test runner.
 *   This means sinon.fakeServer — which replaces window.XMLHttpRequest — intercepts
 *   every XHR call made by the app without needing same-origin iframe tricks.
 *
 *   Trade-off: the app shares the same DOM with QUnit's results panel. OPA5
 *   creates a dedicated "OpaFrame" div and manages it, so there is no visual
 *   conflict in practice.
 */
sap.ui.define([
    "sap/ui/test/Opa5",
    "sap/ui/test/opaQunit",
    "./integration/mockserver/AuthStub",
    "./integration/AllJourneys"
], function (Opa5, opaQunit, AuthStub) {
    "use strict";

    // ── Install sinon fake XHR server ────────────────────────────────────────
    //
    // AuthStub.init() must be called BEFORE Opa5 starts processing waitFor queues
    // so the server is active when the app Component boots and fires its first
    // $metadata + auth XHR calls.
    AuthStub.init();

    // ── OPA5 global configuration ────────────────────────────────────────────
    Opa5.extendConfig({
        // autoWait: true makes OPA5 wait for SAPUI5 rendering, open requests, and
        // pending setTimeout callbacks to settle before polling each waitFor.
        autoWait: true,

        // Maximum time (seconds) to wait for any single waitFor condition.
        timeout: 30,

        // How often (milliseconds) OPA5 re-checks a waitFor condition.
        pollingInterval: 400,

        // ── Global arrangements ───────────────────────────────────────────────
        // iClearTheSession() deletes the three auth cookies that the app stores on
        // login (th_access, th_refresh, th_user).  Call this BEFORE every
        // iStartMyUIComponent that expects to see the Login page — otherwise the
        // Component's _resolveStartupRoute() finds the cookie from the previous
        // test and skips straight to the TravellerDashboard.
        arrangements: new Opa5({
            iClearTheSession: function () {
                return this.waitFor({
                    success: function () {
                        ["th_access", "th_refresh", "th_user"].forEach(function (sName) {
                            document.cookie = sName + "=;path=/;max-age=0;SameSite=Strict";
                        });
                        Opa5.assert.ok(true, "Auth cookies cleared before component start");
                    },
                    errorMessage: "Could not clear auth cookies"
                });
            }
        })
    });

    // ── Tear down the sinon server after all QUnit tests finish ──────────────
    QUnit.done(function () {
        AuthStub.restore();
    });

    // AllJourneys was required above via the dependency array.
    // Each journey file registers its own QUnit.module + opaTest calls upon load.
    // QUnit auto-starts when all synchronous setup is complete.
});

/**
 * TravelledLocationsJourney.js
 *
 * End-to-end OPA5 journey covering:
 *   1. Login with traveller credentials (raj.sharma@example.com / Welcome1!)
 *   2. Post-login navigation to the TravellerDashboard
 *   3. Opening the "Travelled Locations" IconTabFilter
 *   4. Verifying the locations table contains rows
 *   5. Clicking a row and navigating to TravelDetail
 *   6. Cross-verifying that the detail screen shows the SAME data as the source row
 *
 * App start strategy:
 *   Uses iStartMyUIComponent (programmatic in-process start) rather than
 *   iStartMyAppInAFrame so that the sinon.fakeServer installed in opaTests.qunit.js
 *   intercepts XHR from both the test runner and the app — no iframe window isolation.
 *
 * Data cross-verification:
 *   iClickTheFirstLocationRow() writes a snapshot of the selected row's OData binding
 *   properties to window._opaLocationRowData BEFORE firing the row press / navigation.
 *   iShouldSeeDetailDataMatchingSourceRow() reads that snapshot to assert the same
 *   field values appear on the TravelDetail screen.
 *
 * Test credentials:
 *   Email   : raj.sharma@example.com
 *   Password: Welcome1!
 */
sap.ui.define([
    "sap/ui/test/opaQunit",
    "sap/ui/test/Opa5",
    "./pages/LoginPage",
    "./pages/TravellerDashboardPage",
    "./pages/TravelDetailPage"
], function (opaTest, Opa5) {
    "use strict";

    // ── Module 1: Login ──────────────────────────────────────────────────────

    QUnit.module("Login Flow", {
        beforeEach: function () {
            // Reset the captured row data before each test
            window._opaLocationRowData = null;
        }
    });

    opaTest("Should show the Login page on first load", function (Given, When, Then) {

        // Arrange: start the component programmatically in the same window
        Given.iStartMyUIComponent({
            componentConfig: {
                name: "anubhav.claude.managetravel",
                async: true
            }
        });

        // Assert: login form is the first screen
        Then.onTheLoginPage.iShouldSeeTheLoginPage();

        Then.iTeardownMyUIComponent();
    });

    opaTest("Should navigate to TravellerDashboard after successful login", function (Given, When, Then) {

        // Clear auth cookies from any previous test so Component._resolveStartupRoute()
        // returns "" (login) rather than skipping straight to the dashboard.
        Given.iClearTheSession();

        Given.iStartMyUIComponent({
            componentConfig: {
                name: "anubhav.claude.managetravel",
                async: true
            }
        });

        // Assert login page first
        Then.onTheLoginPage.iShouldSeeTheLoginPage();

        // Act: enter credentials and submit
        When.onTheLoginPage.iEnterTheEmail("raj.sharma@example.com");
        When.onTheLoginPage.iEnterThePassword("Welcome1!");
        When.onTheLoginPage.iPressTheLoginButton();

        // Assert: TravellerDashboard is now visible
        Then.onTheTravellerDashboardPage.iShouldSeeTheTravellerDashboard();

        Then.iTeardownMyUIComponent();
    });

    // ── Module 2: Travelled Locations Tab ────────────────────────────────────

    QUnit.module("Travelled Locations Tab", {
        beforeEach: function () {
            window._opaLocationRowData = null;
        }
    });

    opaTest("Should display the Travelled Locations table with data after selecting the tab", function (Given, When, Then) {

        // Clear auth cookies from any previous test so we always start at Login.
        Given.iClearTheSession();

        // Arrange: start + login (self-contained so this module can run standalone)
        Given.iStartMyUIComponent({
            componentConfig: {
                name: "anubhav.claude.managetravel",
                async: true
            }
        });
        When.onTheLoginPage.iEnterTheEmail("raj.sharma@example.com");
        When.onTheLoginPage.iEnterThePassword("Welcome1!");
        When.onTheLoginPage.iPressTheLoginButton();

        // Pre-condition: dashboard is visible
        Then.onTheTravellerDashboardPage.iShouldSeeTheTravellerDashboard();

        // Act: select the "Travelled Locations" tab
        When.onTheTravellerDashboardPage.iSelectTheTravelledLocationsTab();

        // Assert: table is visible with at least one row
        Then.onTheTravellerDashboardPage.iShouldSeeTheTravelledLocationsTab();
        Then.onTheTravellerDashboardPage.iShouldSeeAtLeastOneLocationRow();

        Then.iTeardownMyUIComponent();
    });

    // ── Module 3: Row Navigation + Data Cross-Verification ───────────────────

    QUnit.module("TravelDetail Navigation and Data Cross-Verification", {
        beforeEach: function () {
            window._opaLocationRowData = null;
        }
    });

    opaTest("Should navigate to TravelDetail when a row is clicked", function (Given, When, Then) {

        Given.iClearTheSession();

        Given.iStartMyUIComponent({
            componentConfig: {
                name: "anubhav.claude.managetravel",
                async: true
            }
        });
        When.onTheLoginPage.iEnterTheEmail("raj.sharma@example.com");
        When.onTheLoginPage.iEnterThePassword("Welcome1!");
        When.onTheLoginPage.iPressTheLoginButton();

        Then.onTheTravellerDashboardPage.iShouldSeeTheTravellerDashboard();
        When.onTheTravellerDashboardPage.iSelectTheTravelledLocationsTab();
        Then.onTheTravellerDashboardPage.iShouldSeeAtLeastOneLocationRow();

        // Act: click the first row.
        // iClickTheFirstLocationRow captures the row binding properties into
        // window._opaLocationRowData BEFORE the navigation fires.
        When.onTheTravellerDashboardPage.iClickTheFirstLocationRow();

        // Assert: TravelDetail page must appear
        Then.onTheTravelDetailPage.iShouldSeeTheTravelDetailPage();

        Then.iTeardownMyUIComponent();
    });

    opaTest("Should show detail data that exactly matches the source row data", function (Given, When, Then) {

        Given.iClearTheSession();

        Given.iStartMyUIComponent({
            componentConfig: {
                name: "anubhav.claude.managetravel",
                async: true
            }
        });
        When.onTheLoginPage.iEnterTheEmail("raj.sharma@example.com");
        When.onTheLoginPage.iEnterThePassword("Welcome1!");
        When.onTheLoginPage.iPressTheLoginButton();

        Then.onTheTravellerDashboardPage.iShouldSeeTheTravellerDashboard();
        When.onTheTravellerDashboardPage.iSelectTheTravelledLocationsTab();
        Then.onTheTravellerDashboardPage.iShouldSeeAtLeastOneLocationRow();

        // Act: capture row data + navigate
        When.onTheTravellerDashboardPage.iClickTheFirstLocationRow();

        // Assert: TravelDetail is visible
        Then.onTheTravelDetailPage.iShouldSeeTheTravelDetailPage();

        // Core assertion: data on detail screen MUST match the snapshot captured
        // from the source row before navigation.
        Then.waitFor({
            success: function () {
                var oRowData = window._opaLocationRowData;
                Opa5.assert.ok(
                    oRowData && typeof oRowData === "object",
                    "Source row data was captured before navigation (window._opaLocationRowData is populated)"
                );
                if (oRowData) {
                    Then.onTheTravelDetailPage.iShouldSeeDetailDataMatchingSourceRow(oRowData);
                }
            },
            errorMessage: "window._opaLocationRowData was not populated by iClickTheFirstLocationRow — data capture step failed"
        });

        Then.iTeardownMyUIComponent();
    });

    opaTest("Should navigate back to TravellerDashboard when Back is pressed on TravelDetail", function (Given, When, Then) {

        Given.iClearTheSession();

        Given.iStartMyUIComponent({
            componentConfig: {
                name: "anubhav.claude.managetravel",
                async: true
            }
        });
        When.onTheLoginPage.iEnterTheEmail("raj.sharma@example.com");
        When.onTheLoginPage.iEnterThePassword("Welcome1!");
        When.onTheLoginPage.iPressTheLoginButton();

        Then.onTheTravellerDashboardPage.iShouldSeeTheTravellerDashboard();
        When.onTheTravellerDashboardPage.iSelectTheTravelledLocationsTab();
        Then.onTheTravellerDashboardPage.iShouldSeeAtLeastOneLocationRow();
        When.onTheTravellerDashboardPage.iClickTheFirstLocationRow();
        Then.onTheTravelDetailPage.iShouldSeeTheTravelDetailPage();

        // Act: press the Back button (id=backBtn, TravelDetail.view.xml footer)
        When.onTheTravelDetailPage.iPressTheBackButton();

        // Assert: back on the dashboard
        Then.onTheTravellerDashboardPage.iShouldSeeTheTravellerDashboard();

        Then.iTeardownMyUIComponent();
    });
});

/**
 * LoginPage.js
 *
 * OPA5 page object for the Login view.
 * View name : Login  (viewId: "login", defined in manifest.json routing targets)
 * View namespace: anubhav.claude.managetravel.view
 *
 * Exposes Arrangements, Actions, and Assertions for login-related steps.
 */
sap.ui.define([
    "sap/ui/test/Opa5",
    "sap/ui/test/actions/EnterText",
    "sap/ui/test/actions/Press",
    "sap/ui/test/matchers/PropertyStrictEquals"
], function (Opa5, EnterText, Press, PropertyStrictEquals) {
    "use strict";

    var VIEW_NAME = "Login";
    var VIEW_NAMESPACE = "anubhav.claude.managetravel.view";

    // ── Arrangements ─────────────────────────────────────────────────────────

    Opa5.createPageObjects({

        // ── Login screen arrangements & actions ───────────────────────────────
        onTheLoginPage: {

            actions: {

                /**
                 * Types the email address into the email input field.
                 * The field ID is "inEmail" (Login.view.xml, line 18).
                 * @param {string} sEmail
                 */
                iEnterTheEmail: function (sEmail) {
                    return this.waitFor({
                        id: "inEmail",
                        viewName: VIEW_NAME,
                        viewNamespace: VIEW_NAMESPACE,
                        actions: new EnterText({ text: sEmail, clearTextFirst: true }),
                        errorMessage: "Could not find the email input field (id=inEmail) on the Login view"
                    });
                },

                /**
                 * Types the password into the password input field.
                 * The field ID is "inPassword" (Login.view.xml, line 25).
                 * @param {string} sPassword
                 */
                iEnterThePassword: function (sPassword) {
                    return this.waitFor({
                        id: "inPassword",
                        viewName: VIEW_NAME,
                        viewNamespace: VIEW_NAMESPACE,
                        actions: new EnterText({ text: sPassword, clearTextFirst: true }),
                        errorMessage: "Could not find the password input field (id=inPassword) on the Login view"
                    });
                },

                /**
                 * Presses the Login button.
                 * The button has text bound to {i18n>login.button} = "Login" and
                 * is an sap.m.Button with type "Emphasized" (Login.view.xml, line 33).
                 */
                iPressTheLoginButton: function () {
                    return this.waitFor({
                        viewName: VIEW_NAME,
                        viewNamespace: VIEW_NAMESPACE,
                        controlType: "sap.m.Button",
                        matchers: new PropertyStrictEquals({ name: "type", value: "Emphasized" }),
                        actions: new Press(),
                        errorMessage: "Could not find the Login button (Emphasized type) on the Login view"
                    });
                }
            },

            assertions: {

                /**
                 * Verifies the Login page is currently displayed by checking for
                 * the email input which is unique to this view.
                 */
                iShouldSeeTheLoginPage: function () {
                    return this.waitFor({
                        id: "inEmail",
                        viewName: VIEW_NAME,
                        viewNamespace: VIEW_NAMESPACE,
                        success: function () {
                            Opa5.assert.ok(true, "The Login page is visible (inEmail input found)");
                        },
                        errorMessage: "The Login page is not visible — inEmail input not found"
                    });
                }
            }
        }
    });
});

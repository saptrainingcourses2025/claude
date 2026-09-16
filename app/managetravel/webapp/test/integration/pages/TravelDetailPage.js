/**
 * TravelDetailPage.js
 *
 * OPA5 page object for the TravelDetail view.
 * View name : TravelDetail  (viewId: "travelDetail")
 * View namespace: anubhav.claude.managetravel.view
 *
 * Key controls (IDs from TravelDetail.view.xml):
 *   - travelDetailPage    : sap.m.Page
 *   - travelHeader        : sap.m.ObjectHeader  (title={destination/name}, intro={destination/city})
 *   - travelDetailsPanel  : sap.m.Panel
 *   - travelDetailsForm   : sap.ui.layout.form.SimpleForm
 *   - backBtn             : sap.m.Button (footer)
 *
 * Data displayed on TravelDetail (used for cross-screen assertions):
 *   - ObjectHeader title  : destination/name
 *   - ObjectHeader intro  : destination/city
 *   - ObjectAttribute "Travel From" : travelFrom (formatted as medium date)
 *   - ObjectAttribute "Travel To"   : travelTo   (formatted as medium date)
 *   - ObjectStatus "Cost"           : cost + " " + currency_code
 *   - SimpleForm sap.m.Text controls for: destination/name, destination/city,
 *     destination/country, travelFrom, travelTo, cost, notes
 *
 * The formatAmount formatter in TravelDetail.controller.js outputs:
 *   nCost.toFixed(2) + " " + sCurrency   e.g. "1250.00 EUR"
 */
sap.ui.define([
    "sap/ui/test/Opa5",
    "sap/ui/test/actions/Press",
    "sap/ui/test/matchers/PropertyStrictEquals",
    "sap/ui/test/matchers/Ancestor"
], function (Opa5, Press, PropertyStrictEquals, Ancestor) {
    "use strict";

    var VIEW_NAME = "TravelDetail";
    var VIEW_NAMESPACE = "anubhav.claude.managetravel.view";

    Opa5.createPageObjects({

        onTheTravelDetailPage: {

            actions: {

                /**
                 * Presses the Back button on the detail page footer.
                 * ID: "backBtn" (TravelDetail.view.xml, line 88)
                 */
                iPressTheBackButton: function () {
                    return this.waitFor({
                        id: "backBtn",
                        viewName: VIEW_NAME,
                        viewNamespace: VIEW_NAMESPACE,
                        actions: new Press(),
                        errorMessage: "Could not find the Back button (id=backBtn) on the TravelDetail view"
                    });
                }
            },

            assertions: {

                /**
                 * Verifies the TravelDetail page (id=travelDetailPage) is displayed.
                 */
                iShouldSeeTheTravelDetailPage: function () {
                    return this.waitFor({
                        id: "travelDetailPage",
                        viewName: VIEW_NAME,
                        viewNamespace: VIEW_NAMESPACE,
                        success: function (oPage) {
                            Opa5.assert.ok(oPage.getVisible(),
                                "The TravelDetail page (id=travelDetailPage) is visible");
                        },
                        errorMessage: "TravelDetail page (id=travelDetailPage) did not appear after row click"
                    });
                },

                /**
                 * Verifies the ObjectHeader title matches the destination name
                 * captured from the source row on the dashboard.
                 *
                 * ObjectHeader ID: "travelHeader" (TravelDetail.view.xml, line 12)
                 * title binding: {destination/name}
                 *
                 * @param {string} sExpectedName  The destination name captured from the table row
                 */
                iShouldSeeTheDestinationNameInHeader: function (sExpectedName) {
                    return this.waitFor({
                        id: "travelHeader",
                        viewName: VIEW_NAME,
                        viewNamespace: VIEW_NAMESPACE,
                        matchers: new PropertyStrictEquals({ name: "title", value: sExpectedName }),
                        success: function (oHeader) {
                            Opa5.assert.strictEqual(
                                oHeader.getTitle(),
                                sExpectedName,
                                "ObjectHeader title '" + oHeader.getTitle() + "' matches the captured destination name '" + sExpectedName + "'"
                            );
                        },
                        errorMessage: "ObjectHeader (id=travelHeader) title does not match expected destination name '" + sExpectedName + "'"
                    });
                },

                /**
                 * Verifies the ObjectHeader intro matches the destination city
                 * captured from the source row on the dashboard.
                 *
                 * intro binding: {destination/city}
                 *
                 * @param {string} sExpectedCity  The destination city captured from the table row
                 */
                iShouldSeeTheDestinationCityInHeader: function (sExpectedCity) {
                    return this.waitFor({
                        id: "travelHeader",
                        viewName: VIEW_NAME,
                        viewNamespace: VIEW_NAMESPACE,
                        matchers: new PropertyStrictEquals({ name: "intro", value: sExpectedCity }),
                        success: function (oHeader) {
                            Opa5.assert.strictEqual(
                                oHeader.getIntro(),
                                sExpectedCity,
                                "ObjectHeader intro '" + oHeader.getIntro() + "' matches the captured destination city '" + sExpectedCity + "'"
                            );
                        },
                        errorMessage: "ObjectHeader (id=travelHeader) intro does not match expected city '" + sExpectedCity + "'"
                    });
                },

                /**
                 * Verifies the form's "Notes" sap.m.Text control contains the exact
                 * notes value captured from the source row.
                 *
                 * The SimpleForm in travelDetailsForm has a sap.m.Text for notes
                 * (last child — binding: {notes}).
                 *
                 * Strategy: find all sap.m.Text controls inside travelDetailsPanel
                 * and check one of them matches the expected notes text.
                 *
                 * @param {string} sExpectedNotes  The notes string captured from the table row
                 */
                iShouldSeeTheNotesMatchingSourceRow: function (sExpectedNotes) {
                    return this.waitFor({
                        id: "travelDetailsPanel",
                        viewName: VIEW_NAME,
                        viewNamespace: VIEW_NAMESPACE,
                        check: function (oPanel) {
                            var aTexts = oPanel.findAggregatedObjects(true, function (oCtrl) {
                                return oCtrl.isA && oCtrl.isA("sap.m.Text");
                            });
                            return aTexts.some(function (oText) {
                                return oText.getText() === sExpectedNotes;
                            });
                        },
                        success: function (oPanel) {
                            var aTexts = oPanel.findAggregatedObjects(true, function (oCtrl) {
                                return oCtrl.isA && oCtrl.isA("sap.m.Text");
                            });
                            var bFound = aTexts.some(function (oText) {
                                return oText.getText() === sExpectedNotes;
                            });
                            Opa5.assert.ok(bFound,
                                "Found a sap.m.Text with notes value '" + sExpectedNotes + "' inside travelDetailsPanel — matches source row");
                        },
                        errorMessage: "Could not find a Text control with notes '" + sExpectedNotes + "' inside travelDetailsPanel"
                    });
                },

                /**
                 * Core cross-screen data integrity assertion.
                 *
                 * Compares the data object captured from the source table row
                 * (stored on window._opaLocationRowData by TravellerDashboardPage)
                 * against what is actually rendered on the detail screen.
                 *
                 * Checks verified:
                 *   1. ObjectHeader title  === destination/name
                 *   2. ObjectHeader intro  === destination/city
                 *   3. A Text in the form  === notes value from source row
                 *   4. A Text in the form  === formatted cost string from source row
                 *
                 * @param {object} oSourceRowData  The data captured before navigation
                 *   {destinationName, destinationCity, notes, cost, currency_code, ...}
                 */
                iShouldSeeDetailDataMatchingSourceRow: function (oSourceRowData) {
                    var that = this;

                    // 1. Destination name in ObjectHeader title
                    if (oSourceRowData.destinationName) {
                        that.iShouldSeeTheDestinationNameInHeader(oSourceRowData.destinationName);
                    }

                    // 2. Destination city in ObjectHeader intro
                    if (oSourceRowData.destinationCity) {
                        that.iShouldSeeTheDestinationCityInHeader(oSourceRowData.destinationCity);
                    }

                    // 3. Notes text inside the form
                    if (oSourceRowData.notes) {
                        that.iShouldSeeTheNotesMatchingSourceRow(oSourceRowData.notes);
                    }

                    // 4. Formatted cost: matches TravelDetail.controller.js formatAmount output
                    //    nCost.toFixed(2) + " " + sCurrency  e.g. "1250.00 EUR"
                    if (oSourceRowData.cost !== undefined && oSourceRowData.currency_code) {
                        var nCost = parseFloat(oSourceRowData.cost);
                        var sExpectedCost = (!isNaN(nCost) ? nCost.toFixed(2) : String(oSourceRowData.cost)) +
                            " " + oSourceRowData.currency_code;

                        // Use a check function so OPA5 keeps polling until the composite
                        // binding has resolved and the Text control shows the formatted value.
                        that.waitFor({
                            id: "travelDetailsPanel",
                            viewName: VIEW_NAME,
                            viewNamespace: VIEW_NAMESPACE,
                            check: function (oPanel) {
                                var aTexts = oPanel.findAggregatedObjects(true, function (oCtrl) {
                                    return oCtrl.isA && oCtrl.isA("sap.m.Text");
                                });
                                return aTexts.some(function (oText) {
                                    return oText.getText() === sExpectedCost;
                                });
                            },
                            success: function (oPanel) {
                                var aTexts = oPanel.findAggregatedObjects(true, function (oCtrl) {
                                    return oCtrl.isA && oCtrl.isA("sap.m.Text");
                                });
                                var bFound = aTexts.some(function (oText) {
                                    return oText.getText() === sExpectedCost;
                                });
                                Opa5.assert.ok(bFound,
                                    "Found formatted cost '" + sExpectedCost + "' in travelDetailsPanel — matches source row (cost=" +
                                    oSourceRowData.cost + ", currency=" + oSourceRowData.currency_code + ")");
                            },
                            errorMessage: "Could not find formatted cost '" + sExpectedCost + "' in travelDetailsPanel — expected a sap.m.Text with text '" + sExpectedCost + "'"
                        });
                    }

                    return this;
                }
            }
        }
    });
});

/**
 * TravellerDashboardPage.js
 *
 * OPA5 page object for the TravellerDashboard view.
 * View name : TravellerDashboard  (viewId: "travellerDashboard")
 * View namespace: anubhav.claude.managetravel.view
 *
 * Key controls (all IDs taken from the actual view / fragment XMLs):
 *   - travellerPage       : the sap.m.Page (TravellerDashboard.view.xml)
 *   - travellerTabs       : sap.m.IconTabBar (TravellerDashboard.view.xml, line 16)
 *   - locationsTable      : sap.m.Table (TravelledLocationsTab.fragment.xml, line 2)
 *     NOTE: Fragment controls are rendered under the dashboard view's controller,
 *     so viewName lookup works — they share the same view instance.
 */
sap.ui.define([
    "sap/ui/test/Opa5",
    "sap/ui/test/actions/Press",
    "sap/ui/test/matchers/PropertyStrictEquals",
    "sap/ui/test/matchers/AggregationLengthEquals",
    "sap/ui/test/matchers/AggregationFilled"
], function (Opa5, Press, PropertyStrictEquals, AggregationLengthEquals, AggregationFilled) {
    "use strict";

    var VIEW_NAME = "TravellerDashboard";
    var VIEW_NAMESPACE = "anubhav.claude.managetravel.view";

    Opa5.createPageObjects({

        onTheTravellerDashboardPage: {

            actions: {

                /**
                 * Selects the "Travelled Locations" IconTabFilter by its key "locations".
                 * (TravellerDashboard.view.xml, line 21: key="locations")
                 */
                iSelectTheTravelledLocationsTab: function () {
                    return this.waitFor({
                        id: "travellerTabs",
                        viewName: VIEW_NAME,
                        viewNamespace: VIEW_NAMESPACE,
                        success: function (oTabBar) {
                            // Find the filter with key "locations" and press it
                            var aItems = oTabBar.getItems();
                            var oTarget = null;
                            aItems.forEach(function (oItem) {
                                if (oItem.getKey && oItem.getKey() === "locations") {
                                    oTarget = oItem;
                                }
                            });
                            if (!oTarget) {
                                Opa5.assert.ok(false, "Could not find IconTabFilter with key 'locations'");
                                return;
                            }
                            oTabBar.setSelectedKey("locations");
                            oTabBar.fireSelect({ selectedKey: "locations", selectedItem: oTarget });
                        },
                        errorMessage: "Could not find the IconTabBar (id=travellerTabs) on the TravellerDashboard view"
                    });
                },

                /**
                 * Clicks (presses) the first row of the locationsTable.
                 * Stores the row's data on the OPA5 context object so the journey
                 * can use it in the cross-screen assertion.
                 *
                 * The table item type is "Navigation" so itemPress fires on row whitespace
                 * and the chevron icon, which is what the controller's onLocationPress handles.
                 */
                iClickTheFirstLocationRow: function () {
                    return this.waitFor({
                        id: "locationsTable",
                        viewName: VIEW_NAME,
                        viewNamespace: VIEW_NAMESPACE,
                        matchers: new AggregationFilled({ name: "items" }),
                        success: function (oTable) {
                            var aItems = oTable.getItems();
                            if (!aItems || !aItems.length) {
                                Opa5.assert.ok(false, "locationsTable has no items to click");
                                return;
                            }
                            var oFirstItem = aItems[0];
                            var oCtx = oFirstItem.getBindingContext();

                            // Capture row data BEFORE navigation so we can cross-verify on the
                            // detail screen. Store on the window (accessible across OPA waitFor calls).
                            if (oCtx) {
                                window._opaLocationRowData = {
                                    destination_ID: oCtx.getProperty("destination_ID"),
                                    destinationName: oCtx.getProperty("destination/name"),
                                    destinationCity: oCtx.getProperty("destination/city"),
                                    travelFrom: oCtx.getProperty("travelFrom"),
                                    travelTo: oCtx.getProperty("travelTo"),
                                    notes: oCtx.getProperty("notes"),
                                    cost: oCtx.getProperty("cost"),
                                    currency_code: oCtx.getProperty("currency_code")
                                };
                            }

                            // Fire the itemPress event — matches what happens when the user
                            // clicks the row outside of an editable cell.
                            oTable.fireItemPress({ listItem: oFirstItem });
                        },
                        errorMessage: "locationsTable (id=locationsTable) had no items after waiting"
                    });
                }
            },

            assertions: {

                /**
                 * Verifies the TravellerDashboard page (id=travellerPage) is visible.
                 */
                iShouldSeeTheTravellerDashboard: function () {
                    return this.waitFor({
                        id: "travellerPage",
                        viewName: VIEW_NAME,
                        viewNamespace: VIEW_NAMESPACE,
                        success: function (oPage) {
                            Opa5.assert.ok(oPage.getVisible(), "The TravellerDashboard page (id=travellerPage) is visible");
                        },
                        errorMessage: "TravellerDashboard page (id=travellerPage) is not visible after login"
                    });
                },

                /**
                 * Verifies the Travelled Locations tab content is visible by
                 * confirming the locationsTable is rendered and in the DOM.
                 */
                iShouldSeeTheTravelledLocationsTab: function () {
                    return this.waitFor({
                        id: "locationsTable",
                        viewName: VIEW_NAME,
                        viewNamespace: VIEW_NAMESPACE,
                        success: function (oTable) {
                            Opa5.assert.ok(oTable.getVisible(), "The locationsTable (id=locationsTable) is visible inside the Travelled Locations tab");
                        },
                        errorMessage: "locationsTable (id=locationsTable) is not visible — the Travelled Locations tab may not have been selected"
                    });
                },

                /**
                 * Verifies the locationsTable has at least one row rendered.
                 * This catches cases where the table is visible but has no data.
                 */
                iShouldSeeAtLeastOneLocationRow: function () {
                    return this.waitFor({
                        id: "locationsTable",
                        viewName: VIEW_NAME,
                        viewNamespace: VIEW_NAMESPACE,
                        matchers: new AggregationFilled({ name: "items" }),
                        success: function (oTable) {
                            var iCount = oTable.getItems().length;
                            Opa5.assert.ok(iCount > 0,
                                "locationsTable has " + iCount + " row(s) — at least one row is displayed");
                        },
                        errorMessage: "locationsTable (id=locationsTable) has no items — expected at least one row"
                    });
                }
            }
        }
    });
});

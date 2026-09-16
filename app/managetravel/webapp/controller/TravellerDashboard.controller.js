sap.ui.define([
    "anubhav/claude/managetravel/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (BaseController, JSONModel, MessageToast) {
    "use strict";

    var GROUP     = "travellerChanges";
    var TRIPS_URL = "/odata/v4/catalog/TravelledLocations?$expand=destination";

    return BaseController.extend("anubhav.claude.managetravel.controller.TravellerDashboard", {

        onInit: function () {
            this.getView().setModel(new JSONModel({ title: "My Spend per Destination", data: [] }), "chart");
            this.getRouter().getRoute("travellerDashboard").attachPatternMatched(this._onMatched, this);
        },

        _onMatched: function () {
            if (!this.getUserModel().getProperty("/loginName")) {
                this.hydrateUserFromCookie();
            }
            if (!this._guardRole()) {
                return;
            }
            var that = this;
            this.ensureValidToken().then(
                function () {
                    that.attachAuthHeaderToODataModel();
                    that._bindTraveller();
                    that._loadDonut();
                },
                function () { that.onLogout(); }
            );
        },

        // Bind the single own Travellers row (row-level @restrict returns only it).
        _bindTraveller: function () {
            var that = this;
            var oModel = this.getODataModel();
            this._oTravBinding = oModel.bindList("/Travellers", undefined, undefined, undefined, {
                $$updateGroupId: GROUP,
                $expand: "addressType"
            });
            this._oTravBinding.requestContexts(0, 1).then(
                function (aCtx) {
                    if (!aCtx || !aCtx.length) {
                        that.showError("No traveller profile found for this account. Please contact an admin.");
                        return;
                    }
                    that.getView().setBindingContext(aCtx[0]);
                },
                function (oErr) { that.showError(oErr); }
            );
        },

        // Spend per destination, currency-aware: slices split by destination+currency
        // (e.g. "Paris (EUR)") so amounts across currencies are never summed together.
        // Returns a Promise so callers can chain UI effects after the chart is refreshed.
        _loadDonut: function () {
            var that = this;
            return this._ajax(TRIPS_URL, "GET").then(
                function (oRes) {
                    var mSpend = {};
                    (oRes.value || []).forEach(function (t) {
                        var sDest = (t.destination && (t.destination.name || t.destination.city)) || "Unknown";
                        var sCur  = t.currency_code || "—";
                        var sKey  = sDest + " (" + sCur + ")";
                        mSpend[sKey] = (mSpend[sKey] || 0) + (parseFloat(t.cost) || 0);
                    });
                    that.getView().getModel("chart").setProperty("/data",
                        Object.keys(mSpend).map(function (k) {
                            return { name: k, value: Math.round(mSpend[k] * 100) / 100 };
                        }));
                },
                function (jqXHR) { that.showError(jqXHR); }
            );
        },

        _pulseDonut: function () {
            var oPanel = this.byId("donutPanel");
            if (!oPanel) { return; }
            if (this._donutPulseTimer) {
                clearTimeout(this._donutPulseTimer);
                oPanel.removeStyleClass("thDonutGlow");
            }
            // Re-trigger animation by toggling class on next tick
            setTimeout(function () { oPanel.addStyleClass("thDonutGlow"); }, 0);
            this._donutPulseTimer = setTimeout(function () {
                oPanel.removeStyleClass("thDonutGlow");
            }, 10000);
        },

        _locationsBinding: function () {
            var oTable = this.byId("locationsTable");
            return oTable && oTable.getBinding("items");
        },

        onAddLocation: function () {
            var oBinding = this._locationsBinding();
            if (!oBinding) {
                MessageToast.show("Profile is still loading — please retry.");
                return;
            }
            oBinding.create({ notes: "" });
        },

        // Two-way bind on the Currency Select alone isn't enough: the
        // @Measures.ISOCurrency: currency.code annotation on cost makes V4
        // serialize a `currency: { code: null }` navigation alongside the FK,
        // and on the server the null nav overrides the FK so the column ends
        // up null. We force the nav to mirror the FK so both agree.
        onCurrencyChange: function (oEvent) {
            var oSelect = oEvent.getSource();
            var oCtx    = oSelect.getBindingContext();
            if (!oCtx) { return; }
            var oItem   = oEvent.getParameter("selectedItem");
            var sCode   = oItem ? oItem.getKey() : oSelect.getSelectedKey();
            oCtx.setProperty("currency_code", sCode || null);
            oCtx.setProperty("currency/code",  sCode || null);
        },

        // Row click on Travelled Locations → open the read-only detail view.
        // Editable cells (Input/Select/DatePicker) absorb their own clicks,
        // so this only fires for clicks on row whitespace or the chevron.
        onLocationPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oCtx  = oItem && oItem.getBindingContext();
            if (!oCtx) {
                return;
            }
            if (oCtx.isTransient && oCtx.isTransient()) {
                MessageToast.show("Save the new row before viewing details.");
                return;
            }
            var sId = oCtx.getProperty("ID");
            if (!sId) {
                return;
            }
            this.getRouter().navTo("travelDetail", { locationId: sId });
        },

        onDeleteLocation: function () {
            var oTable = this.byId("locationsTable");
            var aItems = oTable.getSelectedItems();
            if (!aItems.length) {
                MessageToast.show("Select at least one row to delete.");
                return;
            }
            var that = this;
            aItems.forEach(function (oItem) {
                oItem.getBindingContext().delete(GROUP).catch(function (oErr) {
                    that.showError(oErr);
                });
            });
            oTable.removeSelections(true);
        },

        _addressesBinding: function () {
            var oTable = this.byId("addressesTable");
            return oTable && oTable.getBinding("items");
        },

        onAddAddress: function () {
            var oBinding = this._addressesBinding();
            if (!oBinding) {
                MessageToast.show("Profile is still loading — please retry.");
                return;
            }
            oBinding.create({ street: "", city: "", isPrimary: false });
        },

        onDeleteAddress: function () {
            var oTable = this.byId("addressesTable");
            var aItems = oTable.getSelectedItems();
            if (!aItems.length) {
                MessageToast.show("Select at least one address to delete.");
                return;
            }
            var that = this;
            aItems.forEach(function (oItem) {
                oItem.getBindingContext().delete(GROUP).catch(function (oErr) {
                    that.showError(oErr);
                });
            });
            oTable.removeSelections(true);
        },

        // Single Save — flushes queued profile + location + address changes in one $batch.
        onSave: function () {
            var that = this;
            var oModel = this.getODataModel();
            oModel.submitBatch(GROUP).then(
                function () {
                    if (oModel.hasPendingChanges(GROUP)) {
                        // Surface the actual server-side error from the MessageManager
                        // (OData V4 deposits parsed $batch errors there when individual
                        // creates/updates fail without rejecting the batch promise).
                        var oMM = sap.ui.getCore && sap.ui.getCore().getMessageManager
                                && sap.ui.getCore().getMessageManager();
                        var aMsgs = oMM ? (oMM.getMessageModel().getData() || []) : [];
                        var sDetails = aMsgs
                            .filter(function (m) { return m.type === "Error" || m.type === "Warning"; })
                            .map(function (m) { return m.message; })
                            .join("\n");
                        that.showError(sDetails || "Some changes could not be saved. Please review and retry.");
                        return;
                    }
                    MessageToast.show("Saved");
                    // Refresh donut first; glow fires only after fresh data lands so
                    // the user sees the pulsing animation over the up-to-date chart.
                    that._loadDonut().then(function () { that._pulseDonut(); });
                },
                function (oErr) { that.showError(oErr); }
            );
        }
    });
});

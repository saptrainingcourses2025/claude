sap.ui.define([
    "anubhav/claude/managetravel/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, Filter, FilterOperator) {
    "use strict";

    var ADDR_GROUP = "adminAddr";
    var USERS_URL  = "/odata/v4/user-management/Users?$expand=roles";
    var TRIPS_URL  = "/odata/v4/catalog/TravelledLocations?$expand=destination";

    return BaseController.extend("anubhav.claude.managetravel.controller.AdminDashboard", {

        onInit: function () {
            this.getView().setModel(new JSONModel({ users: [], stats: {} }), "admin");
            this.getView().setModel(new JSONModel({ title: "Total Spend per Currency", data: [] }), "chart");
            this.getRouter().getRoute("adminDashboard").attachPatternMatched(this._onMatched, this);
        },

        _onMatched: function () {
            if (!this.getUserModel().getProperty("/loginName")) {
                this.hydrateUserFromCookie();
            }
            if (!this._guardRole("ADMIN")) {
                return;
            }
            var that = this;
            this.ensureValidToken().then(
                function () {
                    that.attachAuthHeaderToODataModel();
                    that._loadData();
                },
                function () { that.onLogout(); }
            );
        },

        _loadData: function () {
            var that = this;
            this._ajax(USERS_URL, "GET").then(
                function (oRes) {
                    var aUsers = (oRes.value || []).map(function (u) {
                        return {
                            id: u.ID,
                            name: ((u.firstName || "") + " " + (u.lastName || "")).trim(),
                            email: u.loginName,
                            role: (u.roles || []).map(function (r) { return r.role_code; }).join(", ") || "—",
                            locked: !!u.isLocked
                        };
                    });
                    var iLocked = aUsers.filter(function (u) { return u.locked; }).length;
                    var oAdmin = that.getView().getModel("admin");
                    oAdmin.setProperty("/users", aUsers);
                    oAdmin.setProperty("/stats", {
                        totalUsers: aUsers.length,
                        locked: iLocked,
                        active: aUsers.length - iLocked,
                        totalTrips: oAdmin.getProperty("/stats/totalTrips") || 0
                    });
                },
                function (jqXHR) { that.showError(jqXHR); }
            );

            this._ajax(TRIPS_URL, "GET").then(
                function (oRes) {
                    var aTrips = oRes.value || [];
                    that.getView().getModel("admin").setProperty("/stats/totalTrips", aTrips.length);
                    that.getView().getModel("chart").setProperty("/data", that._aggregate(aTrips));
                },
                function (jqXHR) { that.showError(jqXHR); }
            );
        },

        // Total spend grouped by currency across ALL travellers' trips.
        _aggregate: function (aTrips) {
            var mSpend = {};
            aTrips.forEach(function (t) {
                var sCur = t.currency_code || "—";
                mSpend[sCur] = (mSpend[sCur] || 0) + (parseFloat(t.cost) || 0);
            });
            return Object.keys(mSpend).map(function (k) {
                return { name: k, value: Math.round(mSpend[k] * 100) / 100 };
            });
        },

        // ── Admin Addresses CRUD (V4 default model, deferred 'adminAddr' group) ──
        _adminAddrBinding: function () {
            var oTable = this.byId("adminAddressesTable");
            return oTable && oTable.getBinding("items");
        },

        onAddAddress: function () {
            var oBinding = this._adminAddrBinding();
            if (!oBinding) {
                return;
            }
            oBinding.create({ street: "", city: "", isPrimary: false });
        },

        onDeleteAddress: function () {
            var oTable = this.byId("adminAddressesTable");
            var aItems = oTable.getSelectedItems();
            if (!aItems.length) {
                return;
            }
            var that = this;
            aItems.forEach(function (oItem) {
                oItem.getBindingContext().delete(ADDR_GROUP).catch(function (oErr) {
                    that.showError(oErr);
                });
            });
            oTable.removeSelections(true);
        },

        onSaveAddresses: function () {
            var that = this;
            var oModel = this.getODataModel();
            oModel.submitBatch(ADDR_GROUP).then(
                function () {
                    if (oModel.hasPendingChanges(ADDR_GROUP)) {
                        that.showError("Some address changes could not be saved. Please review and retry.");
                    } else {
                        that.byId("adminAddressesTable").getBinding("items").refresh();
                    }
                },
                function (oErr) { that.showError(oErr); }
            );
        },

        onToggleLock: function (oEvent) {
            var oCtx = oEvent.getSource().getBindingContext("admin");
            var oRow = oCtx.getObject();
            var bUnlock = oEvent.getParameter("state"); // switch ON = active = unlock
            var sFn = bUnlock ? "unlockUser" : "lockUser";
            var sUrl = "/odata/v4/user-management/" + sFn + "(userId='" + oRow.id + "')";
            var that = this;
            this._ajax(sUrl, "GET").then(
                function () { that._loadData(); },
                function (jqXHR) { that.showError(jqXHR); that._loadData(); }
            );
        },

        onFilterTravellers: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue");
            var aFilters = sQuery ? [new Filter({
                filters: [
                    new Filter("name", FilterOperator.Contains, sQuery),
                    new Filter("email", FilterOperator.Contains, sQuery)
                ],
                and: false
            })] : [];
            this.byId("travellersTable").getBinding("items").filter(aFilters);
        },

        onNoop: function () { /* tiles are informational only */ }
    });
});

sap.ui.define([
    "anubhav/claude/managetravel/controller/BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("anubhav.claude.managetravel.controller.TravelDetail", {

        onInit: function () {
            this.getRouter().getRoute("travelDetail").attachPatternMatched(this._onMatched, this);
        },

        _onMatched: function (oEvent) {
            var sId = oEvent.getParameter("arguments").locationId;
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
                    that._bindLocation(sId);
                },
                function () { that.onLogout(); }
            );
        },

        _bindLocation: function (sId) {
            this.getView().bindElement({
                path: "/TravelledLocations(" + sId + ")",
                parameters: { $expand: "destination,currency" },
                events: {
                    dataReceived: this._onDataReceived.bind(this)
                }
            });
        },

        _onDataReceived: function (oEvent) {
            var oError = oEvent.getParameter("error");
            if (oError) {
                this.showError(oError);
            }
        },

        formatAmount: function (vCost, sCurrency) {
            if (vCost === null || vCost === undefined || vCost === "") {
                return "";
            }
            // The OData V4 model passes Edm.Decimal values through the type formatter
            // before calling this function. The type formats with locale thousand
            // separators (e.g. "1,250" in en-US). Strip all non-numeric characters
            // except the decimal point and leading minus sign so parseFloat works
            // correctly regardless of locale formatting.
            var sRaw = typeof vCost === "string"
                ? vCost.replace(/[^0-9.\-]/g, "")
                : String(vCost);
            var nCost = parseFloat(sRaw);
            if (isNaN(nCost)) {
                return String(vCost);
            }
            return nCost.toFixed(2) + (sCurrency ? " " + sCurrency : "");
        },

        onNavBack: function () {
            this.getRouter().navTo("travellerDashboard", {}, true);
        }
    });
});

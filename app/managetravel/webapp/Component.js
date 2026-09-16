sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/HashChanger",
    "anubhav/claude/managetravel/model/models"
], function (UIComponent, JSONModel, HashChanger, models) {
    "use strict";

    function getCookie(sName) {
        var aParts = document.cookie ? document.cookie.split("; ") : [];
        for (var i = 0; i < aParts.length; i++) {
            var iEq = aParts[i].indexOf("=");
            if (aParts[i].substring(0, iEq) === sName) {
                return decodeURIComponent(aParts[i].substring(iEq + 1));
            }
        }
        return undefined;
    }

    function decodeJwt(sToken) {
        try {
            var sPayload = sToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
            return JSON.parse(decodeURIComponent(escape(window.atob(sPayload))));
        } catch (e) {
            return null;
        }
    }

    return UIComponent.extend("anubhav.claude.managetravel.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            this.setModel(models.createDeviceModel(), "device");

            // Global user model — rebuilt from the th_user cookie on refresh
            var oUserModel = new JSONModel({});
            this.setModel(oUserModel, "userModel");

            var sTarget = this._resolveStartupRoute(oUserModel);

            // Land directly on the role dashboard when a session cookie exists,
            // so a browser refresh preserves login (AC #11).
            if (sTarget) {
                HashChanger.getInstance().replaceHash(sTarget);
            }

            this.getRouter().initialize();
        },

        // Returns the startup hash, or "" (login) when no usable session exists.
        _resolveStartupRoute: function (oUserModel) {
            var sAccess  = getCookie("th_access");
            var sRefresh = getCookie("th_refresh");
            var sUserRaw = getCookie("th_user");

            if (!sUserRaw || (!sAccess && !sRefresh)) {
                return "";
            }

            var oPayload = sAccess && decodeJwt(sAccess);
            var bAccessUsable = oPayload && oPayload.exp &&
                (oPayload.exp - 10) > Math.floor(Date.now() / 1000);

            // Access expired and no refresh token → force fresh login.
            if (!bAccessUsable && !sRefresh) {
                return "";
            }

            try {
                var o = JSON.parse(sUserRaw);
                var bAdmin = o.role === "ADMIN";
                oUserModel.setData({
                    id: o.id,
                    loginName: o.loginName,
                    firstName: o.firstName,
                    lastName: o.lastName,
                    fullName: ((o.firstName || "") + " " + (o.lastName || "")).trim(),
                    roles: [o.role],
                    role: o.role,
                    isAdmin: bAdmin,
                    isTraveller: !bAdmin
                });
                return bAdmin ? "admin" : "traveller";
            } catch (e) {
                return "";
            }
        }
    });
});

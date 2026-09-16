sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/thirdparty/jquery"
], function (Controller, UIComponent, JSONModel, MessageBox, jQuery) {
    "use strict";

    // ── Constants ────────────────────────────────────────────────────────────
    var AUTH_BASE   = "/odata/v4/auth";
    var C_ACCESS    = "th_access";
    var C_REFRESH   = "th_refresh";
    var C_USER      = "th_user";
    var REFRESH_TTL = 7 * 24 * 3600; // 7 days, configurable

    return Controller.extend("anubhav.claude.managetravel.controller.BaseController", {

        // ── Accessors ────────────────────────────────────────────────────────
        getRouter: function () {
            return UIComponent.getRouterFor(this);
        },

        getUserModel: function () {
            var oComp = this.getOwnerComponent();
            var oModel = oComp.getModel("userModel");
            if (!oModel) {
                oModel = new JSONModel({});
                oComp.setModel(oModel, "userModel");
            }
            return oModel;
        },

        // Default (unnamed) V4 model = CatalogService
        getODataModel: function () {
            return this.getOwnerComponent().getModel();
        },

        // Named V4 model = UserManagement (admin only)
        getMgmtModel: function () {
            return this.getOwnerComponent().getModel("mgmt");
        },

        // ── Cookie helpers ───────────────────────────────────────────────────
        setCookie: function (sName, sValue, iSeconds) {
            var sCookie = sName + "=" + encodeURIComponent(sValue) + ";path=/;SameSite=Strict";
            if (typeof iSeconds === "number") {
                sCookie += ";max-age=" + iSeconds;
            }
            if (window.location.protocol === "https:") {
                sCookie += ";Secure";
            }
            document.cookie = sCookie;
        },

        getCookie: function (sName) {
            var aParts = document.cookie ? document.cookie.split("; ") : [];
            for (var i = 0; i < aParts.length; i++) {
                var iEq = aParts[i].indexOf("=");
                if (aParts[i].substring(0, iEq) === sName) {
                    return decodeURIComponent(aParts[i].substring(iEq + 1));
                }
            }
            return undefined;
        },

        deleteCookie: function (sName) {
            document.cookie = sName + "=;path=/;max-age=0;SameSite=Strict";
        },

        getAccessToken: function () {
            return this.getCookie(C_ACCESS);
        },

        // ── JWT helpers ──────────────────────────────────────────────────────
        _decodeJwt: function (sToken) {
            try {
                var sPayload = sToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
                return JSON.parse(decodeURIComponent(escape(window.atob(sPayload))));
            } catch (e) {
                return null;
            }
        },

        isTokenExpired: function (sToken) {
            var oPayload = sToken && this._decodeJwt(sToken);
            if (!oPayload || !oPayload.exp) {
                return true;
            }
            // 10s clock-skew safety margin
            return (oPayload.exp - 10) <= Math.floor(Date.now() / 1000);
        },

        // ── AJAX wrapper: auto Bearer + 401 → refresh → retry once ────────────
        _ajax: function (sUrl, sMethod, oData, bRetried) {
            var that = this;
            var sToken = this.getAccessToken();
            return new Promise(function (resolve, reject) {
                jQuery.ajax({
                    url: sUrl,
                    method: sMethod || "GET",
                    contentType: "application/json",
                    data: oData ? JSON.stringify(oData) : undefined,
                    headers: sToken ? { Authorization: "Bearer " + sToken } : {},
                    dataType: "json"
                }).then(
                    function (oResult) { resolve(oResult); },
                    function (jqXHR) {
                        var bIsRefreshCall = sUrl.indexOf("/refresh") > -1;
                        if (jqXHR.status === 401 && !bRetried && !bIsRefreshCall && that.getCookie(C_REFRESH)) {
                            that.refreshToken().then(
                                function () { that._ajax(sUrl, sMethod, oData, true).then(resolve, reject); },
                                function () { that.onLogout(); reject(jqXHR); }
                            );
                        } else {
                            reject(jqXHR);
                        }
                    }
                );
            });
        },

        // ── Auth: login → me → persist session ───────────────────────────────
        login: function (sLoginName, sPassword) {
            var that = this;
            return this._ajax(AUTH_BASE + "/login", "POST", {
                loginName: sLoginName,
                password: sPassword
            }).then(function (oTokens) {
                that._storeTokens(oTokens);
                return that._ajax(AUTH_BASE + "/me", "GET").then(function (oUser) {
                    that._persistUser(oUser);
                    that.attachAuthHeaderToODataModel();
                    return oUser;
                });
            });
        },

        refreshToken: function () {
            var that = this;
            var sRefresh = this.getCookie(C_REFRESH);
            if (!sRefresh) {
                return Promise.reject(new Error("No refresh token"));
            }
            return this._ajax(AUTH_BASE + "/refresh", "POST", {
                refreshToken: sRefresh
            }).then(function (oTokens) {
                that._storeTokens(oTokens);
                that.attachAuthHeaderToODataModel();
                return oTokens.access;
            });
        },

        // Ensures a usable access token before an OData read; refreshes if expired.
        ensureValidToken: function () {
            var sAccess = this.getAccessToken();
            if (sAccess && !this.isTokenExpired(sAccess)) {
                return Promise.resolve(sAccess);
            }
            if (this.getCookie(C_REFRESH)) {
                return this.refreshToken();
            }
            return Promise.reject(new Error("Not authenticated"));
        },

        _storeTokens: function (oTokens) {
            this.setCookie(C_ACCESS, oTokens.access, oTokens.expiresIn || 900);
            this.setCookie(C_REFRESH, oTokens.refresh, REFRESH_TTL);
        },

        _persistUser: function (oUser) {
            var aRoles = oUser.roles || [];
            var bAdmin = aRoles.indexOf("ADMIN") > -1;
            var oData = {
                id: oUser.id,
                loginName: oUser.loginName,
                firstName: oUser.firstName,
                lastName: oUser.lastName,
                fullName: ((oUser.firstName || "") + " " + (oUser.lastName || "")).trim(),
                roles: aRoles,
                role: bAdmin ? "ADMIN" : "TRAVELLER",
                isAdmin: bAdmin,
                isTraveller: !bAdmin
            };
            this.getUserModel().setData(oData);
            this.setCookie(C_USER, JSON.stringify({
                loginName: oData.loginName,
                role: oData.role,
                firstName: oData.firstName,
                lastName: oData.lastName,
                id: oData.id
            }));
        },

        // Rebuilds userModel from the th_user cookie on a page refresh.
        hydrateUserFromCookie: function () {
            var sRaw = this.getCookie(C_USER);
            if (!sRaw) {
                return null;
            }
            try {
                var o = JSON.parse(sRaw);
                var bAdmin = o.role === "ADMIN";
                var oData = {
                    id: o.id,
                    loginName: o.loginName,
                    firstName: o.firstName,
                    lastName: o.lastName,
                    fullName: ((o.firstName || "") + " " + (o.lastName || "")).trim(),
                    roles: [o.role],
                    role: o.role,
                    isAdmin: bAdmin,
                    isTraveller: !bAdmin
                };
                this.getUserModel().setData(oData);
                return oData;
            } catch (e) {
                return null;
            }
        },

        // ── Apply Bearer to every OData V4 model ──────────────────────────────
        attachAuthHeaderToODataModel: function () {
            var sToken = this.getAccessToken();
            if (!sToken) {
                return;
            }
            [this.getODataModel(), this.getMgmtModel()].forEach(function (oModel) {
                if (oModel && oModel.changeHttpHeaders) {
                    try {
                        oModel.changeHttpHeaders({ Authorization: "Bearer " + sToken });
                    } catch (e) {
                        // pending requests in flight — header applies on next session anyway
                    }
                }
            });
        },

        // ── Role guard ────────────────────────────────────────────────────────
        _guardRole: function (sRequired) {
            var oUser = this.getUserModel().getData();
            if (!oUser || !oUser.loginName) {
                this.getRouter().navTo("login", {}, true);
                return false;
            }
            if (sRequired && (oUser.roles || []).indexOf(sRequired) === -1) {
                this.getRouter().navTo(oUser.isAdmin ? "adminDashboard" : "travellerDashboard", {}, true);
                return false;
            }
            return true;
        },

        // ── Logout ────────────────────────────────────────────────────────────
        onLogout: function () {
            this.deleteCookie(C_ACCESS);
            this.deleteCookie(C_REFRESH);
            this.deleteCookie(C_USER);
            this.getUserModel().setData({});
            this.getRouter().navTo("login", {}, true);
        },

        // ── Common error popup ───────────────────────────────────────────────
        showError: function (vMsg) {
            var sMsg = vMsg;
            if (vMsg && vMsg.responseJSON && vMsg.responseJSON.error) {
                sMsg = vMsg.responseJSON.error.message || vMsg.responseJSON.error.message;
            } else if (vMsg && vMsg.message) {
                sMsg = vMsg.message;
            } else if (vMsg && vMsg.responseText) {
                try {
                    sMsg = JSON.parse(vMsg.responseText).error.message;
                } catch (e) {
                    sMsg = vMsg.responseText;
                }
            }
            MessageBox.error(String(sMsg || "Unexpected error"));
        }
    });
});

sap.ui.define([
    "anubhav/claude/managetravel/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (BaseController, JSONModel, MessageToast) {
    "use strict";

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return BaseController.extend("anubhav.claude.managetravel.controller.Login", {

        onInit: function () {
            this.getView().setModel(new JSONModel({ loginName: "", password: "" }));
            this.getRouter().getRoute("login").attachPatternMatched(this._onLoginMatched, this);
        },

        // If a valid session already exists, never show the login form.
        _onLoginMatched: function () {
            var oUser = this.getUserModel().getData();
            if (oUser && oUser.loginName) {
                this._navByRole(oUser);
            }
        },

        _navByRole: function (oUser) {
            this.getRouter().navTo(oUser.isAdmin ? "adminDashboard" : "travellerDashboard", {}, true);
        },

        onLogin: function () {
            var oData = this.getView().getModel().getData();
            if (!oData.loginName || !oData.password) {
                this.showError("Please enter email and password.");
                return;
            }
            var that = this;
            this.login(oData.loginName.trim().toLowerCase(), oData.password).then(
                function (oUser) {
                    that.getView().getModel().setProperty("/password", "");
                    that._navByRole(that.getUserModel().getData());
                },
                function (jqXHR) {
                    that.showError(jqXHR);
                }
            );
        },

        // ── Registration ─────────────────────────────────────────────────────
        onForgotPassword: function () {
            MessageToast.show("Password reset is not yet available.");
        },

        onOpenRegister: function () {
            var that = this;
            this.getView().setModel(new JSONModel({
                firstName: "", lastName: "", email: "", password: "",
                phone: "", addressType: "H",
                addressTypes: [
                    { code: "H", name: "Home" },
                    { code: "O", name: "Office" },
                    { code: "P", name: "Permanent" },
                    { code: "T", name: "Temporary" }
                ]
            }), "reg");

            if (this._pRegDialog) {
                this._pRegDialog.then(function (oDlg) { oDlg.open(); });
                return;
            }
            this._pRegDialog = this.loadFragment({
                name: "anubhav.claude.managetravel.fragment.RegisterDialog"
            }).then(function (oDlg) {
                that.getView().addDependent(oDlg);
                oDlg.open();
                return oDlg;
            });
        },

        onCancelRegister: function () {
            this.byId("registerDialog").close();
        },

        onSubmitRegister: function () {
            var o = this.getView().getModel("reg").getData();
            if (!o.firstName.trim() || !o.lastName.trim()) {
                this.showError("First and last name are required.");
                return;
            }
            if (!EMAIL_RE.test(o.email)) {
                this.showError("Please enter a valid email address.");
                return;
            }
            if (!o.password || o.password.length < 8) {
                this.showError("Password must be at least 8 characters.");
                return;
            }

            var that = this;
            this._ajax("/odata/v4/auth/register", "POST", {
                firstName: o.firstName.trim(),
                lastName: o.lastName.trim(),
                email: o.email.trim().toLowerCase(),
                password: o.password,
                phone: o.phone || "",
                addressType: o.addressType || "H"
            }).then(
                function (oRes) {
                    that.byId("registerDialog").close();
                    MessageToast.show(
                        (oRes && oRes.message) ||
                        "Registration successful. An admin must unlock your account before first login.",
                        { duration: 6000 }
                    );
                    that.getView().getModel().setProperty("/loginName", o.email.trim().toLowerCase());
                },
                function (jqXHR) {
                    that.showError(jqXHR);
                }
            );
        }
    });
});

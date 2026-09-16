sap.ui.define([
    "anubhav/claude/managetravel/controller/BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("anubhav.claude.managetravel.controller.App", {
        onInit: function () {
            // Shell controller — owns the persistent Header (logout lives here,
            // so every routed page inherits it). Routing handled per-view.
        }
    });
});

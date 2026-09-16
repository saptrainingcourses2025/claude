# Controller Template

Every new controller in TravelHub follows this exact shape. The goal is: **almost nothing happens in the view controller** — it delegates to BaseController helpers and the OData V4 model. View controllers should rarely exceed ~150 lines.

## File: `webapp/controller/<Name>.controller.js`

```javascript
sap.ui.define([
    "travelhub/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (BaseController, JSONModel, MessageToast) {
    "use strict";

    return BaseController.extend("travelhub.controller.<Name>", {

        // -----------------------------------------------------------
        // Lifecycle
        // -----------------------------------------------------------

        onInit: function () {

            // Reuse: pulls JWT from cookie and sets Authorization: Bearer <token>
            // on the OData V4 model so every entity-set request below is authorized.
            this.attachAuthHeaderToODataModel();

            // Optional: restrict by role. Uncomment one if the screen is role-locked.
            // this._guardRole("ADMIN");
            // this._guardRole("TRAVELLER");

            // Local view state. Keep it tiny — only what the XML binds to.
            var oViewModel = new JSONModel({
                busy: false,
                hasChanges: false
            });
            this.getView().setModel(oViewModel, "view");

            // Attach to the route so we can refresh data each time the user lands here.
            this.getRouter()
                .getRoute("<routeName>")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (/* oEvent */) {
            this._loadData();
        },

        // -----------------------------------------------------------
        // Data loading
        // -----------------------------------------------------------

        _loadData: function () {
            // OData V4: GET /catalog/<EntitySet>  — read the list bound to the table.
            // The binding is declared in the XML view (items="{/<EntitySet>}");
            // this method only handles refresh + busy state.
            var oBinding = this.byId("table<Name>").getBinding("items");
            if (oBinding) {
                this.getView().getModel("view").setProperty("/busy", true);
                oBinding.refresh();
                oBinding.attachEventOnce("dataReceived", function () {
                    this.getView().getModel("view").setProperty("/busy", false);
                }.bind(this));
            }
        },

        // -----------------------------------------------------------
        // Event handlers
        // -----------------------------------------------------------

        onCreate: function () {
            // OData V4: POST /catalog/<EntitySet>  — create a blank row via list binding.
            // We use the V4 list binding's create() so the change participates in the
            // shared update group and is flushed together by onSave().
            var oListBinding = this.byId("table<Name>").getBinding("items");
            oListBinding.create({ /* default field values */ });
            this.getView().getModel("view").setProperty("/hasChanges", true);
        },

        onDelete: function (oEvent) {
            // OData V4: DELETE /catalog/<EntitySet>(<key>)  — delete the selected row.
            var oContext = oEvent.getSource().getBindingContext();
            if (!oContext) { return; }
            oContext.delete().then(
                function () { MessageToast.show("Deleted"); },
                function (oErr) { this.showError(oErr.message); }.bind(this)
            );
            this.getView().getModel("view").setProperty("/hasChanges", true);
        },

        onSave: function () {
            // OData V4: batch submit — flushes all pending POST/PATCH/DELETE
            // in the "travellerChanges" update group as a single $batch request.
            var oModel = this.getODataModel();
            this.getView().getModel("view").setProperty("/busy", true);

            oModel.submitBatch("travellerChanges").then(
                function () {
                    MessageToast.show("Saved");
                    this.getView().getModel("view").setProperty("/hasChanges", false);
                    this.getView().getModel("view").setProperty("/busy", false);
                }.bind(this),
                function (oErr) {
                    this.showError(oErr.message);
                    this.getView().getModel("view").setProperty("/busy", false);
                }.bind(this)
            );
        }

    });
});
```

## Required `BaseController` helpers used above

If any are missing from `BaseController.js`, add them there — never inline. Suggested signatures:

```javascript
// Returns the V4 ODataModel registered as the default model in manifest.json.
getODataModel: function () { return this.getOwnerComponent().getModel(); }

// Reads the JWT from cookie and applies it to the V4 model.
// Safe to call multiple times.
attachAuthHeaderToODataModel: function () {
    var oModel = this.getODataModel();
    var sToken = this.getCookie("th_access");
    if (oModel && sToken) {
        oModel.changeHttpHeaders({ Authorization: "Bearer " + sToken });
    }
}

// Redirects to login if userModel role does not match.
_guardRole: function (sRequired) {
    var sRole = this.getOwnerComponent().getModel("userModel").getProperty("/role");
    if (sRole !== sRequired) { this.getRouter().navTo("login"); }
}

// One place for error popups so we don't sprinkle MessageBox everywhere.
showError: function (sMsg) { sap.m.MessageBox.error(sMsg || "Something went wrong"); }
```

## The OData V4 comment convention

Every line that triggers a network call to the CAP backend must have a comment immediately above it in this format:

```
// OData V4: <METHOD> /<service-path>/<entity-or-action>  — <one-line purpose>
```

Examples:

```javascript
// OData V4: GET /catalog/Travellers?$filter=status_code eq 'LOCKED' — admin queue.
// OData V4: PATCH /catalog/Travellers('<key>') — toggle lock/unlock.
// OData V4: POST /auth/login — exchange credentials for JWT (handled in BaseController).
// OData V4: GET /auth/me — fetch current user info after token refresh.
```

This is non-decorative — it's how the YouTube audience traces the request back to the CDS service.

## What this controller intentionally does NOT contain

- ❌ Cookie reads/writes (`document.cookie`) — those live in `BaseController`.
- ❌ Manual `jQuery.ajax` calls with `Authorization` headers — the V4 model handles it after `attachAuthHeaderToODataModel`.
- ❌ Role checks beyond `_guardRole(...)` — keep it one line.
- ❌ Formatter functions for complex display logic — use a JSONModel field computed once in `_loadData`.
- ❌ Custom controls or `Control.extend`.

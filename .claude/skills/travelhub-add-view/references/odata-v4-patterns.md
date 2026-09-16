# OData V4 Patterns for TravelHub

All examples below use the existing service entity sets. Do not invent new endpoints — only use what `srv/cat-service.cds` and `srv/auth-service.cds` expose.

**Available entity sets** (from `CatalogService`, path `catalog`):
- `Travellers` — read/write (admin: full, traveller: own row only)
- `TravellerTypes` — read-only
- `TravelledLocations` — read/write (admin: full, traveller: own rows)
- `Destinations` — read for all, write admin only
- `TravellerStatus` — read-only
- `AddressTypes` — read-only

**Available actions** (from `AuthService`, path `auth`):
- `login(loginName, password)` — returns `{ access, refresh, expiresIn }`
- `refresh(refreshToken)` — returns `{ access, refresh, expiresIn }`
- `me()` — returns `{ id, loginName, firstName, lastName, roles[] }`

## The comment rule

Every line that makes a backend call carries a comment one line above it:

```
// OData V4: <METHOD> /<path>/<entity-or-action>[?<query>] — <one-line purpose>
```

This is mandatory. It is part of the deliverable.

---

## Pattern 1 — Read a list (declarative, via XML binding)

Preferred: declare the binding in the view, refresh from the controller. No imperative read needed.

**View:**
```xml
<Table id="tblTravellers" items="{path: '/Travellers', parameters: {$$updateGroupId: 'travellerChanges'}}">
    <!-- columns ... -->
</Table>
```

**Controller:**
```javascript
_loadData: function () {
    // OData V4: GET /catalog/Travellers — list bound to tblTravellers.
    var oBinding = this.byId("tblTravellers").getBinding("items");
    if (oBinding) { oBinding.refresh(); }
}
```

## Pattern 2 — Read a list with a filter

```javascript
loadLocked: function () {
    var oBinding = this.byId("tblTravellers").getBinding("items");
    // OData V4: GET /catalog/Travellers?$filter=status_code eq 'LOCKED' — locked queue.
    oBinding.filter(new sap.ui.model.Filter("status_code", "EQ", "LOCKED"));
}
```

Import at top of controller: `"sap/ui/model/Filter"` in the `sap.ui.define([...])` array.

## Pattern 3 — Read a single entity (one-time fetch into JSONModel)

Use when the value drives view state rather than a binding (e.g., a header showing the logged-in user's name).

```javascript
_fetchMyProfile: function () {
    var oModel = this.getODataModel();
    var sLogin = this.getOwnerComponent().getModel("userModel").getProperty("/loginName");

    // OData V4: GET /catalog/Travellers('<userID>') — profile of the logged-in traveller.
    var oContext = oModel.bindContext("/Travellers('" + sLogin + "')").requestObject();
    oContext.then(function (oData) {
        this.getView().getModel("view").setProperty("/profile", oData);
    }.bind(this));
}
```

## Pattern 4 — Create via list binding (joins the batch group)

Preferred for any "Add row" button that should be saved together with other edits on the Save button.

```javascript
onCreateLocation: function () {
    var oListBinding = this.byId("tblLocations").getBinding("items");
    // OData V4: POST /catalog/TravelledLocations — new row queued in 'travellerChanges'.
    oListBinding.create({
        location: "",
        amount: 0
    });
    this.getView().getModel("view").setProperty("/hasChanges", true);
}
```

## Pattern 5 — Update (PATCH happens automatically on field change)

With two-way binding and `$$updateGroupId`, edits to bound `Input` values queue a PATCH automatically. The controller usually doesn't need an explicit update call. Just flush with Save:

```javascript
onSave: function () {
    // OData V4: $batch (POST /catalog/$batch) — flush queued PATCH/POST/DELETE.
    this.getODataModel().submitBatch("travellerChanges").then(
        function () { sap.m.MessageToast.show("Saved"); },
        function (oErr) { this.showError(oErr.message); }.bind(this)
    );
}
```

## Pattern 6 — Delete

```javascript
onDelete: function (oEvent) {
    var oCtx = oEvent.getSource().getBindingContext();
    if (!oCtx) { return; }
    // OData V4: DELETE /catalog/TravelledLocations(<key>) — remove the selected row.
    oCtx.delete().then(
        function () { sap.m.MessageToast.show("Deleted"); },
        function (oErr) { this.showError(oErr.message); }.bind(this)
    );
}
```

## Pattern 7 — PATCH an admin-only field (lock/unlock)

For one-shot updates that should NOT join the batch group (admin toggling a user's status):

```javascript
onToggleLock: function (oEvent) {
    var oCtx = oEvent.getSource().getBindingContext();
    var bLocked = oEvent.getParameter("state");
    var sStatus = bLocked ? "LOCKED" : "ACTIVE";

    // OData V4: PATCH /catalog/Travellers(<key>) — admin lock/unlock action.
    oCtx.setProperty("status_code", sStatus);
    this.getODataModel().submitBatch("adminChanges").then(
        function () { sap.m.MessageToast.show("Updated"); },
        function (oErr) { this.showError(oErr.message); }.bind(this)
    );
}
```

(`adminChanges` is a separate update group declared on the admin table's binding so it doesn't mix with traveller edits.)

## Pattern 8 — Call an AuthService action

These run on the `/auth` service path, NOT `/catalog`. They live in `BaseController` — view controllers should rarely call them directly. The patterns are documented here only so you can recognize them.

```javascript
// OData V4: POST /auth/login — exchange credentials for { access, refresh, expiresIn }.
// OData V4: POST /auth/refresh — exchange refresh token for a new access token.
// OData V4: GET  /auth/me — return current user info.
```

The `auth` service is consumed via a separate V4 model (configured in `manifest.json` under `dataSources` and `models`), or via plain `fetch` in `BaseController`. Either way, view controllers should call `this.login(...)`, `this.refreshToken()`, `this.fetchMe()` on BaseController — never the raw endpoint.

## Query option cheatsheet (V4)

| Need | Option | Example |
|---|---|---|
| Filter | `$filter` | `$filter=status_code eq 'ACTIVE'` |
| Select fewer fields | `$select` | `$select=userID,firstName,lastName` |
| Sort | `$orderby` | `$orderby=firstName asc` |
| Expand association | `$expand` | `$expand=addresses,travelledLocations` |
| Page | `$top`, `$skip` | `$top=20&$skip=40` |
| Count | `$count` | `$count=true` |

In UI5 V4, pass these as `parameters` on the binding rather than appending to the URL manually:

```xml
<Table items="{
    path: '/Travellers',
    parameters: {
        $select: 'userID,firstName,lastName,status_code',
        $orderby: 'firstName asc',
        $$updateGroupId: 'adminChanges'
    }
}">
```

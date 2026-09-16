# Anti-Patterns — Things to Never Do

These are real mistakes that violate the project's hard rules. Each shows the wrong way and the right way.

---

## ❌ Web components

```xml
<!-- WRONG -->
<webc:Button xmlns:webc="sap.ui.webc.main" text="Save"/>
```

```xml
<!-- RIGHT -->
<Button xmlns="sap.m" text="Save"/>
```

The project uses `sap.m` controls exclusively. The `sap.ui.webc.*` namespace is forbidden.

---

## ❌ Custom control

```javascript
// WRONG
sap.ui.define(["sap/ui/core/Control"], function (Control) {
    return Control.extend("travelhub.controls.FancyTile", {
        metadata: { properties: { /* ... */ } },
        renderer: function (oRm, oControl) { /* ... */ }
    });
});
```

```xml
<!-- RIGHT — compose standard controls into a fragment instead -->
<VBox class="sapUiSmallMargin">
    <Title text="{title}"/>
    <Text text="{subtitle}"/>
    <ProgressIndicator percentValue="{percent}"/>
</VBox>
```

If you feel the urge to subclass a control, stop. Compose standard `sap.m`/`sap.ui.layout` controls into a fragment instead.

---

## ❌ Manual Authorization header on a jQuery ajax call

```javascript
// WRONG
jQuery.ajax({
    url: "/catalog/Travellers",
    headers: { Authorization: "Bearer " + document.cookie }
});
```

```javascript
// RIGHT — V4 model handles it after attachAuthHeaderToODataModel()
onInit: function () {
    this.attachAuthHeaderToODataModel(); // BaseController helper
    // then use list bindings; Authorization is attached on every request automatically
}
```

The V4 `ODataModel`'s `changeHttpHeaders({ Authorization: "Bearer " + token })` is the only place this lives. View controllers must not touch `document.cookie` or HTTP headers directly.

---

## ❌ Duplicating BaseController logic

```javascript
// WRONG — re-implementing cookie read inside a view controller
onInit: function () {
    var aPairs = document.cookie.split(";");
    var sToken = null;
    aPairs.forEach(function (p) {
        var kv = p.trim().split("=");
        if (kv[0] === "th_access") { sToken = kv[1]; }
    });
    // ...
}
```

```javascript
// RIGHT — reuse BaseController
onInit: function () {
    var sToken = this.getCookie("th_access");
    // ...
}
```

If a helper doesn't exist on BaseController yet, **add it there**, don't inline.

---

## ❌ Hard-coded navigation

```javascript
// WRONG
window.location.hash = "#/admin";
```

```javascript
// RIGHT
this.getRouter().navTo("adminDashboard");
```

---

## ❌ Two views sharing one controller

```javascript
// WRONG — Admin.view.xml and Reports.view.xml both declare:
//   controllerName="travelhub.controller.Shared"
```

```javascript
// RIGHT — one controller per view, share logic via BaseController
//   Admin.view.xml      -> travelhub.controller.Admin
//   Reports.view.xml    -> travelhub.controller.Reports
//   (both extend BaseController)
```

---

## ❌ Inline header (skipping the Header fragment)

```xml
<!-- WRONG — re-implementing branding per view -->
<Bar>
    <contentLeft>
        <Title text="Anubhav Trainings"/>
    </contentLeft>
</Bar>
```

```xml
<!-- RIGHT — always include the shared fragment -->
<core:Fragment fragmentName="travelhub.fragment.Header" type="XML"/>
```

If the header looks wrong on a page, fix `Header.fragment.xml` — don't shadow it locally.

---

## ❌ Heavy logic in XML formatters

```xml
<!-- WRONG -->
<Text text="{= ${trip>/amount} > 1000 ? 'High: ' + ${trip>/amount} + ' USD' : 'Low' }"/>
```

```javascript
// RIGHT — compute once in the controller, expose via JSONModel
_loadData: function () {
    // ... after fetching trip
    this.getView().getModel("view").setProperty("/spendLabel",
        oTrip.amount > 1000 ? "High: " + oTrip.amount + " USD" : "Low");
}
```

```xml
<Text text="{view>/spendLabel}"/>
```

Expression bindings are fine for trivial cases (`visible="{= ${userModel>/role} === 'ADMIN' }"`); anything multi-clause goes to the controller.

---

## ❌ Missing the OData V4 comment

```javascript
// WRONG
oBinding.refresh();
oCtx.delete();
oModel.submitBatch("g1");
```

```javascript
// RIGHT
// OData V4: GET /catalog/Travellers — refresh admin table.
oBinding.refresh();

// OData V4: DELETE /catalog/TravelledLocations(<key>) — remove row.
oCtx.delete();

// OData V4: $batch — flush queued changes.
oModel.submitBatch("g1");
```

The comment is part of the code. Don't skip it.

---

## ❌ Inventing endpoints

```javascript
// WRONG — /catalog/AdminStats is not in cat-service.cds
jQuery.get("/catalog/AdminStats");
```

```javascript
// RIGHT — derive stats client-side from Travellers entity set
// OData V4: GET /catalog/Travellers?$select=status_code — for status counts.
var oBinding = oModel.bindList("/Travellers", null, [], [], { $select: "status_code" });
oBinding.requestContexts().then(function (aCtx) {
    // aggregate in JS
});
```

If you need an endpoint that doesn't exist, **stop and tell the user to extend the CDS service** — don't fake it.

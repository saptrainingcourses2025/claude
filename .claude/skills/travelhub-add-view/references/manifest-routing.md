# Manifest Routing Patch

For every new view, add **one route** and **one target** to `webapp/manifest.json`. Present these to the user as a patch — never rewrite the whole manifest.

## Where in `manifest.json`

The two arrays/objects live under `"sap.ui5" → "routing"`:

```json
"sap.ui5": {
    "routing": {
        "config": {
            "routerClass": "sap.m.routes",
            "viewType": "XML",
            "viewPath": "travelhub.view",
            "controlId": "appRoot",
            "controlAggregation": "pages",
            "transition": "slide",
            "async": true
        },
        "routes": [
            { "name": "login", "pattern": "", "target": "login" },
            { "name": "adminDashboard", "pattern": "admin", "target": "adminDashboard" },
            { "name": "travellerDashboard", "pattern": "traveller", "target": "travellerDashboard" }
            /* ADD NEW ROUTE OBJECT HERE */
        ],
        "targets": {
            "login": { "viewName": "Login", "viewLevel": 1 },
            "adminDashboard": { "viewName": "AdminDashboard", "viewLevel": 2 },
            "travellerDashboard": { "viewName": "TravellerDashboard", "viewLevel": 2 }
            /* ADD NEW TARGET KEY HERE */
        }
    }
}
```

## The patch to add

For a new view called `<Name>` with route pattern `<pattern>`:

**Add to `routes` array:**

```json
{
    "name": "<routeName>",
    "pattern": "<pattern>",
    "target": "<routeName>"
}
```

**Add to `targets` object:**

```json
"<routeName>": {
    "viewName": "<Name>",
    "viewLevel": 2
}
```

## Conventions

- **`name` and `target`** are the same string by convention (the route name) — keeps lookups trivial.
- **`pattern`** is lowercase, no leading slash. Use `{paramName}` for path params: `"approvals/{requestId}"`.
- **`viewLevel`** is `2` for screens reached after login (drives transition direction). Use `1` only for login itself.
- **`viewName`** is the PascalCase view file name **without** the `.view.xml` suffix.

## Navigating to the new route

From any controller (e.g., a button on the dashboard):

```javascript
onGoTo<Name>: function () {
    this.getRouter().navTo("<routeName>");
}
```

With a path param:

```javascript
this.getRouter().navTo("<routeName>", { requestId: "REQ-001" });
```

In the new view's controller, read the param in `_onRouteMatched`:

```javascript
_onRouteMatched: function (oEvent) {
    var sId = oEvent.getParameter("arguments").requestId;
    // ...
}
```

## Example: full patch for an "ApprovalRequests" admin screen

**routes** entry:
```json
{ "name": "approvalRequests", "pattern": "approvals", "target": "approvalRequests" }
```

**targets** entry:
```json
"approvalRequests": { "viewName": "ApprovalRequests", "viewLevel": 2 }
```

That's it. No router subclassing, no programmatic route registration, no `URLHelper` tricks.

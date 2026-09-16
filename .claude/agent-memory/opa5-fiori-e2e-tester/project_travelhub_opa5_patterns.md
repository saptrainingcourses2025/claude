---
name: travelhub-opa5-patterns
description: OPA5 test patterns, control IDs, routing, and auth stub approach discovered for the TravelHub (anubhav.claude.managetravel) freestyle Fiori app
metadata:
  type: project
---

## TravelHub OPA5 Test Patterns

### App Identity
- Namespace: `anubhav.claude.managetravel`
- Root view ID: `App` (NavContainer id: `mainNav`)
- resourceroots path from test/ folder: `"anubhav.claude.managetravel": "../"`

### Routes and View Names (from manifest.json)
| Route name | Pattern | viewId | viewName |
|---|---|---|---|
| login | "" | login | Login |
| travellerDashboard | traveller | travellerDashboard | TravellerDashboard |
| travelDetail | traveller/location/{locationId} | travelDetail | TravelDetail |
| adminDashboard | admin | adminDashboard | AdminDashboard |

### Control IDs verified in actual view/fragment XMLs
- Login: `inEmail` (sap.m.Input), `inPassword` (sap.m.Input), Login button = Emphasized sap.m.Button
- TravellerDashboard: `travellerPage` (Page), `travellerTabs` (IconTabBar), `saveBtn` (Emphasized Button)
  - IconTabFilter keys: `addresses`, `locations`
- TravelledLocationsTab fragment: `locationsTable` (sap.m.Table, mode=MultiSelect, type=Navigation)
- TravelDetail: `travelDetailPage` (Page), `travelHeader` (ObjectHeader), `travelDetailsPanel` (Panel), `travelDetailsForm` (SimpleForm), `backBtn` (Button in footer)

### Auth Mechanism
- Login: POST `/odata/v4/auth/login` with `{ loginName, password }` → `{ access, refresh, expiresIn }`
- User fetch: GET `/odata/v4/auth/me` → `{ id, loginName, firstName, lastName, roles }`
- Tokens stored in cookies: `th_access`, `th_refresh`, `th_user`
- OData models get Bearer header via `changeHttpHeaders`
- Component.js auto-navigates to dashboard if valid cookies exist on load

### OPA5 App Start Strategy
Use `iStartMyUIComponent` (not `iStartMyAppInAFrame`) so sinon.fakeServer installed in the test runner window intercepts XHR from the app component — no iframe window isolation issue.

Config: `{ componentConfig: { name: "anubhav.claude.managetravel", async: true } }`
Teardown: `iTeardownMyUIComponent()`

### Sinon Stub Pattern (AuthStub.js)
- Module path: `sap/ui/thirdparty/sinon` (sinon 1.x, available in UI5 1.148)
- `sinon.fakeServer.create()` with `autoRespond: true`, `autoRespondAfter: 10`
- Do NOT add a catch-all respondWith — unmatched requests pass through to real network (UI5 statics)
- Register stubs for: POST /auth/login, GET /auth/me, POST /auth/refresh, GET $metadata (both services), GET Travellers, GET TravelledLocations?, GET TravelledLocations(<id>), GET Destinations, GET Currencies

### Data Cross-Verification Pattern
1. `iClickTheFirstLocationRow()` in TravellerDashboardPage:
   - Gets `oFirstItem.getBindingContext()` from the table
   - Captures properties: `destination_ID`, `destination/name`, `destination/city`, `travelFrom`, `travelTo`, `notes`, `cost`, `currency_code`
   - Writes to `window._opaLocationRowData`
   - Fires `oTable.fireItemPress({ listItem: oFirstItem })` to trigger navigation
2. `iShouldSeeDetailDataMatchingSourceRow(oRowData)` in TravelDetailPage:
   - Checks `ObjectHeader` title = `destination/name` via `PropertyStrictEquals`
   - Checks `ObjectHeader` intro = `destination/city` via `PropertyStrictEquals`
   - Walks `travelDetailsPanel.findAggregatedObjects(true, ...)` for sap.m.Text controls
   - Verifies notes text and formatted cost (`nCost.toFixed(2) + " " + sCurrency`) are present

### formatAmount in TravelDetail.controller.js
Output: `nCost.toFixed(2) + " " + sCurrency`  e.g. `"1250.00 EUR"`

### IconTabBar tab selection in OPA5
Cannot use Press action on IconTabFilter directly; instead:
1. waitFor the IconTabBar by ID
2. In success callback: find item by key, call `oTabBar.setSelectedKey("locations")` then `oTabBar.fireSelect(...)` programmatically

**Why:** `sap-icon://map` and `sap-icon://addresses` are icon-only-visible tab filters; the Press action on the filter itself may not fire in all UI5 versions. Direct model manipulation is more reliable.

### Locations table binding
Fragment `TravelledLocationsTab.fragment.xml` binds `items` to relative path `locations` from the view's binding context (a Traveller row). The stub must return `locations: [...]` nested inside the Travellers response array item.

[[travelhub-app-auth-flow]]

---
name: project-opa5-test-config
description: OPA5 test infrastructure location, runner command, and test structure for the TravelHub managetravel Fiori app
metadata:
  type: project
---

The TravelHub OPA5 integration tests live under `app/managetravel/webapp/test/`.

**Entry point HTML:** `app/managetravel/webapp/test/indexTestFile_TravelledLocations.html`
**QUnit bootstrap JS:** `app/managetravel/webapp/test/opaTests.qunit.js`
**Journey registry:** `app/managetravel/webapp/test/integration/AllJourneys.js`

**Journey files:**
- `integration/TravelledLocationsJourney.js` — 5 OPA5 tests across 3 QUnit modules (26 assertions total)

**QUnit modules and tests (as of 2026-05-28, all passing):**
1. Login Flow
   - Should show the Login page on first load
   - Should navigate to TravellerDashboard after successful login
2. Travelled Locations Tab
   - Should display the Travelled Locations table with data after selecting the tab
3. TravelDetail Navigation and Data Cross-Verification
   - Should navigate to TravelDetail when a row is clicked
   - Should show detail data that exactly matches the source row data
   - Should navigate back to TravellerDashboard when Back is pressed on TravelDetail

**Page objects:**
- `integration/pages/LoginPage.js` — inEmail, inPassword, Emphasized button
- `integration/pages/TravellerDashboardPage.js` — travellerPage, travellerTabs (key="locations"), locationsTable
- `integration/pages/TravelDetailPage.js` — travelDetailPage, travelHeader, travelDetailsPanel, backBtn

**Mock server:** `integration/mockserver/AuthStub.js`
- Uses `sinon.useFakeXMLHttpRequest()` with `useFilters=true` (API-only intercept)
- Stubs: POST /auth/login, GET /auth/me, GET+POST /catalog/$metadata, GET /catalog/TravelledLocations, GET /catalog/Travellers, GET /catalog/Destinations, GET /catalog/Currencies, $batch
- LOCATION_ID = "loc-1111-2222-3333-4444", cost = "1250.00", currency = "EUR", destination = Paris
- `@odata.context` for single entity must include the select projection:
  `$metadata#TravelledLocations(ID,cost,currency_code,notes,travelFrom,travelTo,destination(ID,city,country,name),currency(code,name))/$entity`

**Runner:** `run-opa5-with-screenshots.js` at project root
- Serves webapp/ on port 4100 via Node http.createServer
- Puppeteer headless Chrome (--no-sandbox, --disable-web-security)
- Screenshots saved to: `app/managetravel/webapp/test/screenshots/`
- Command: `node run-opa5-with-screenshots.js` from project root
- NOTE: this file is untracked (gitignore) and can be deleted by cleanup — recreate from memory if missing

**Known issues fixed (2026-05-28):**
1. `formatAmount` in `TravelDetail.controller.js` received locale-formatted `Edm.Decimal`
   values like `"1,250"` (comma thousand-separator) from the OData V4 type system.
   Fix: strip non-numeric chars before `parseFloat`: `vCost.replace(/[^0-9.\-]/g, "")`.
2. AuthStub `LOCATION_DETAIL_RESPONSE` needed proper `@odata.context` with `$select` projection
   so the OData V4 model correctly caches and hydrates the bound controls.

**Why:** No live CAP backend needed — AuthStub intercepts all OData/auth XHR. SAPUI5 CDN (sapui5.hana.ondemand.com/1.148.0) must be reachable.

**How to apply:** Always use `run-opa5-with-screenshots.js` as the canonical runner. No `cds watch` needed.

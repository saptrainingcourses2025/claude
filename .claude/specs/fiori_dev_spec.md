 
Anubhav Trainings
Technical Specification
TravelHub
Fiori Freestyle App on CAP with OData V4 & JWT Authentication
Document Version 1.0  •  Confidential — Internal Use
 
1. Solution Overview
TravelHub is a single-page SAPUI5 freestyle application built with JavaScript that consumes the existing CAP (Cloud Application Programming Model) service over OData V4. The application authenticates users via a custom AuthService that issues JWT access and refresh tokens, routes Admin and Traveller users to role-specific dashboards using shared fragments, and persists session state in cookies so a browser refresh preserves login.
Every OData V4 call to the CatalogService carries an Authorization: Bearer <token> header, and all shared logic — cookie handling, JWT attach, error popups, logout, role guards — lives in a single BaseController.js so view controllers stay thin and predictable.
1.1 Scope of this Document
•	Frontend architecture for the TravelHub SAPUI5 freestyle app
•	JWT-based authentication flow and cookie management
•	Role-based UI (Admin / Traveller) with fragment reuse
•	OData V4 binding patterns for the existing CatalogService
•	Acceptance criteria with full traceability matrix

CAP backend handlers (AuthService implementations for login / refresh / me) are intentionally out of scope of this document — they are already implemented in the existing CAP project.
 
2. High-Level Architecture
The application is composed of three layers: the SAPUI5 frontend, the existing CAP backend, and the browser session storage (cookies).
+----------------------------------------------------------+
|                    SAPUI5 Freestyle App                   |
|                                                           |
|   Login.view.xml  -->  App.view.xml (Shell, REUSED FIRST) |
|                              |                            |
|                +-------------+--------------+              |
|                v                            v              |
|     AdminDashboard.fragment      TravellerDashboard.frag  |
|                                                           |
|   BaseController.js  (JWT, cookies, ajax wrapper, logout)|
+--------------------+--------------------------------------+
                     |  Authorization: Bearer <JWT>
                     v
+----------------------------------------------------------+
|                  CAP Backend (existing)                  |
|   AuthService:    POST /auth/login                       |
|                   POST /auth/refresh                     |
|                   GET  /auth/me                          |
|   CatalogService: /catalog/Travellers                    |
|                   /catalog/TravelledLocations            |
|                   /catalog/Destinations  ...             |
+----------------------------------------------------------+

2.1 Component Responsibilities
Component	Responsibility
App.view.xml (Shell)	Persistent first view containing the branded header and NavContainer. Reused for the lifetime of the session.
Login.view.xml	Simple credential form with a Register link. Calls AuthService.login.
Component.js	On startup, checks cookies; if a valid JWT exists, skips login and routes directly to the role-specific dashboard.
BaseController.js	All shared logic: cookie helpers, JWT attach, OData model accessor, logout, role guard, error display.
AdminDashboard / TravellerDashboard	Role-specific landing screens, each loading its dashboard fragment.
 
3. Database & Service Assumptions
The CAP service is given. This specification assumes the Travellers entity contains the fields listed below; if any are missing in the current schema, the CDS model must be extended before frontend integration.
3.1 Expected Travellers Entity Fields
Field	Type	Notes
userID	String (key / unique)	Email; must be unique across all travellers
firstName, lastName	String	Display name
password	String (hashed)	Bcrypt hash, set on register
role	String / Association	ADMIN or TRAVELLER
status	Association → TravellerStatus	LOCKED or ACTIVE
addresses	Composition	For address tab on Traveller dashboard
travelledLocations	Association	For spend chart and locations tab

Action item: Confirm these fields exist; if not, extend db/schema.cds. Registration and lock/unlock require password, status, and role to be writable.
 
4. Authentication Flow
4.1 Login
1.	User enters loginName (email) and password on Login.view.xml.
2.	Frontend calls POST /auth/login with { loginName, password }.
3.	AuthService.login verifies credentials, checks status != LOCKED, returns { access, refresh, expiresIn }.
4.	Frontend stores tokens in cookies and in the in-memory userModel.
5.	Frontend calls GET /auth/me to fetch UserInfo (id, name, roles).
6.	Based on roles, the router navigates to the Admin or Traveller dashboard.

4.2 Sending JWT on Every OData V4 Call
Every request to CatalogService must include the Authorization header. This is achieved once, in BaseController, by configuring the sap.ui.model.odata.v4.ODataModel via its changeHttpHeaders method.
// BaseController.js — reused by every view controller
attachAuthHeaderToODataModel: function () {
    var oModel = this.getODataModel();
    var sToken = this.getCookie("th_access");
    if (oModel && sToken) {
        // OData V4: applies Authorization: Bearer <token> to every CatalogService call
        oModel.changeHttpHeaders({ Authorization: "Bearer " + sToken });
    }
}

4.3 Refresh Flow
On a 401 response from any OData call, the BaseController ajax wrapper calls POST /auth/refresh with the refresh token, updates cookies, re-applies the new Authorization header to the OData model, and retries the original call once.
4.4 Logout
Logout clears all TravelHub cookies, destroys the userModel state, and navigates the router back to the login route. The logout button lives inside the shared Header fragment so every page inherits it automatically.
 
5. Cookie Management
Three cookies are used. The access token cookie drives Authorization headers; the refresh token cookie enables silent re-authentication; the user cookie carries display info so a page refresh can rebuild the userModel without an extra round-trip to /auth/me.
Cookie	Contents	Flags	Lifetime
th_access	JWT access token	SameSite=Strict; Secure	expiresIn seconds
th_refresh	JWT refresh token	SameSite=Strict; Secure; HttpOnly (recommended)	7 days (configurable)
th_user	JSON: loginName, role, firstName, lastName	SameSite=Strict	Session

Recommendation: HttpOnly should be set server-side by CAP for the refresh cookie in production. For simplicity in this build, the client may manage it directly — call this out as a real-world hardening step.

5.1 On Application Load (Component.js)
1.	Read th_access cookie.
2.	If present and not expired → populate userModel, skip Login, route to dashboard.
3.	If expired but th_refresh present → call /auth/refresh, then proceed.
4.	Otherwise → show Login.
 
6. Project Structure
All frontend code lives under webapp/. The folder layout is deliberately flat and predictable so the YouTube audience can find any file quickly.
webapp/
+-- Component.js
+-- manifest.json
+-- index.html
+-- controller/
|   +-- BaseController.js          <-- all shared logic
|   +-- Login.controller.js
|   +-- App.controller.js          <-- shell, reused first view
|   +-- AdminDashboard.controller.js
|   +-- TravellerDashboard.controller.js
+-- view/
|   +-- Login.view.xml
|   +-- App.view.xml               <-- REUSED FIRST VIEW (shell)
|   +-- AdminDashboard.view.xml
|   +-- TravellerDashboard.view.xml
+-- fragment/
|   +-- Header.fragment.xml        <-- Anubhav Trainings branding
|   +-- RegisterDialog.fragment.xml
|   +-- AdminTravellersTable.fragment.xml
|   +-- TravellerProfile.fragment.xml
|   +-- SpendDonutChart.fragment.xml
|   +-- AddressesTab.fragment.xml
|   +-- TravelledLocationsTab.fragment.xml
+-- model/
    +-- models.js
 
7. Detailed Component Specifications
7.1 App.view.xml — Reused First View (Shell)
Acts as the persistent shell containing the branding header and a NavContainer / router target. Both the Login screen and the dashboards render inside this shell, satisfying the "reuse first view" requirement.
<mvc:View controllerName="travelhub.controller.App"
          xmlns:mvc="sap.ui.core.mvc"
          xmlns:core="sap.ui.core"
          xmlns="sap.m" displayBlock="true">
    <Shell>
        <App id="appRoot">
            <pages>
                <Page id="shellPage" showHeader="false">
                    <content>
                        <core:Fragment fragmentName="travelhub.fragment.Header" type="XML"/>
                        <NavContainer id="mainNav"/>
                    </content>
                </Page>
            </pages>
        </App>
    </Shell>
</mvc:View>

7.2 Header.fragment.xml — Anubhav Trainings Branding
Every page includes this fragment. It carries the logo, the brand title, and the logout button (visible only after login).
<core:FragmentDefinition xmlns="sap.m" xmlns:core="sap.ui.core">
    <Bar design="Header">
        <contentLeft>
            <Image src="https://s2.coinmarketcap.com/static/img/coins/200x200/37581.png"
                   width="2.5rem" height="2.5rem"/>
            <Title text="Anubhav Trainings — TravelHub" level="H2"/>
        </contentLeft>
        <contentRight>
            <Button icon="sap-icon://log" text="Logout"
                    press=".onLogout"
                    visible="{= ${userModel>/loginName} !== undefined }"/>
        </contentRight>
    </Bar>
</core:FragmentDefinition>

7.3 BaseController.js — Reusable Logic
The heart of this specification. All view controllers extend BaseController and call its helpers — they never reimplement cookie reads, token handling, or HTTP plumbing.
Method	Purpose
getRouter()	Returns the app router
getUserModel()	Returns the global JSON user model
getODataModel()	Returns the V4 model for CatalogService
setCookie(name, value, seconds)	Cookie setter
getCookie(name)	Cookie reader
deleteCookie(name)	Cookie deletion
getAccessToken()	Read access token from cookie
_ajax(url, method, data)	jQuery ajax wrapper; auto-attaches Bearer; handles 401→refresh→retry
login(loginName, password)	Calls /auth/login, stores tokens, loads /auth/me
refreshToken()	Calls /auth/refresh
onLogout()	Clears cookies + model, navigates to Login
attachAuthHeaderToODataModel()	Applies Bearer header to OData V4 model
_guardRole(required)	Redirects to login if userModel role does not match
showError(msg)	Common MessageBox.error wrapper

7.4 Login.view.xml
•	Input for email (loginName)
•	Input with type=Password for the password
•	Button "Login" wired to onLogin
•	Link "Register as Traveller" opening RegisterDialog.fragment.xml
•	Anubhav Trainings logo and title above the form (from Header fragment)

7.5 RegisterDialog.fragment.xml
Popup dialog opened from the Login screen. Inputs: firstName, lastName, email, password, address. On submit:
•	Validates email format
•	Checks email uniqueness via GET /catalog/Travellers?$filter=userID eq '<email>'
•	If unique → POST /catalog/Travellers with role='TRAVELLER', status='LOCKED'
•	Shows MessageToast: "Registration successful. An admin must unlock your account before first login."

7.6 AdminDashboard.view.xml
Layout, top to bottom:
1.	Travel summary tiles — total travellers, active, locked, total spend.
2.	Donut chart fragment — aggregated spend across all travellers.
3.	AdminTravellersTable.fragment.xml — table of all travellers.

Table columns: Name | Email | Role | Status | Action (Switch for Lock/Unlock). The switch triggers PATCH /catalog/Travellers('<userID>') with the new status_code value.

7.7 TravellerDashboard.view.xml
Layout, top to bottom:
1.	Profile row — User icon, firstName + lastName, and primary address on a single inline line.
2.	SpendDonutChart.fragment.xml — donut chart of spend grouped by location (e.g., Singapore $100, Dubai $500, Delhi $250).
3.	IconTabBar with two filters: Addresses tab (editable table) and Travelled Locations tab (create / edit / delete).
4.	Single Save button at the bottom — submits all batched changes via the V4 model.

7.8 SpendDonutChart.fragment.xml
Uses sap.viz.ui5.controls.VizFrame with vizType="donut", bound to a computed JSON model that aggregates TravelledLocations by destination with SUM(amount). Aggregation is done in the controller using simple JavaScript reduce — no analytical bindings.

7.9 Single Save Button — Batched V4 Writes
OData V4 batches changes automatically when bindings share an update group. All editable tables on the Traveller dashboard are bound with $$updateGroupId: "travellerChanges"; the Save button flushes the group with one $batch call:
onSave: function () {
    var oModel = this.getODataModel();
    // OData V4: $batch — flushes queued POST/PATCH/DELETE in 'travellerChanges'.
    oModel.submitBatch("travellerChanges").then(
        function () { MessageToast.show("Saved"); },
        function (err) { this.showError(err.message); }.bind(this)
    );
}
 
8. Routing (manifest.json)
Route	Pattern	Target
login	"" (default)	Login.view.xml
adminDashboard	"admin"	AdminDashboard.view.xml
travellerDashboard	"traveller"	TravellerDashboard.view.xml

Component.js decides the initial route on startup based on cookie presence and decoded JWT role.
 
9. Acceptance Criteria — Traceability Matrix
Every acceptance criterion below maps to a concrete implementation artifact in this specification.
#	Acceptance Criterion	Implemented By
1	App starts with a simple login screen	Login.view.xml, default route
2	Both Traveller and Admin can log in	AuthService.login + role-based routing in Login.controller.js
3	Traveller can self-register via popup	RegisterDialog.fragment.xml triggered from Login
4	Email must be unique	Pre-check via $filter=userID eq '<email>' + DB unique constraint on userID
5	Traveller initially locked until admin unlocks	status='LOCKED' on register; AuthService.login rejects locked users
6	Admin sees travellers table with lock/unlock switch	AdminTravellersTable.fragment.xml + PATCH on toggle
7	Traveller sees profile (icon, name, address) + donut chart of spend per location	TravellerDashboard.view.xml + SpendDonutChart.fragment.xml
8	IconTabBar — addresses tab	AddressesTab.fragment.xml
9	IconTabBar — travelled locations tab with full CRUD	TravelledLocationsTab.fragment.xml
10	Single Save button persists changes via OData V4	submitBatch("travellerChanges")
11	Cookie management — refresh preserves session	BaseController cookie helpers + Component.js startup check
12	Logout button clears cookie and returns to login	BaseController.onLogout
13	Anubhav Trainings branding on every page	Header.fragment.xml inside the reused App.view.xml shell
14	JWT sent as Bearer on every OData V4 call	attachAuthHeaderToODataModel + changeHttpHeaders
15	Reusable code in BaseController.js	Section 7.3
16	Reuse first view (single persistent shell)	App.view.xml as shell with NavContainer
 
10. Coding Conventions
Following the "keep it simple" requirement, these conventions are non-negotiable across the codebase:
•	No formatters in XML unless they are one-liners — compute in controller, expose via JSONModel.
•	No async / await chains — use a single .then() per call.
•	No managed objects beyond standard UI5 controls.
•	Models are JSONModel + OData V4 only — no analytical bindings, no two-way deep-nesting tricks.
•	All shared logic lives in BaseController.js — view controllers should be under ~150 lines where possible.
•	No TypeScript, no build tooling beyond ui5 serve — vanilla JavaScript only.
•	No web components (sap.ui.webc.*) and no custom controls (Control.extend) — standard sap.m / sap.ui.layout / sap.viz controls only.
 
11. Out of Scope
Documented here so they can be called out clearly in the YouTube series:
•	Password reset / forgot password flow
•	Multi-factor authentication
•	Refresh-token rotation hardening (HttpOnly server-set cookies)
•	i18n beyond a single i18n.properties file
•	Mobile-specific layouts
•	CAP-side AuthService handler implementation for login / refresh / me — already implemented in the existing CAP project
 
12. Suggested Build Order
A pragmatic sequence that doubles as a YouTube episode breakdown:
1.	Extend CDS schema (password, status, role) and seed an admin user.
2.	Confirm AuthService handlers (login, refresh, me) — already implemented.
3.	Scaffold UI5 app, build App.view.xml shell + Header.fragment.xml.
4.	Build BaseController.js end-to-end (cookies, ajax, Bearer attach, logout).
5.	Login + Register (with locked-by-default).
6.	Component.js startup cookie check + role-based routing.
7.	Admin dashboard + travellers table + lock/unlock switch.
8.	Traveller dashboard: profile row + donut chart of spend per location.
9.	IconTabBar: Addresses + Travelled Locations CRUD.
10.	Single Save with submitBatch("travellerChanges").
11.	Logout, polish, and recording wrap-up.
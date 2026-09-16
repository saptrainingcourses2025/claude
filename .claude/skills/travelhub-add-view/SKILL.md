---
name: travelhub-add-view
description: Add a new view, controller, and route to the TravelHub SAPUI5 freestyle Fiori application. Use this skill whenever the user wants to add, generate, scaffold, or wire up a new screen, page, view, controller, route, or fragment in the TravelHub UI5 app — including phrases like "add a new view for X", "create a screen to manage Y", "add a route", "build a new page", "add a fragment", or "extend the Fiori app". The skill enforces project conventions — dedicated controller per view, JavaScript only (no TypeScript), reuse of BaseController helpers, OData V4 endpoints from CatalogService and AuthService, manifest-based routing, fragments for reusable view areas, mandatory Anubhav Trainings branding, and a strict no-webcomponents / no-custom-controls rule. Trigger this skill even if the user does not explicitly say "TravelHub" — any UI5/Fiori "add a view" request inside the app counts.
---

# TravelHub — Add a New View & Controller

This skill scaffolds a new screen in the TravelHub SAPUI5 freestyle app consistently with the rest of the codebase. The goal is **modular, simple, predictable code** — every new view should look like every other view, so the YouTube audience sees a clean pattern they can repeat.

## When this skill triggers

Any user request that means "extend the TravelHub UI5 app with another page". Examples:

- "Add a view to manage destinations"
- "Create a reports screen for admin"
- "Add a settings page for travellers"
- "Build a new screen showing approval requests"
- "Add a route for a help page"

If the user asks for something that looks like a reusable region inside an *existing* view rather than a whole new screen, build a **fragment only** (Section 5) instead of a full view + controller + route.

## Hard rules (do not break)

These rules are non-negotiable. They reflect explicit user requirements.

1. **JavaScript only.** No TypeScript, no `.ts` files, no type annotations.
2. **One controller per view.** Never share a controller between two views.
3. **All controllers extend `BaseController`.** Never re-implement cookie reads, token handling, OData model access, logout, or error popups — these live in `BaseController.js`. Always reuse.
4. **OData V4 only**, against the existing CAP service. Use entity sets from `srv/cat-service.cds` (`Travellers`, `TravellerTypes`, `TravelledLocations`, `Destinations`, `TravellerStatus`, `AddressTypes`) and actions from `srv/auth-service.cds` (`login`, `refresh`, `me`). Do not invent endpoints.
5. **Every OData V4 call in the controller must have a `// OData V4:` comment** on the line above it describing the endpoint, method, and purpose. This is a teaching codebase — the comments are part of the deliverable.
6. **Routing goes in `manifest.json`.** Never hard-code navigation with `window.location` or `hashChanger` hacks. Always add a `route` + `target` entry and call `this.getRouter().navTo("<routeName>")`.
7. **Fragments for any view region that could be reused** — tables, dialogs, repeated forms, the header. Even if reuse is not certain today, extract anything > ~30 lines of XML into a fragment.
8. **NO web components. NO custom controls.** Only standard `sap.m`, `sap.ui.layout`, `sap.ui.table`, `sap.viz`, `sap.ui.unified` controls. Never use `sap.ui.webc.*` namespaces. Never write a `Control.extend(...)` custom control. If a layout seems to need one, restructure with standard controls instead.
9. **Anubhav Trainings branding on every page.** Every new view must include the shared `Header.fragment.xml` at the top, which carries the logo `https://s2.coinmarketcap.com/static/img/coins/200x200/37581.png` and the "Anubhav Trainings — TravelHub" title. Never re-implement the header inline.
10. **JWT Bearer token on every OData call.** This is already handled by `BaseController.attachAuthHeaderToODataModel()` — call it in `onInit` of every new controller before any data is read. Do not manually attach headers in view controllers.
11. **Keep it simple.** No async/await chains, no formatters in XML beyond one-liners, no analytical bindings, no model gymnastics. If a view controller exceeds ~150 lines, something belongs in `BaseController` instead.

## Workflow

Follow these steps in order whenever the skill triggers.

### Step 1 — Clarify the screen

Before writing any file, confirm with the user (in one short message, not a long form):

- **View name** in PascalCase (e.g., `Destinations`, `ApprovalRequests`)
- **Audience**: `admin`, `traveller`, or `both`
- **Route pattern** (e.g., `"destinations"`, `"approvals/{requestId}"`)
- **Primary OData entity** it reads/writes (must come from `cat-service.cds`)
- **Layout intent** in one line ("table with create dialog", "form with save button", "chart + list", etc.)

If the user has already given enough detail in their message to answer all five, skip the question and state the assumptions inline at the top of your response instead. Don't pester.

### Step 2 — Read the templates

Read these files from the skill bundle before generating code. They are the source of truth — do not improvise from memory:

- `references/view-template.md` — the XML view skeleton with header include and content region
- `references/controller-template.md` — the JS controller skeleton extending BaseController, with the OData V4 comment style
- `references/fragment-template.md` — fragment skeleton for reusable regions
- `references/manifest-routing.md` — exact JSON snippet for adding a route + target
- `references/odata-v4-patterns.md` — copy-paste patterns for the four common operations (read list, read one, create, update, delete, action call) with the required comment style
- `references/anti-patterns.md` — concrete examples of things to never do (custom controls, webc, inline auth headers, etc.)

### Step 3 — Generate files

For a full new screen, generate exactly these files (use the project's `webapp/` root):

| File | Purpose |
|---|---|
| `webapp/view/<Name>.view.xml` | The view, starts with the shared `Header` fragment include |
| `webapp/controller/<Name>.controller.js` | Dedicated controller extending `BaseController` |
| `webapp/fragment/<Name>...fragment.xml` | One or more fragments for reusable regions (only if needed) |
| `webapp/manifest.json` patch | New entry under `sap.ui5.routing.routes` and `sap.ui5.routing.targets` |

Always present the manifest change as a patch (the new route object + the new target object) rather than rewriting the whole `manifest.json`, so the user can splice it in.

### Step 4 — Wire role-based access (if applicable)

If the view is for one audience only:

- In the originating dashboard controller (`AdminDashboard.controller.js` or `TravellerDashboard.controller.js`), add the navigation button that calls `this.getRouter().navTo("<routeName>")`.
- In the new view's controller `onInit`, call `this._guardRole("ADMIN")` or `this._guardRole("TRAVELLER")` — a `BaseController` helper that redirects to login if the role doesn't match. If `_guardRole` does not yet exist in BaseController, tell the user to add it (snippet in `references/controller-template.md`) rather than inlining the check.

### Step 5 — Hand off

Present the generated files, then list the **3 manual steps** the user must do:

1. Splice the route + target into `manifest.json`
2. Add the navigation entry point (button/tile) from the relevant dashboard
3. Smoke-test: login → navigate → confirm data loads with the Bearer token in DevTools Network tab

Do not skip this hand-off list — it's what makes the skill useful to a YouTuber building live on stream.

## What to do if the request is ambiguous

- **"Add a feature to manage X"** without specifying a screen → propose one view, confirm, then proceed.
- **"Add a popup"** → that's a fragment + dialog, not a route. Build only the fragment and a small handler method on the existing controller.
- **"Add a tab"** → that's a fragment loaded into an existing `IconTabBar`. Don't create a new route.
- **"Add an admin screen and a traveller screen"** → two separate views, two routes, two controllers. Do not merge.

## Reminders before you ship the code

Run this mental checklist before responding:

- [ ] Controller `extends BaseController` and calls `attachAuthHeaderToODataModel()` in `onInit`?
- [ ] Every OData V4 call preceded by a `// OData V4:` comment naming the endpoint?
- [ ] No web components, no custom controls?
- [ ] Header fragment included at top of view?
- [ ] Route added to `manifest.json` patch?
- [ ] Logout button still works (it does automatically if the header fragment is reused)?
- [ ] Total controller length is reasonable (< ~150 lines)?

If any box is unchecked, fix it before presenting.

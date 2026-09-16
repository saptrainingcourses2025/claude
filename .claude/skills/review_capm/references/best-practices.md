# CAP best practices

This file collects checks that don't fit cleanly under security, modularization, or data model — but matter for a well-built CAP app. Apply each section if the relevant artifacts are present in the project.

## 1. CDS annotations on the data model

These are quick wins. Most are one-liners that materially improve the API or UI.

### Annotations to check for

| Annotation | Purpose | Flag when |
|---|---|---|
| `@readonly` | field cannot be written via the API | Computed/audit fields are writable |
| `@mandatory` | field must have a value on create/update | Critical business fields have no constraint |
| `@assert.unique` | uniqueness beyond the key | Natural keys like `email`, `isbn` have no constraint |
| `@assert.format` | regex validation | Email/phone fields with no validation |
| `@assert.range` | numeric/date range | Ratings, ages, prices with no bounds |
| `@title` / `@description` | UI labels | Fields rendered in Fiori UI have no label |
| `@Common.Label` | OData label | Same |
| `cds.PersonalData` aspects | GDPR audit | Personal data fields with no annotation |

Don't drown the user in trivial annotation suggestions. Group them: "Consider adding `@mandatory` to: Order.customer, Order.orderDate, OrderItem.product" beats 5 separate findings.

## 2. Internationalization (i18n)

CAP supports i18n out of the box via `_i18n/` properties files.

### What to check

- **Hardcoded user-facing strings in handler code.** `req.error(400, 'Invalid ISBN')` should be `req.error(400, { code: 'INVALID_ISBN' })` with the message in `_i18n/messages.properties`.
- **`@title` / `@description` annotations using raw strings instead of `'{i18n>…}'`** for any project that needs to support multiple languages.
- **Missing `_i18n/` folder entirely** in a multi-tenant or international project — Suggestion.
- **Hardcoded date/number formats** in handlers — should use CAP's built-in formatting or the user's locale (`req.locale`).

i18n issues are almost always Suggestion-level unless the project explicitly targets multiple regions, in which case promote to Warning.

## 3. Fiori UI annotations

If the project has `app/` modules with Fiori UIs (or service-level `@UI.*` annotations), check:

- **`@UI.LineItem`** — defines the table columns. Missing/incomplete annotations result in a default UI that exposes every field including technical ones.
- **`@UI.HeaderInfo`** — required for proper object-page headers. Missing means a broken-looking Fiori detail page.
- **`@UI.FieldGroup` and `@UI.Facets`** — organize the object page. Worth flagging if missing on entities clearly meant for object pages.
- **`@Common.Text`** and **`@Common.Text.@UI.TextArrangement`** — make foreign keys show readable values. Missing means users see UUIDs.
- **`@UI.Identification`** — used in lookups, list reports.
- **Value helps** — `@Common.ValueList` for foreign-key fields with bounded reference data. Missing = users type free-text instead of picking.

These are typically Warning (poor UX) or Suggestion (polish), not Critical.

## 4. mta.yaml / deployment

If `mta.yaml` is present, sanity-check:

- **Module memory/disk-quota set explicitly.** Defaults are often too small for `db-deployer` modules.
- **`requires` and `provides` properly wired** — a `srv` module should require the HANA DB binding and the XSUAA binding it actually uses. Missing wires = runtime failures on first request.
- **Build parameters** — `build-parameters: builder: npm-ci` is preferred over plain `npm`.
- **No hard-coded credentials, hosts, or URLs.** They belong in environment-specific service bindings.
- **`destinations`** declared for any external SAP system the app calls.
- **Health check endpoints** configured for HTTP modules.
- **Routes** — if the project has `app-router`, check routes don't have wildcard `*` patterns that expose unintended paths.

## 5. Handler patterns and CAP idioms

### Good patterns to confirm

- Using `srv.before` / `srv.on` / `srv.after` correctly — `before` for validation, `on` to override, `after` for projection/enrichment.
- Awaiting `cds.tx(req).run(...)` rather than reaching for raw SQL.
- Using `SELECT.from / INSERT.into / UPDATE.entity / DELETE.from` CQL builders rather than string SQL.
- Returning the right shape from custom handlers (returning `req.reply()` or letting CAP do it).

### Anti-patterns to flag

```js
// 🟡 Warning — N+1 query
const orders = await SELECT.from(Orders);
for (const o of orders) {
  o.items = await SELECT.from(OrderItems).where({ order_ID: o.ID });
}

// ✅ Use expand
const orders = await SELECT.from(Orders).columns(o => { o`*`, o.items(i => i`*`) });
```

```js
// 🟡 Warning — swallowing errors
try { await doThing(); } catch (e) { /* nothing */ }

// 🟡 Warning — req.reject vs req.error confusion
req.error(500, 'oops');  // continues processing
req.reject(500, 'oops'); // stops processing — usually what you want for fatal errors
```

```js
// 🟡 Warning — manual transaction handling fighting CAP's
const tx = cds.transaction(req);
await tx.run(...);
await tx.commit();  // CAP manages this automatically — don't double-commit

// ✅ Just let CAP handle it
await SELECT.from(...);  // uses the request's tx automatically
```

### CAP version hygiene

- Check `@sap/cds` version in `package.json`. If pinned to a major version >1 behind current, mention it as a Suggestion (with the caveat that you can't verify the latest stable version without searching).
- If `cds.version` is referenced in code but the dependency uses `^` ranges loosely, that can cause production surprises.

## 6. Testing

- **Is there a `test/` folder at all?** A CAP project with no tests is a Warning regardless of size.
- **Are tests using `cds.test()`?** That's the CAP idiom.
- **Are auth-protected endpoints tested with `cds.test().with(auth)`?** Otherwise, security regressions slip through.

## 7. Configuration hygiene

In `package.json` under the `cds` block (or in `.cdsrc.json`):

- `requires.db.kind` set explicitly for each profile (development uses sqlite, production uses hana) — confusion here is a top cause of "works locally, breaks on deploy".
- `requires.auth.kind` set explicitly per profile (`mocked` in dev, `xsuaa` in production).
- `requires.[service]` for any remote service — missing means CAP can't wire it.

A `package.json` with no `cds` block and no `.cdsrc.json` in a non-trivial project is a Warning — it means defaults are being used everywhere, which is fragile.
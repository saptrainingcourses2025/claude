# Security checks

Security findings are the highest-stakes part of this review. A missing `@requires` ships an open endpoint to production. Be thorough here.

## 1. Endpoint protection

CAP services are **unprotected by default in production unless `auth` is configured**. Every service should have an explicit auth decision — either at the service level or per-entity/per-action.

### What to check, in order

**1a. Every `service` block has a `@requires` annotation** (or every entity/action inside it does).

```cds
// 🔴 Critical — no auth on service or any entity
service CatalogService {
  entity Books as projection on my.Books;
}

// ✅ Good — service-level guard
@requires: 'authenticated-user'
service CatalogService {
  entity Books as projection on my.Books;
}

// ✅ Also good — granular per entity
service CatalogService {
  @requires: 'authenticated-user'
  entity Books as projection on my.Books;

  @requires: 'admin'
  entity Authors as projection on my.Authors;
}
```

**1b. `@requires` value is meaningful.** `'any'` means "open to everyone including unauthenticated" — that's almost never what the developer wants in a business app. Flag every `@requires: 'any'` and ask whether it's intentional.

**1c. Write operations have stricter guards than reads.** Look for unbounded actions:

```cds
// 🟡 Warning — anyone authenticated can mutate
@requires: 'authenticated-user'
entity Orders as projection on my.Orders;

// ✅ Better — restrict writes
entity Orders as projection on my.Orders {
  @restrict: [
    { grant: 'READ',  to: 'authenticated-user' },
    { grant: 'WRITE', to: 'OrderManager' }
  ]
}
```

**1d. Custom actions and functions are individually guarded.** Actions declared in a service inherit service-level `@requires`, but if the service has none, the action is open. Check each `action` and `function` declaration.

**1e. Draft-enabled entities** (`@odata.draft.enabled`) and **bound actions** need particular care — they create additional endpoints under the hood.

**1f. `@restrict` with `where` clauses** for instance-based authorization. If the project filters by tenant/user (e.g., `where: 'createdBy = $user'`), that's good — call it out as positive. If the project handles personal data with no such filter, flag it.

### Common patterns that should never ship

- `service Foo @(requires: 'any')` on anything with write operations — Critical
- A service handler `srv/admin-service.js` with no `@requires: 'admin'` on its CDS — Critical
- `cds.env.requires.auth = 'mocked'` referenced anywhere in production config — Critical
- `@cds.persistence.skip` on an entity exposed via a service — Warning (the entity is queryable but has no backing store; usually a mistake)

## 2. xs-security.json

This file declares the XSUAA security descriptor: scopes, role templates, attributes. It's required for any CAP app deploying to BTP with XSUAA-based auth (which is the default for production CAP apps on BTP).

### Presence check

- File missing entirely **and** `mta.yaml` references XSUAA OR `package.json` has `@sap/xssec` / `passport` / `@sap/audit-logging` → **🔴 Critical: xs-security.json is missing.**
- File missing **and** no XSUAA binding referenced anywhere → **🟡 Warning** with explanation that XSUAA is the standard auth approach on BTP.

### Content check (when present)

Open the file and verify:

- `xsappname` is set and not a placeholder like `"my-app"` or `"changeme"`
- `tenant-mode` is set (`"dedicated"` or `"shared"`) — missing is a Warning
- `scopes` are declared for every distinct role the CDS uses (`@requires: 'admin'` needs a corresponding `admin` scope)
- `role-templates` reference scopes that actually exist
- `oauth2-configuration.redirect-uris` doesn't contain `*` wildcards in production — Critical
- No real secrets are committed in the file

### Cross-check CDS roles ↔ xs-security scopes

This is one of the highest-value checks. Collect every role name referenced in CDS (`@requires: 'X'`, `@restrict: [{to: 'X'}]`) and confirm each maps to a scope/role-template in `xs-security.json`. A role referenced in CDS but missing in `xs-security.json` will cause silent 403s in production — flag as Critical.

## 3. Other security surfaces

- **CORS** — if a custom `cds.on('bootstrap')` adds `cors()` with `origin: '*'` or `origin: true`, flag as Warning.
- **Logging of PII** — handlers that `console.log(req.data)` on entities with `@PersonalData` annotations are a Warning.
- **`@cds.api.ignore`** vs **`@readonly`** — these are different. `@cds.api.ignore` hides a field from the API entirely; `@readonly` exposes it but blocks writes. Misuse is a Warning.
- **SQL injection via raw `cds.run`** — flag any `cds.run(\`SELECT … ${userInput}\`)` patterns as Critical.
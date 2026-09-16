# Modularization and file organization

CAP rewards a clean folder structure. The goal is to identify *where the current project deviates from CAP conventions* and *where a single file is doing too much*.

## CAP's expected layout

A healthy CAP project looks like this:

```
project/
├── app/                    # UI modules
├── db/
│   ├── schema.cds          # data model
│   └── data/               # CSV seed data
├── srv/
│   ├── <domain>-service.cds        # one service definition per domain
│   ├── <domain>-service.js         # matching handlers
│   └── lib/ or utils/              # shared helpers
├── package.json
├── xs-security.json
└── mta.yaml
```

Deviations aren't automatically wrong, but they're worth flagging.

## What to look for

### 1. Service files that have grown too large

**Signal:** a single `srv/service.js` (or `service.ts`) over ~250 lines, or one that handles 3+ distinct domain entities.

**Recommendation:** split by domain. One `<domain>-service.cds` + matching `<domain>-service.js` per bounded context. CAP auto-discovers handler files that match a service file's basename, so the split is free — no wiring needed.

```
// Before
srv/
  service.cds       (defines CatalogService, AdminService, ReviewService)
  service.js        (600 lines, all three services)

// After
srv/
  catalog-service.cds + catalog-service.js
  admin-service.cds   + admin-service.js
  review-service.cds  + review-service.js
```

### 2. Handler files mixing concerns

In a single handler file, look for:

- **Business logic mixed with persistence** — long inline SQL/CQL inside an event handler. Extract to a repository function under `srv/lib/`.
- **External API calls inline** — `axios.get(...)` or `fetch(...)` directly inside a handler. Extract to a client module, typically under `srv/external/` or use CAP's remote service feature.
- **Validation logic copy-pasted** — the same `if (!req.data.x) req.error(...)` block in multiple handlers. Extract to a validator helper, or better, push the check into CDS via `@assert` annotations.

### 3. Data model in one giant file

**Signal:** `db/schema.cds` over ~300 lines, or one file containing entities for unrelated domains.

**Recommendation:** split by aggregate root or domain.

```
db/
  common.cds           // managed types, value lists, codes
  catalog.cds          // Books, Authors, Genres
  orders.cds           // Orders, OrderItems, Shipments
  schema.cds           // namespace + `using` re-exports if needed
```

CAP merges all `.cds` files in `db/` automatically. No build config needed.

### 4. Services that should be different services

This is the inverse of "files too big" — sometimes things that look like one service should be two.

**Signals:**
- A service exposes both internal admin operations and public-read endpoints (different auth, different consumers → different services).
- A service has entities with wildly different update frequencies (master data vs transactional data).
- A service mixes draft-enabled entities with non-draft entities in confusing ways.

**Recommendation:** mention that a split would clarify the boundary, and suggest concrete names.

### 5. Handler registration patterns

Look for handlers that don't follow CAP conventions:

```js
// 🟡 Warning — registering inside a loop, hard to read
['Books', 'Authors', 'Genres'].forEach(e => {
  srv.before('READ', e, handler);
});

// ✅ Better — explicit, greppable
srv.before('READ', 'Books', readBooksHandler);
srv.before('READ', 'Authors', readAuthorsHandler);
```

Or:

```js
// 🟡 Warning — anonymous arrow functions for non-trivial handlers
srv.on('createOrder', async (req) => { /* 80 lines */ });

// ✅ Better
const { createOrder } = require('./lib/order-handlers');
srv.on('createOrder', createOrder);
```

### 6. Cross-cutting concerns that belong in `srv/`-level hooks or middleware

If you see the same authorization check, same logging line, same audit-log call repeated in many handlers, that's a candidate for a `srv.before('*', ...)` registration or a custom middleware.

## How to phrase modularization findings

Modularization issues are rarely Critical. They're almost always Warning or Suggestion. **Always propose the specific target file structure** — vague advice like "consider splitting this up" doesn't help.

Good finding example:

> **S3. Split `srv/service.js` by domain**
> Where: `srv/service.js` (487 lines, handlers for `Books`, `Authors`, `Reviews`, `Orders`)
> Recommendation: split into four files matching the CDS service files. Specifically:
> - Move `Books` and `Authors` handlers → `srv/catalog-service.js`
> - Move `Reviews` handlers → `srv/review-service.js`
> - Move `Orders` handlers → `srv/order-service.js`
> - Shared `formatCurrency` and `validateISBN` helpers → `srv/lib/formatters.js`
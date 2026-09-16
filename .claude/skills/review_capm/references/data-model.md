# Data model review

The data model is the foundation. Mistakes here cascade — wrong association cardinality means wrong handlers, wrong UI, wrong reports.

## 1. Normalization

CAP uses CDS to define entities that map to relational tables. Standard normalization rules apply, but with CAP-specific nuances.

### Things to look for

**1NF — Repeating groups in a single field.** Watch for `String(2000)` fields that obviously hold CSV or JSON arrays the developer is parsing in handlers. That's a separate entity waiting to happen.

```cds
// 🟡 Warning
entity Books {
  key ID : UUID;
  authors : String(500);   // stores "Alice, Bob, Carol"
}

// ✅ Better
entity Books {
  key ID : UUID;
  authors : Composition of many Book_Authors on authors.book = $self;
}
entity Book_Authors { /* … */ }
```

**2NF/3NF — Transitive dependencies and partial-key dependencies.** If you see fields like `customer_name`, `customer_email`, `customer_city` on an `Orders` entity (i.e., copies of `Customer` fields), that's denormalization. Sometimes it's intentional (snapshot of customer at order time) — call it out and ask.

**Key choices.**
- Prefer `UUID` keys for new CAP projects (CAP idiom; works well with drafts, OData, distribution).
- Composite natural keys are fine when they truly are immutable identifiers (`country_code`, `currency_code`).
- Avoid auto-increment integer keys unless there's a specific reason — they hurt portability and concurrent insert performance.

**Reuse aspects.** CAP ships `cuid`, `managed`, `temporal`, `Country`, `Currency`, `Language` etc. in `@sap/cds/common`. If a project re-implements these (defines its own `createdAt`/`createdBy`/`modifiedAt`/`modifiedBy` fields, its own country code list), flag it.

```cds
// 🟡 Warning — reinventing managed
entity Orders {
  key ID         : UUID;
  createdAt      : Timestamp;
  createdBy      : String;
  modifiedAt     : Timestamp;
  modifiedBy     : String;
}

// ✅ Better
using { cuid, managed } from '@sap/cds/common';
entity Orders : cuid, managed { /* domain fields only */ }
```

**`@assert.unique` for natural unique constraints.** If an entity has a field like `isbn` or `email` that should be unique but only `ID` is the key, flag the missing constraint.

```cds
entity Books : cuid {
  @assert.unique
  isbn   : String(13);
  title  : String(200);
}
```

## 2. Associations vs Compositions

This is the single most misunderstood part of CDS modeling. Get it wrong and you get cascade-delete bugs, draft issues, and broken OData expand behavior.

### The rule

- **Composition** = parent owns the children. Lifecycle is bound: delete the parent → children are deleted. The child cannot exist without the parent. The child belongs *to* exactly one parent.
- **Association** = a reference. The two entities exist independently. Deleting one does not delete the other.

### Decision checklist

For every relationship in the data model, ask:

1. Does the "child" entity make sense on its own? → If yes, **Association**. If no, **Composition**.
2. If the parent is deleted, should the child also be deleted? → Yes = Composition, No = Association.
3. Can the child be reassigned to a different parent over its lifetime? → Yes = Association, No = Composition.

### Classic mistakes to flag

**Mistake A: Composition used for shared reference data**

```cds
// 🔴 Critical
entity Books {
  genre : Composition of one Genres;   // wrong!
}
entity Genres { /* shared list */ }

// Deleting a Book would delete the Genre.
// Result: every other Book pointing to that Genre breaks.
```

This should be `Association to one Genres`.

**Mistake B: Association used for owned children**

```cds
// 🔴 Critical
entity Orders : cuid {
  items : Association to many OrderItems on items.order = $self;
}
entity OrderItems : cuid {
  order : Association to one Orders;
}

// Deleting an Order leaves orphan OrderItems forever.
```

This should be `Composition of many OrderItems`.

**Mistake C: Missing backlink in compositions**

```cds
// 🟡 Warning
entity Orders : cuid {
  items : Composition of many OrderItems on items.order = $self;
}
entity OrderItems : cuid {
  // no `order` field — the `on` condition can't resolve cleanly
}

// ✅ Better
entity OrderItems : cuid {
  order : Association to one Orders;  // backlink for the composition
}
```

**Mistake D: `to-many` without an `on` condition**

```cds
// 🟡 Warning — works for managed compositions, but ambiguous for associations
entity Authors {
  books : Association to many Books;
}

// ✅ Better — explicit
entity Authors {
  books : Association to many Books on books.author = $self;
}
```

**Mistake E: Cascading deletes through deep composition trees with no thought**

If `Order → OrderItems → ItemAdjustments → AdjustmentReasons` is all `Composition`, a single Order delete cascades through four levels. Sometimes that's right; often it's a sign the model wasn't thought through. Call it out and ask whether some of those should be Associations.

### When to call this out as Critical vs Warning

- Wrong direction (deleting parent destroys shared reference data) → **🔴 Critical** (data loss waiting to happen)
- Right direction but orphaning possible (Association where Composition should be) → **🟡 Warning** (data integrity issue but not immediate loss)
- Missing `on` condition, missing backlink → **🟡 Warning**
- Cascade chain that *might* be too deep → **🔵 Suggestion** with a question, not a verdict

## 3. Other data model concerns to surface

- **Localized fields** — `localized String` on user-facing labels is good; flag entities with English-only `title`/`description` as a Suggestion.
- **`@cds.persistence.exists`** — used when CAP maps to an existing database table. Flag if it appears unintentionally.
- **Temporal data** — if an entity has `validFrom`/`validTo`-style fields hand-rolled, suggest the `temporal` aspect from `@sap/cds/common`.
- **Enums vs code lists** — short closed sets (`Status: 'New' | 'Open' | 'Closed'`) can be CDS enums; large lists should be entities with associations.
- **Indexes** — CAP doesn't auto-create indexes beyond keys. If you see queries filtering on `email` or `customer_id` in handlers but no index hint in the CDS (via `@cds.persistence.table` + hdbtabledata, or HANA-specific annotations), it's a Suggestion for performance.
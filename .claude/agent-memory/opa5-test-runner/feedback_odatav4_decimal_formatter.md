---
name: feedback-odatav4-decimal-formatter
description: OData V4 Edm.Decimal values arrive at formatters as locale-formatted strings (e.g. "1,250") not raw decimals — formatters must strip thousand separators before parseFloat
metadata:
  type: feedback
---

In SAPUI5 1.148 OData V4 with `autoExpandSelect: true`, when a `parts` binding uses a
JavaScript `formatter` function, each part's value is passed through the OData type system
BEFORE reaching the formatter. For `Edm.Decimal` properties, the `sap.ui.model.odata.type.Decimal`
type formats the raw JSON string `"1250.00"` into a locale-formatted string like `"1,250"` 
(with a comma thousand-separator in en-US locale).

If a formatter calls `parseFloat("1,250")`, JavaScript returns `1` (stops at the comma),
producing `"1.00 EUR"` instead of `"1250.00 EUR"`.

**Fix:** Strip non-numeric characters (except decimal point and minus) before parsing:
```js
var sRaw = typeof vCost === "string" ? vCost.replace(/[^0-9.\-]/g, "") : String(vCost);
var nCost = parseFloat(sRaw);
```

**Why:** Discovered during OPA5 test run 2026-05-28. The `formatAmount` function in
`TravelDetail.controller.js` was receiving `"1,250"` (locale string) instead of `"1250.00"`.
This is NOT a test-only issue — the production UI was also showing `"1.00 EUR"` for any cost
value >= 1000.

**How to apply:** Any formatter in this codebase that receives `Edm.Decimal` or `Edm.Int32`/
`Edm.Int64` via `parts` binding should sanitize the input before numeric parsing.
Check OData type mappings: `Edm.Decimal` → type-formatted string, not raw number.

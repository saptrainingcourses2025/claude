---
name: cap-project-reviewer
description: Review an SAP BTP CAP (Cloud Application Programming Model) project for security, data model quality, modularization, and best practices. Use this skill whenever the user asks for a review, audit, code review, security check, or quality check of a CAP project — including any mention of CAP, CAPM, CDS, "cds files", "service.cds", "schema.cds", srv/, db/, xs-security.json, mta.yaml, or "BTP project". Trigger even if the user just says "look at my CAP app", "review my project", "is my service secure", "check my data model", or shares a CAP project folder without explicitly asking for a "review". Produces a structured Critical / Warning / Suggestion report covering endpoint protection, xs-security.json presence, modularization opportunities, data model normalization, associations vs compositions, and overall CAP best practices.
---

# CAP Project Reviewer

A structured review skill for SAP BTP Cloud Application Programming Model (CAP) Node.js and Java projects. The goal is to produce a finding-by-finding report that a CAP developer can act on immediately — not a vague "looks good" summary.

## When to use this skill

Trigger this skill whenever the user wants any kind of quality check on a CAP project. The conversational cue is often soft ("can you take a look at this", "any issues?"), so don't wait for the word "review". If the project contains `srv/`, `db/`, `.cds` files, a `package.json` with `@sap/cds`, or a `mta.yaml`, this skill applies.

## Workflow

Follow these phases in order. Don't skip the discovery phase — without it, the review is guesswork.

### Phase 1 — Discover the project shape

Before analyzing anything, build a mental map. Run:

```bash
find <project_root> -type f \( -name "*.cds" -o -name "*.json" -o -name "*.js" -o -name "*.ts" -o -name "*.yaml" -o -name "*.yml" \) -not -path "*/node_modules/*" -not -path "*/gen/*" -not -path "*/dist/*" | head -200
```

Then explicitly locate and read these files if present (each is a high-signal artifact):

- `package.json` — confirms CAP version, runtime (Node.js vs Java), and dependencies
- `db/schema.cds` (or any `db/*.cds`) — data model
- `srv/*.cds` — service definitions (this is where security lives)
- `srv/*.js` / `srv/*.ts` — service handlers
- `xs-security.json` — XSUAA security descriptor
- `mta.yaml` — deployment descriptor
- `.cdsrc.json` or `cds` block in `package.json` — CAP configuration
- `app/` — UI modules (Fiori), if present

If the user attached a zip or pointed to a folder, list its contents first and confirm you've found the CAP project root (the folder containing `srv/` and/or `db/`).

### Phase 2 — Run the checks

For each focus area below, load the matching reference file and apply its checklist. Don't try to remember the criteria — read the reference. The references are kept separately so they can be updated independently and so this main file stays scannable.

| Focus area | Reference file |
|---|---|
| Endpoint protection (`@requires`, `@restrict`) | `references/security.md` |
| `xs-security.json` presence and shape | `references/security.md` |
| Modularization & file organization | `references/modularization.md` |
| Data model normalization | `references/data-model.md` |
| Associations vs Compositions | `references/data-model.md` |
| General CAP best practices | `references/best-practices.md` |
| CDS annotations, i18n, Fiori, MTA | `references/best-practices.md` |

Read every reference once at the start of Phase 2 — they're short and the checks interact (e.g., a service split affects both modularization and security scoping).

### Phase 3 — Classify each finding

Every finding gets exactly one severity:

- **🔴 Critical** — security holes, data loss risk, deployment-blocking issues. Examples: unprotected service endpoint, missing `xs-security.json` on a project bound to XSUAA, cascading delete that will orphan data, a `to-one` association used where a `composition` is required for lifecycle ownership.
- **🟡 Warning** — bugs waiting to happen, violations of CAP idioms that will cause grief later. Examples: business logic in a single 600-line `service.js`, missing `@assert.unique` on natural keys, using `Association to many` without an explicit `on` condition.
- **🔵 Suggestion** — improvements, not problems. Examples: extract a helper into `srv/utils/`, add i18n for user-facing messages, add `@readonly` to computed fields.

If unsure, err one level lower (don't inflate). A report full of "Critical" findings teaches the developer nothing.

### Phase 4 — Write the report

Use this exact structure. The shape matters — it's what makes the report scannable and actionable.

```markdown
# CAP Project Review: <project name>

## Summary
- Project type: <Node.js | Java> CAP, CAP version <x.y.z if known>
- Files reviewed: <count> .cds, <count> handler files
- Findings: <N> Critical, <N> Warning, <N> Suggestion

## 🔴 Critical findings

### C1. <Short title>
**Where:** `<file>:<line-or-section>`
**Issue:** <one sentence>
**Why it matters:** <one or two sentences — concrete consequence>
**Fix:**
```cds
// before
<snippet>

// after
<snippet>
```

## 🟡 Warnings
(same structure, numbered W1, W2, …)

## 🔵 Suggestions
(same structure, numbered S1, S2, …)

## What looks good
<2–5 bullets — genuinely call out things done well. This is not flattery; it tells the developer what patterns to keep.>

## Suggested next steps
<Ordered list of 3–5 concrete actions, ordered by impact-per-effort.>
```

Important formatting rules for the report:

- **Always cite file paths and, where possible, line numbers or entity/service names.** "Books service is unprotected" is weak; "`srv/catalog-service.cds` line 8: `service CatalogService` has no `@requires`" is actionable.
- **Show before/after CDS or JS snippets for every Critical and most Warnings.** Developers act on patches, not prose.
- **Don't invent issues to pad the count.** If there are no Critical findings, say so. A short, honest report is more useful than a long padded one.
- **Use CAP terminology correctly.** "Entity" not "table", "service" not "API" (in the CDS layer), "composition" vs "association" matter — getting these wrong undermines trust in the rest of the review.

### Phase 5 — Deliver

Default delivery: **both** an inline summary in chat AND a saved Markdown file the user can download. Save the report to `/mnt/user-data/outputs/cap-review-<project-name>.md` and present it with `present_files`. In chat, give a one-screen summary (counts by severity + top 3 issues) and let the file carry the detail.

If the project is small (≤ ~5 files of CDS/JS), inline is fine — skip the file.

## Tone

The user is an SAP developer who knows CAP. Don't over-explain CAP basics. Do explain *why* a finding matters — security, performance, maintainability — in concrete terms. Treat the developer as a peer; the goal is a useful review, not a lecture.

## What this skill does NOT do

- It doesn't run the project or execute `cds build` / `cds deploy`. It's a static review.
- It doesn't audit the UI layer's JavaScript in depth (Fiori UI5 controllers) — only the CAP-facing parts (annotations, manifest bindings).
- It doesn't replace `cds lint` or `eslint`. Mention to the user that those should run in CI alongside this review.
# Architecture Improvements

Findings from a codebase review of `church-directory`. Each item lists the files involved, the friction, the proposed change, and the locality/leverage payoff. Tackle in the order listed — earlier items unblock later ones.

---

## 1. Canonical Pastor shape — kill string-or-array coercion ✅ DONE

**Status:** Adapters built and wired into POST/PUT/inactive routes. Tests at `lib/pastor.test.ts` (19 cases). Vitest set up (`npm test`).

**Shipped**
- `lib/pastor.ts` — `serializePastor` hardened (now handles `clergy_type` coercion + Governor relocation, was missing both) and new `parsePastorInput(body)` for write paths.
- `types/entities.ts` — `clergy_type` and `ministry_group` tightened to non-optional arrays.
- `app/api/pastors/route.ts` (POST) — ~50 lines of inline coercion → 4-line call to `parsePastorInput`.
- `app/api/pastors/[id]/route.ts` (PUT) — ~80 lines of guarded coercion → ~20 lines.
- `app/api/pastors/inactive/route.ts` — replaced bespoke transform with `serializePastor`.
- Vitest config + scripts (`test`, `test:watch`).

**Deferred (pick up before #4 or alongside it)**
- `app/api/pastors/bulk-upload/route.ts` — Excel-specific comma-split parsing is interleaved with validation gates. Refactoring to call `parsePastorInput` at the end needs its own test scaffolding; safer once #6 (`PastorExcelSchema`) gives us a tested parser to lean on.
- ~30 reader-side `Array.isArray(p.x) ? p.x : [p.x]` branches across `app/clergy/page.tsx`, `app/clergy/[id]/page.tsx`, `components/PastorFormDialog.tsx`, `components/Dashboard.tsx`, `app/admin/inactive-pastors/page.tsx`. Now cosmetic — the type guarantees arrays. Safe mechanical cleanup; defer until #4 since `PastorFormDialog` gets rewritten there anyway.

**Original notes (kept for context)**

`clergy_type`, `council`, `function`, `ministry_group` were typed as arrays but ~30 call sites defended with `Array.isArray(p.x) ? p.x : p.x ? [p.x] : []`. Each write path re-ran a dedup/coerce dance.

Made `serializePastor` the single Pastor adapter at the DB→API seam (arrays-always-arrays, dates `YYYY-MM-DD`, ids strings, Governor moved out of `clergy_type`). Added `parsePastorInput(body)` as the parallel write-side adapter.

---

## 2. `requireAdmin` route-handler adapter

**Files**
- Server routes (15): `app/api/pastors/route.ts`, `pastors/[id]/route.ts`, `pastors/bulk-upload/route.ts`, `pastors/migrate/route.ts`, `pastors/send-codes-sms/route.ts`, `churches/route.ts`, `churches/[id]/route.ts`, `auth/invite/route.ts`, `users/route.ts`, `users/[id]/route.ts`, `pastor-fields/route.ts`, `sms/route.ts`, `sms/send/route.ts`, `sms/balance/route.ts`, `sms/status/[messageId]/route.ts`, `attendance/route.ts`, `attendance/bulk-upload/route.ts`
- Client admin pages: `app/admin/users/page.tsx`, `app/admin/tithe-tracking/page.tsx`, `app/admin/pastor-fields/page.tsx`

**Problem**
The same admin gate is re-implemented in 15 handlers, with three signatures: `(session.user as any).role !== "admin"`, a local `requireAdminSession()` (attendance), and a local `isAdmin()` helper (SMS routes). Status codes drift (403 mostly, 401 in `pastor-fields`); response shapes drift; messages drift. Admin client pages repeat a near-identical redirect-if-not-admin block.

**Solution**
- `requireAdmin(): Promise<Session | NextResponse>` in `lib/auth.ts`.
- `useRequireAdmin()` hook for admin client pages.

**Payoff**
- One place for authorization policy.
- Gate becomes a tested function instead of inlined branches.
- Adds the missing role guard in `app/admin/inactive-pastors/page.tsx` for free.

---

## 3. Single API response envelope

**Files**
Every `app/api/**/route.ts`; every client fetch site.

**Problem**
Five envelope dialects live in the app:
- `{ success, data }` — most pastor/church routes
- `{ success, data, error, reason, statusCode }` — SMS
- `{ users }` / `{ tokens }` — no envelope (users, invites)
- `{ message, user }` / `{ error }` — auth
- `{ error }` only — error paths in pastor-fields and users

Every client must do bespoke `response.ok` + `data.success` + `data.error || data.message` plumbing.

**Solution**
- `apiOk(data)` / `apiErr(error, status, extras?)` helpers at the route seam.
- `fetchJson<T>(url, init)` adapter on the client that throws a typed `ApiError` for non-OK responses.

**Payoff**
- Routes shrink to one-line responses.
- Page data-loading collapses across ~20 components.
- Two adapters (server + client) at one real seam.

---

## 4. `PastorIntake` module — make `PastorFormDialog` shallow on purpose

**Files**
- `components/PastorFormDialog.tsx` (1020 lines)
- Duplicated validation in `app/api/pastors/route.ts` POST, `app/api/pastors/[id]/route.ts` PUT, `app/api/pastors/bulk-upload/route.ts`

**Problem**
The dialog hides deep domain rules behind a tiny interface, and the same rules are re-implemented (divergently) in three server routes:
- "Governor in title → move to function"
- "Council → default area"
- "Area 4 keeps `ministry_group`, others clear it"
- "Occupation 'Other' uses `customOccupation`"
- "Function 'Not Applicable' must be alone"
- "Clergy type must be 1–2 entries"

The dialog blocks empty council with a toast; the API rejects with a different message; bulk-upload allows it differently.

**Solution**
- New `lib/pastor-intake.ts`: pure `normalizePastorDraft(input) → { payload, errors }` owning every rule.
- The dialog becomes "render fields, on-change update draft, on-submit normalize-and-post."
- The three API routes call the same function on the wire body.
- ~150 lines of hardcoded field defaults in the dialog move to a `PastorDefaults` module backed by the `pastor-fields` cache (see #5).

**Payoff**
- One place to add a rule like "Bishops can't be Mothers."
- Dialog drops to ~400 lines of mostly JSX; routes drop to thin auth-and-persist.
- `normalizePastorDraft` is the entire test surface for write-time Pastor validity.

---

## 5. `PastorFieldOptions` direct-call seam — remove the self-fetch loop

**Files**
- `app/api/pastor-fields/route.ts`
- `app/api/pastors/bulk-upload/route.ts` (fetches the route over HTTP from inside the server)
- `components/PastorFormDialog.tsx`, `components/PastorBulkUpload.tsx` (hardcoded fallback copies)
- `app/admin/users/page.tsx`, `app/clergy/page.tsx` (consumers)

**Problem**
The seeded defaults are hardcoded inside the route handler and never written to DB. Bulk-upload makes an internal HTTP fetch to read them. The form and the bulk-upload component keep their own hardcoded fallbacks. The bulk-upload template generator hardcodes a third copy of ministry groups.

**Solution**
- `lib/pastor-field-options.ts` exporting `getFieldOptions()` (DB + seeded defaults merge).
- Route becomes a thin JSON wrapper.
- Bulk-upload imports the function directly (no HTTP).
- Client components fetch the route normally and drop their hardcoded fallbacks.
- Governor-stripping rule lives only here.

**Payoff**
- No internal HTTP round-trip.
- Admins edit options and every surface (form, filter, bulk-upload template, bulk-upload validation) sees the same values.

---

## 6. Shared `PastorExcelSchema` — one source for template + parser + export

**Files**
- `components/PastorBulkUpload.tsx` (template generation)
- `app/api/pastors/bulk-upload/route.ts` (parsing)
- `app/clergy/page.tsx` (export to Excel)

**Problem**
Excel template, parser, and exporter each hand-maintain their own column list. Adding a Pastor field requires three edits. The parser silently accepts old column names via `row["Foo"] || row["foo"]`.

**Solution**
- `lib/pastor-excel-schema.ts`:
  ```ts
  pastorExcelSchema: {
    column: string;
    fieldKey: keyof Pastor;
    write(pastor): cellValue;
    parse(cellValue): fieldValue;
  }[]
  ```
- Template generator, exporter, and parser all iterate the same array.

**Payoff**
- One edit to add or rename a column.
- Template ↔ parser drift becomes impossible.
- Round-trip becomes a property test.

---

## Smaller items (do after the above)

- **Pastor type split** — `PastorDraft` (everything optional) / `PastorPayload` (canonical for write) / `Pastor` (canonical for read). Becomes obvious after #1 + #4.
- **`calculateAge` UTC bug** — `lib/utils.ts::calculateAge` uses local-time `new Date()` while attendance uses strict UTC. Switch to the `lib/attendance.ts` UTC helpers.
- **`PageActionsContext` stores React nodes** — works, but a declarative `usePageActions({filter, add, ...})` would be easier to reason about. Low priority.
- **`next-auth` type casts** — ~20 `(session.user as any).role` casts. Tighten `types/next-auth.d.ts` and remove.
- **Inactivity timer throttle** — `components/AuthProvider.tsx` re-runs `resetTimer` on every mousemove. Throttle for cleanliness.

---

## Suggested execution order

1. ~~**#3** API envelope~~ — _deferred (originally proposed first; #1 was done first instead)._
2. **#2** `requireAdmin` — **next up.** Mechanical; 15 server routes + 3 client admin pages. Use `lib/pastor.test.ts` as the testing pattern.
3. ~~**#1** Canonical Pastor shape~~ — ✅ done (see above; bulk-upload + reader cleanup deferred).
4. **#5** `PastorFieldOptions` — small, removes a self-fetch loop; unblocks #4's defaults extraction.
5. **#4** `PastorIntake` — the big refactor; needs #1, #3, #5 in place. Folds in the deferred reader-side `Array.isArray` cleanup automatically (PastorFormDialog gets rewritten).
6. **#6** `PastorExcelSchema` — last; needs #1's canonical shape and #4's normalizer. Folds in the deferred bulk-upload refactor.

Each step keeps every existing behaviour; the refactors concentrate rather than change them.

## Testing notes (added during #1)

- Vitest is configured at `vitest.config.ts` with `@/*` path alias and `node` environment.
- Pattern: pure-function adapters (`serializePastor`, `parsePastorInput`) tested directly. No mocks needed.
- Run with `npm test` (single pass) or `npm run test:watch`.
- For #2 specifically: `requireAdmin()` returns either a session or a `NextResponse` — test the branching directly with a mocked `getServerSession`. Keep route handlers themselves untested for now (they need a DB, out of scope).

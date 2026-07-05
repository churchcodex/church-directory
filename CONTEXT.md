# Church Directory

A directory of First Love Church campuses and their pastors, used by church administrators to track clergy, membership, income, and attendance.

## Language

**Region**:
The geographic bucket a Church belongs to — currently "Accra" or "Outside Accra" (extensible string, not a boolean).
_Avoid_: zone, branch location, city

**Church**:
A physical campus of First Love Church, located in exactly one Region.
_Avoid_: campus (UI display word only — the domain term is Church)

**Pastor**:
A clergy member. A Pastor's Region is **derived** from the Church they belong to; it is never stored on the Pastor.
_Avoid_: clergy (UI display word), user (that means an app login account)

**Area**:
An internal organizational grouping of Pastors (e.g. "HGE Area 1", "Experience Area 4"). NOT geography — do not confuse with Region. An Accra-only structure.

**Council**:
An internal ministry grouping a Pastor serves in (e.g. "Philippians", "Dancing Stars"). `user`-role accounts are scoped to a Council. An Accra-only structure.

## Relationships

- A **Church** belongs to exactly one **Region**
- A **Pastor** belongs to at most one **Church** (required at creation going forward; legacy Pastors may lack one)
- A **Pastor**'s **Region** = their **Church**'s Region; a Pastor with no Church defaults to **Accra**

## Business rules

- Creating a Pastor requires selecting their Church (was optional before Regions existed). Enforced at intake for new creates only — legacy church-less Pastors remain editable.
- Council and Area are required for Accra Pastors only; for Outside-Accra Pastors they are optional (Accra-only structures).
- Outside-Accra Pastors can only exist once an Outside-Accra Church exists to attach them to ("church first, then its pastors").
- A Church may exist without a head pastor (assigned later) — this breaks the church↔pastor chicken-and-egg when opening a new Region.
- All Churches and Pastors existing before the Region split are Accra.
- Attendance and tithe tracking are Accra-only: Outside-Accra Pastors never appear in attendance rows, bulk-upload matching, or summaries.
- Pastor bulk upload targets one admin-chosen Church per batch; every row attaches to it (and inherits its Region).
- Personal codes (G-####) are one global sequence across Regions; the code SMS goes to every new Pastor regardless of Region.
- Dashboard, churches, and clergy views carry a Region switcher: Accra | Outside Accra | All (default Accra). No new roles — the central admin team manages both Regions.

## Example dialogue

> **Dev:** "A new Pastor from Kumasi — do I set their Region to Outside Accra?"
> **Domain expert:** "No. You first make sure the Kumasi **Church** exists with Region 'Outside Accra', then attach the Pastor to it. The Pastor's Region always comes from the Church."
> **Dev:** "And the old Pastors who never got a Church?"
> **Domain expert:** "They count as Accra until someone attaches them properly."

## Flagged ambiguities

- "Area" sounds geographic but is an internal grouping — geography is **Region** (on the Church), never Area.
- The UI says "Campuses" for Churches and "Clergy" for Pastors; code and domain language use **Church** and **Pastor**.

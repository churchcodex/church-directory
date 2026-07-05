# Region lives on the Church; a Pastor's region is derived, never stored

The directory is splitting into Accra and Outside-Accra views. We store `region` (extensible string, currently `"Accra" | "Outside Accra"`) on the Church only. A Pastor's region is always derived from their Church, with one fallback: no Church → Accra. To make derivation reliable, selecting a Church became required when creating a Pastor, and `head_pastor` became optional on Church (otherwise a new region's first church and its head pastor deadlock each other).

## Considered Options

- **Region on Pastor (denormalized):** rejected — two sources of truth; a Pastor could claim "Outside Accra" while attached to an Accra church.
- **Boolean `is_accra`:** rejected — a third region or city-level breakdown (Kumasi vs London; `country` already exists on Pastor) would force a migration.

## Consequences

- Regional pastor queries must join/lookup through Church (or filter by church-id set) rather than filtering a pastor field.
- The ~6 legacy church-less pastors count as Accra until someone attaches them to a church.
- Council/Area stay Accra-only structures: required for Accra pastors, optional for Outside-Accra pastors — validation is conditional on the chosen church's region.

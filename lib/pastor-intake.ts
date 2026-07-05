export interface PastorIntakeError {
  field: string;
  message: string;
}

export interface PastorIntakeResult {
  payload: Record<string, any>;
  errors: PastorIntakeError[];
}

export interface PastorAllowedOptions {
  councils?: string[];
  areas?: string[];
  pastorFunctions?: string[];
  ministryGroups?: string[];
}

export interface PastorIntakeConfig {
  mode: "create" | "update";
  allowed?: PastorAllowedOptions;
  /**
   * Region of the pastor's church. Defaults to "Accra" — a pastor with no
   * church counts as Accra (ADR 0001). Council and Area are Accra-only
   * structures: required for Accra pastors, optional for Outside-Accra ones.
   */
  churchRegion?: string;
}

function toStringArray(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && v.length > 0)
    : typeof value === "string" && value.length > 0
      ? [value]
      : [];
  return Array.from(new Set(raw));
}

const ARRAY_FIELDS = ["clergy_type", "council", "function", "ministry_group"] as const;

export function normalizePastorDraft(
  input: Record<string, any>,
  config: PastorIntakeConfig,
): PastorIntakeResult {
  const errors: PastorIntakeError[] = [];
  const payload: Record<string, any> = { ...input };

  for (const field of ARRAY_FIELDS) {
    if (input[field] !== undefined) {
      payload[field] = toStringArray(input[field]);
    }
  }

  if (input.church === "") {
    payload.church = undefined;
  }

  // Creating a pastor requires selecting their church — the pastor's region is
  // derived from it (ADR 0001). Enforced at intake for new creates only, so
  // legacy church-less pastors remain editable in update mode.
  if (config.mode === "create" && (typeof payload.church !== "string" || payload.church.length === 0)) {
    errors.push({ field: "church", message: "Please select a church" });
  }

  // Collapse occupation === "Other" + customOccupation into a single occupation string.
  if (input.occupation === "Other") {
    const custom = typeof input.customOccupation === "string" ? input.customOccupation.trim() : "";
    if (!custom) {
      errors.push({
        field: "occupation",
        message: "Occupation is 'Other' but no custom occupation was provided",
      });
    } else {
      payload.occupation = custom;
    }
  }
  delete payload.customOccupation;

  // Area 4 keeps ministry_group; every other area clears it. In update mode an
  // absent `area` means "don't touch ministry_group" — only an explicit non-Area-4
  // value triggers the clear.
  if (input.area !== undefined) {
    const isArea4 = payload.area === "HGE Area 4" || payload.area === "Experience Area 4";
    if (!isArea4) {
      payload.ministry_group = [];
    }
  }

  // Relocate Governor from clergy_type → function.
  if (input.clergy_type !== undefined) {
    const clergy = payload.clergy_type as string[];
    if (clergy.includes("Governor")) {
      payload.clergy_type = clergy.filter((v) => v !== "Governor");
      const fn = (payload.function as string[] | undefined) ?? [];
      payload.function = fn.includes("Governor") ? fn : [...fn, "Governor"];
    }
  }

  // council/clergy_type required: always in create; in update only when provided.
  // Council and Area are Accra-only structures — Outside-Accra pastors may omit both.
  const councilAndAreaRequired = (config.churchRegion || "Accra") === "Accra";
  const councilProvided = input.council !== undefined;
  const clergyProvided = input.clergy_type !== undefined;

  if (
    councilAndAreaRequired &&
    (config.mode === "create" || councilProvided) &&
    (!Array.isArray(payload.council) || payload.council.length === 0)
  ) {
    errors.push({ field: "council", message: "Please select at least one council" });
  }
  if (
    councilAndAreaRequired &&
    config.mode === "create" &&
    (typeof payload.area !== "string" || payload.area.length === 0)
  ) {
    errors.push({ field: "area", message: "Please select an area" });
  }
  if (
    (config.mode === "create" || clergyProvided) &&
    (!Array.isArray(payload.clergy_type) || payload.clergy_type.length === 0)
  ) {
    errors.push({ field: "clergy_type", message: "Please select at least one title" });
  }

  if (Array.isArray(payload.clergy_type) && payload.clergy_type.length > 2) {
    errors.push({ field: "clergy_type", message: "A pastor can have a maximum of 2 titles" });
  }

  if (
    Array.isArray(payload.function) &&
    payload.function.includes("Not Applicable") &&
    payload.function.length > 1
  ) {
    errors.push({
      field: "function",
      message: "If 'Not Applicable' is selected, no other functions can be selected",
    });
  }

  const allowed = config.allowed;
  if (allowed) {
    if (allowed.councils && Array.isArray(payload.council)) {
      const invalid = payload.council.filter((c: string) => !allowed.councils!.includes(c));
      if (invalid.length > 0) {
        errors.push({ field: "council", message: `Invalid council(s): ${invalid.join(", ")}` });
      }
    }
    if (allowed.areas && typeof payload.area === "string" && payload.area.length > 0) {
      if (!allowed.areas.includes(payload.area)) {
        errors.push({ field: "area", message: `Invalid area: ${payload.area}` });
      }
    }
    if (allowed.pastorFunctions && Array.isArray(payload.function)) {
      const invalid = payload.function.filter((f: string) => !allowed.pastorFunctions!.includes(f));
      if (invalid.length > 0) {
        errors.push({ field: "function", message: `Invalid function value(s): ${invalid.join(", ")}` });
      }
    }
    if (
      allowed.ministryGroups &&
      Array.isArray(payload.ministry_group) &&
      payload.ministry_group.length > 0
    ) {
      const invalid = payload.ministry_group.filter((g: string) => !allowed.ministryGroups!.includes(g));
      if (invalid.length > 0) {
        errors.push({ field: "ministry_group", message: `Invalid ministry group(s): ${invalid.join(", ")}` });
      }
    }
  }

  return { payload, errors };
}

import { Pastor } from "@/types/entities";

// Fields a client may project via GET /api/pastors?fields=a,b,c. Matches the
// Pastor schema; _id always comes back. Unknown names are dropped, and an
// empty result means "no projection" — a bad param can never widen the query.
export const SELECTABLE_PASTOR_FIELDS = [
  "first_name",
  "middle_name",
  "last_name",
  "date_of_birth",
  "date_of_appointment",
  "profile_image",
  "clergy_type",
  "marital_status",
  "church",
  "gender",
  "council",
  "area",
  "occupation",
  "country",
  "email",
  "contact_number",
  "personal_code",
  "status",
  "function",
  "ministry_group",
] as const;

export function parsePastorFieldsParam(param: string | null): string[] | null {
  if (!param) return null;
  const allowed = new Set<string>(SELECTABLE_PASTOR_FIELDS);
  const fields = param
    .split(",")
    .map((field) => field.trim())
    .filter((field) => allowed.has(field));
  return fields.length > 0 ? Array.from(new Set(fields)) : null;
}

function toStringArray(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && v.length > 0)
    : typeof value === "string" && value.length > 0
      ? [value]
      : [];
  return Array.from(new Set(raw));
}

export function serializePastor(pastor: any): Pastor {
  const rawClergy = toStringArray(pastor.clergy_type);
  const governorInClergy = rawClergy.includes("Governor");
  const clergy_type = rawClergy.filter((v) => v !== "Governor");

  const rawFunction = toStringArray(pastor.function);
  const functionList = governorInClergy && !rawFunction.includes("Governor") ? [...rawFunction, "Governor"] : rawFunction;

  return {
    ...pastor,
    id: pastor._id.toString(),
    church: pastor.church ? pastor.church.toString() : "",
    clergy_type,
    council: toStringArray(pastor.council),
    date_of_birth: pastor.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
    date_of_appointment: pastor.date_of_appointment
      ? new Date(pastor.date_of_appointment).toISOString().split("T")[0]
      : "",
    first_name: pastor.first_name || "",
    middle_name: pastor.middle_name || "",
    last_name: pastor.last_name || "",
    function: functionList,
    ministry_group: toStringArray(pastor.ministry_group),
  };
}

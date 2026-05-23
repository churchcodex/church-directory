import { Pastor } from "@/types/entities";

function toStringArray(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string" && v.length > 0)
    : typeof value === "string" && value.length > 0
      ? [value]
      : [];
  return Array.from(new Set(raw));
}

export function parsePastorInput(body: Record<string, any>): Record<string, any> {
  const { clergy_type, function: functionField, council, ministry_group, church, ...rest } = body;
  const out: Record<string, any> = { ...rest };

  const hasClergy = clergy_type !== undefined;
  const rawClergy = hasClergy ? toStringArray(clergy_type) : [];
  const governorInClergy = rawClergy.includes("Governor");
  if (hasClergy) {
    out.clergy_type = rawClergy.filter((v) => v !== "Governor");
  }

  const hasFunction = functionField !== undefined;
  if (hasFunction || governorInClergy) {
    const rawFunction = hasFunction ? toStringArray(functionField) : [];
    out.function =
      governorInClergy && !rawFunction.includes("Governor") ? [...rawFunction, "Governor"] : rawFunction;
  }

  if (council !== undefined) {
    out.council = toStringArray(council);
  }

  if (ministry_group !== undefined) {
    out.ministry_group = toStringArray(ministry_group);
  }

  if (church !== undefined) {
    out.church = church === "" ? undefined : church;
  }

  return out;
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

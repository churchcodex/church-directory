import { describe, it, expect } from "vitest";
import { normalizePastorDraft } from "./pastor-intake";

describe("normalizePastorDraft (create mode)", () => {
  it("flags missing required fields when input is empty", () => {
    const { errors } = normalizePastorDraft({}, { mode: "create" });

    const fields = errors.map((e) => e.field);
    expect(fields).toContain("council");
    expect(fields).toContain("clergy_type");
    expect(fields).toContain("church");
    expect(fields).toContain("area");
  });

  it("accepts valid minimal input and normalizes scalar arrays-fields to arrays", () => {
    const { payload, errors } = normalizePastorDraft(
      {
        first_name: "John",
        last_name: "Doe",
        clergy_type: "Pastor",
        council: "Philippians",
        area: "Experience Area 2",
        church: "507f1f77bcf86cd799439011",
      },
      { mode: "create" },
    );

    expect(errors).toEqual([]);
    expect(payload.clergy_type).toEqual(["Pastor"]);
    expect(payload.council).toEqual(["Philippians"]);
    expect(payload.first_name).toBe("John");
    expect(payload.last_name).toBe("Doe");
  });

  it("dedupes array values", () => {
    const { payload } = normalizePastorDraft(
      { clergy_type: ["Pastor", "Pastor"], council: ["A", "A", "B"] },
      { mode: "create" },
    );

    expect(payload.clergy_type).toEqual(["Pastor"]);
    expect(payload.council).toEqual(["A", "B"]);
  });

  it("relocates 'Governor' from clergy_type to function", () => {
    const { payload } = normalizePastorDraft(
      { clergy_type: ["Bishop", "Governor"], function: ["Overseer"], council: ["X"] },
      { mode: "create" },
    );

    expect(payload.clergy_type).toEqual(["Bishop"]);
    expect(payload.function).toEqual(["Overseer", "Governor"]);
  });

  it("appends Governor to function only once even if already present", () => {
    const { payload } = normalizePastorDraft(
      { clergy_type: ["Bishop", "Governor"], function: ["Governor"], council: ["X"] },
      { mode: "create" },
    );

    expect(payload.function).toEqual(["Governor"]);
  });

  it("creates function array from Governor when no function provided", () => {
    const { payload } = normalizePastorDraft(
      { clergy_type: ["Governor"], council: ["X"] },
      { mode: "create" },
    );

    expect(payload.clergy_type).toEqual([]);
    expect(payload.function).toEqual(["Governor"]);
  });

  it("rejects clergy_type with more than 2 entries", () => {
    const { errors } = normalizePastorDraft(
      { clergy_type: ["Bishop", "Mother", "Sister"], council: ["X"] },
      { mode: "create" },
    );

    expect(errors.find((e) => e.field === "clergy_type")?.message).toMatch(/maximum of 2/i);
  });

  it("rejects function combining 'Not Applicable' with another value", () => {
    const { errors } = normalizePastorDraft(
      { clergy_type: ["Pastor"], council: ["X"], function: ["Not Applicable", "Overseer"] },
      { mode: "create" },
    );

    expect(errors.find((e) => e.field === "function")?.message).toMatch(/Not Applicable/i);
  });

  it("accepts function ['Not Applicable'] alone", () => {
    const { errors } = normalizePastorDraft(
      { clergy_type: ["Pastor"], council: ["X"], function: ["Not Applicable"] },
      { mode: "create" },
    );

    expect(errors.find((e) => e.field === "function")).toBeUndefined();
  });

  it("expands occupation='Other' + customOccupation to a concrete occupation", () => {
    const { payload, errors } = normalizePastorDraft(
      {
        clergy_type: ["Pastor"],
        council: ["X"],
        occupation: "Other",
        customOccupation: "Phlebotomist",
      },
      { mode: "create" },
    );

    expect(errors.find((e) => e.field === "occupation")).toBeUndefined();
    expect(payload.occupation).toBe("Phlebotomist");
    expect(payload.customOccupation).toBeUndefined();
  });

  it("rejects occupation='Other' when customOccupation is missing or blank", () => {
    const { errors } = normalizePastorDraft(
      {
        clergy_type: ["Pastor"],
        council: ["X"],
        occupation: "Other",
        customOccupation: "   ",
      },
      { mode: "create" },
    );

    expect(errors.find((e) => e.field === "occupation")?.message).toMatch(/Other/i);
  });

  it("leaves occupation untouched when not 'Other'", () => {
    const { payload } = normalizePastorDraft(
      {
        clergy_type: ["Pastor"],
        council: ["X"],
        occupation: "Medical Doctor",
        customOccupation: "ignored",
      },
      { mode: "create" },
    );

    expect(payload.occupation).toBe("Medical Doctor");
    expect(payload.customOccupation).toBeUndefined();
  });

  it("clears ministry_group when area is not Area 4", () => {
    const { payload } = normalizePastorDraft(
      {
        clergy_type: ["Pastor"],
        council: ["X"],
        area: "HGE Area 1",
        ministry_group: ["Spiders", "Doves"],
      },
      { mode: "create" },
    );

    expect(payload.ministry_group).toEqual([]);
  });

  it("preserves ministry_group when area is 'HGE Area 4'", () => {
    const { payload } = normalizePastorDraft(
      {
        clergy_type: ["Pastor"],
        council: ["X"],
        area: "HGE Area 4",
        ministry_group: ["Spiders"],
      },
      { mode: "create" },
    );

    expect(payload.ministry_group).toEqual(["Spiders"]);
  });

  it("collapses church='' to undefined", () => {
    const { payload } = normalizePastorDraft(
      { clergy_type: ["Pastor"], council: ["X"], church: "" },
      { mode: "create" },
    );

    expect(payload.church).toBeUndefined();
  });

  it("preserves a non-empty church string", () => {
    const { payload } = normalizePastorDraft(
      { clergy_type: ["Pastor"], council: ["X"], church: "abc123" },
      { mode: "create" },
    );

    expect(payload.church).toBe("abc123");
  });

  it("preserves ministry_group when area is 'Experience Area 4'", () => {
    const { payload } = normalizePastorDraft(
      {
        clergy_type: ["Pastor"],
        council: ["X"],
        area: "Experience Area 4",
        ministry_group: ["Doves"],
      },
      { mode: "create" },
    );

    expect(payload.ministry_group).toEqual(["Doves"]);
  });
});

describe("normalizePastorDraft (allowed-list validation)", () => {
  it("flags council values not in allowed.councils", () => {
    const { errors } = normalizePastorDraft(
      { clergy_type: ["Pastor"], council: ["Mystery"] },
      { mode: "create", allowed: { councils: ["Philippians", "Galatians"] } },
    );

    expect(errors.find((e) => e.field === "council")?.message).toMatch(/Mystery/);
  });

  it("flags area not in allowed.areas", () => {
    const { errors } = normalizePastorDraft(
      { clergy_type: ["Pastor"], council: ["X"], area: "Atlantis" },
      { mode: "create", allowed: { areas: ["HGE Area 1"], councils: ["X"] } },
    );

    expect(errors.find((e) => e.field === "area")?.message).toMatch(/Atlantis/);
  });

  it("flags function values not in allowed.pastorFunctions", () => {
    const { errors } = normalizePastorDraft(
      { clergy_type: ["Pastor"], council: ["X"], function: ["Captain"] },
      {
        mode: "create",
        allowed: { pastorFunctions: ["Governor", "Overseer", "Not Applicable"], councils: ["X"] },
      },
    );

    expect(errors.find((e) => e.field === "function")?.message).toMatch(/Captain/);
  });

  it("flags ministry_group values not in allowed.ministryGroups (when area is Area 4)", () => {
    const { errors } = normalizePastorDraft(
      {
        clergy_type: ["Pastor"],
        council: ["X"],
        area: "HGE Area 4",
        ministry_group: ["Phantoms"],
      },
      {
        mode: "create",
        allowed: { ministryGroups: ["Spiders", "Doves"], councils: ["X"], areas: ["HGE Area 4"] },
      },
    );

    expect(errors.find((e) => e.field === "ministry_group")?.message).toMatch(/Phantoms/);
  });

  it("does not run allowed-list checks when allowed lists are not supplied", () => {
    const { errors } = normalizePastorDraft(
      { clergy_type: ["Pastor"], council: ["AnythingGoes"], area: "Somewhere" },
      { mode: "create" },
    );

    expect(errors.find((e) => e.field === "council")).toBeUndefined();
    expect(errors.find((e) => e.field === "area")).toBeUndefined();
  });

  it("skips ministry_group allowed-list check when area is not Area 4 (since it gets cleared)", () => {
    const { errors, payload } = normalizePastorDraft(
      {
        clergy_type: ["Pastor"],
        council: ["X"],
        area: "HGE Area 1",
        ministry_group: ["Phantoms"],
      },
      {
        mode: "create",
        allowed: { ministryGroups: ["Spiders"], councils: ["X"], areas: ["HGE Area 1"] },
      },
    );

    expect(errors.find((e) => e.field === "ministry_group")).toBeUndefined();
    expect(payload.ministry_group).toEqual([]);
  });
});

describe("normalizePastorDraft (region rules)", () => {
  it("requires a church on create", () => {
    const { errors } = normalizePastorDraft(
      { clergy_type: ["Pastor"], council: ["X"], area: "HGE Area 1" },
      { mode: "create" },
    );

    expect(errors.find((e) => e.field === "church")?.message).toMatch(/select a church/i);
  });

  it("treats church='' as no church on create", () => {
    const { errors } = normalizePastorDraft(
      { clergy_type: ["Pastor"], council: ["X"], area: "HGE Area 1", church: "" },
      { mode: "create" },
    );

    expect(errors.find((e) => e.field === "church")).toBeDefined();
  });

  it("does not require a church in update mode (legacy church-less pastors stay editable)", () => {
    const { errors } = normalizePastorDraft({ first_name: "Updated" }, { mode: "update" });

    expect(errors).toEqual([]);
  });

  it("still requires council and area on create for an Accra church", () => {
    const { errors } = normalizePastorDraft(
      { clergy_type: ["Pastor"], church: "abc123" },
      { mode: "create", churchRegion: "Accra" },
    );

    const fields = errors.map((e) => e.field);
    expect(fields).toContain("council");
    expect(fields).toContain("area");
  });

  it("makes council and area optional on create for an Outside Accra church", () => {
    const { errors } = normalizePastorDraft(
      { clergy_type: ["Pastor"], church: "abc123", council: [] },
      { mode: "create", churchRegion: "Outside Accra" },
    );

    expect(errors).toEqual([]);
  });

  it("allows clearing council in update mode for an Outside Accra church", () => {
    const { errors } = normalizePastorDraft(
      { council: [] },
      { mode: "update", churchRegion: "Outside Accra" },
    );

    expect(errors).toEqual([]);
  });

  it("still rejects an explicit empty council in update mode for an Accra church", () => {
    const { errors } = normalizePastorDraft(
      { council: [] },
      { mode: "update", churchRegion: "Accra" },
    );

    expect(errors.find((e) => e.field === "council")).toBeDefined();
  });

  it("does not require area in update mode even for Accra (legacy pastors may lack one)", () => {
    const { errors } = normalizePastorDraft(
      { first_name: "Updated" },
      { mode: "update", churchRegion: "Accra" },
    );

    expect(errors).toEqual([]);
  });
});

describe("normalizePastorDraft (update mode)", () => {
  it("does not flag missing council/clergy_type when those fields are absent", () => {
    const { errors } = normalizePastorDraft({ first_name: "Updated" }, { mode: "update" });

    expect(errors).toEqual([]);
  });

  it("rejects an explicit empty council in update mode", () => {
    const { errors } = normalizePastorDraft({ council: [] }, { mode: "update" });

    expect(errors.find((e) => e.field === "council")?.message).toMatch(/at least one council/i);
  });

  it("rejects an explicit empty clergy_type in update mode", () => {
    const { errors } = normalizePastorDraft({ clergy_type: [] }, { mode: "update" });

    expect(errors.find((e) => e.field === "clergy_type")?.message).toMatch(/at least one title/i);
  });

  it("still applies Governor relocation in update mode", () => {
    const { payload } = normalizePastorDraft(
      { clergy_type: ["Governor", "Bishop"] },
      { mode: "update" },
    );

    expect(payload.clergy_type).toEqual(["Bishop"]);
    expect(payload.function).toEqual(["Governor"]);
  });

  it("does not touch ministry_group when area is absent in update mode", () => {
    const { payload } = normalizePastorDraft(
      { ministry_group: ["Spiders"] },
      { mode: "update" },
    );

    expect(payload.ministry_group).toEqual(["Spiders"]);
  });
});

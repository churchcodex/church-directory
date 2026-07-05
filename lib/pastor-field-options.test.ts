import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn(),
}));

const findOneMock = vi.fn();

vi.mock("@/models/PastorFieldOptions", () => ({
  default: {
    findOne: (...args: any[]) => findOneMock(...args),
  },
}));

import { getFieldOptions } from "./pastor-field-options";

describe("getFieldOptions", () => {
  beforeEach(() => {
    findOneMock.mockReset();
    findOneMock.mockResolvedValue(null);
  });

  it("returns seeded defaults marked isDefault:true when no DB row exists", async () => {
    const result = await getFieldOptions();

    expect(result.maritalStatuses).toBeDefined();
    expect(result.maritalStatuses.fieldName).toBe("maritalStatuses");
    expect(result.maritalStatuses.isDefault).toBe(true);
    expect(result.maritalStatuses.options).toEqual(["Single", "Married", "Divorced", "Widowed"]);
    expect(result.maritalStatuses.updatedAt).toBeUndefined();
  });

  it("includes all 9 field names in the response", async () => {
    const result = await getFieldOptions();

    expect(Object.keys(result).sort()).toEqual(
      [
        "areas",
        "clergyTypes",
        "councils",
        "genders",
        "maritalStatuses",
        "ministryGroups",
        "occupations",
        "pastorFunctions",
        "statuses",
      ].sort(),
    );
  });

  it("strips 'Governor' from clergyTypes options coming from the DB", async () => {
    findOneMock.mockImplementation(async ({ fieldName }: { fieldName: string }) => {
      if (fieldName === "clergyTypes") {
        return {
          fieldName: "clergyTypes",
          options: ["Bishop", "Governor", "Pastor"],
          updatedAt: new Date(),
        };
      }
      return null;
    });

    const result = await getFieldOptions();

    expect(result.clergyTypes.options).toEqual(["Bishop", "Pastor"]);
    expect(result.clergyTypes.options).not.toContain("Governor");
  });

  it("strips 'Governor' from clergyTypes even when present in defaults", async () => {
    const result = await getFieldOptions();

    expect(result.clergyTypes.options).not.toContain("Governor");
  });

  it("returns DB-stored options marked isDefault:false with updatedAt when a row exists", async () => {
    const customUpdatedAt = new Date("2026-04-01T12:00:00.000Z");
    findOneMock.mockImplementation(async ({ fieldName }: { fieldName: string }) => {
      if (fieldName === "maritalStatuses") {
        return {
          fieldName: "maritalStatuses",
          options: ["Single", "Married"],
          updatedAt: customUpdatedAt,
        };
      }
      return null;
    });

    const result = await getFieldOptions();

    expect(result.maritalStatuses.options).toEqual(["Single", "Married"]);
    expect(result.maritalStatuses.isDefault).toBe(false);
    expect(result.maritalStatuses.updatedAt).toEqual(customUpdatedAt);
  });
});

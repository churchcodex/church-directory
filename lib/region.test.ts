import { describe, it, expect } from "vitest";
import {
  ALL_REGIONS,
  buildRegionByChurchId,
  churchRegion,
  filterChurchesByRegion,
  filterPastorsByRegion,
  matchesRegionFilter,
  pastorRegion,
} from "./region";

const accraChurch = { id: "c1", region: "Accra" };
const kumasiChurch = { id: "c2", region: "Outside Accra" };
const legacyChurch = { id: "c3", region: "" };

describe("churchRegion", () => {
  it("returns the stored region", () => {
    expect(churchRegion(kumasiChurch)).toBe("Outside Accra");
  });

  it("defaults pre-region-split churches to Accra", () => {
    expect(churchRegion(legacyChurch)).toBe("Accra");
  });
});

describe("pastorRegion", () => {
  const regionByChurchId = buildRegionByChurchId([accraChurch, kumasiChurch, legacyChurch]);

  it("derives the region from the pastor's church", () => {
    expect(pastorRegion({ church: "c2" }, regionByChurchId)).toBe("Outside Accra");
  });

  it("counts church-less pastors as Accra (ADR 0001)", () => {
    expect(pastorRegion({ church: "" }, regionByChurchId)).toBe("Accra");
    expect(pastorRegion({ church: undefined }, regionByChurchId)).toBe("Accra");
  });

  it("counts pastors of an unknown church as Accra", () => {
    expect(pastorRegion({ church: "missing" }, regionByChurchId)).toBe("Accra");
  });
});

describe("matchesRegionFilter", () => {
  it("matches everything when the filter is All", () => {
    expect(matchesRegionFilter("Accra", ALL_REGIONS)).toBe(true);
    expect(matchesRegionFilter("Outside Accra", ALL_REGIONS)).toBe(true);
  });

  it("matches only the selected region otherwise", () => {
    expect(matchesRegionFilter("Accra", "Accra")).toBe(true);
    expect(matchesRegionFilter("Outside Accra", "Accra")).toBe(false);
  });
});

describe("filterChurchesByRegion", () => {
  const churches = [accraChurch, kumasiChurch, legacyChurch];

  it("keeps only churches in the selected region, legacy counting as Accra", () => {
    expect(filterChurchesByRegion(churches, "Accra").map((c) => c.id)).toEqual(["c1", "c3"]);
    expect(filterChurchesByRegion(churches, "Outside Accra").map((c) => c.id)).toEqual(["c2"]);
  });

  it("returns everything for All", () => {
    expect(filterChurchesByRegion(churches, ALL_REGIONS)).toHaveLength(3);
  });
});

describe("filterPastorsByRegion", () => {
  const regionByChurchId = buildRegionByChurchId([accraChurch, kumasiChurch]);
  const pastors = [
    { id: "p1", church: "c1" },
    { id: "p2", church: "c2" },
    { id: "p3", church: "" },
  ];

  it("filters pastors by their derived region", () => {
    expect(filterPastorsByRegion(pastors, "Outside Accra", regionByChurchId).map((p) => p.id)).toEqual(["p2"]);
  });

  it("puts church-less pastors under Accra", () => {
    expect(filterPastorsByRegion(pastors, "Accra", regionByChurchId).map((p) => p.id)).toEqual(["p1", "p3"]);
  });

  it("returns everything for All", () => {
    expect(filterPastorsByRegion(pastors, ALL_REGIONS, regionByChurchId)).toHaveLength(3);
  });
});

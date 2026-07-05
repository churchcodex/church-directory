import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import Church from "./Church";

describe("Church model region validation", () => {
  const baseDoc = () => ({
    name: "Test Campus",
    location: "Somewhere",
    head_pastor: new mongoose.Types.ObjectId(),
    members: 0,
    income: 0,
  });

  it("defaults region to Accra when not provided", () => {
    const church = new Church(baseDoc());
    expect(church.region).toBe("Accra");
  });

  it("accepts Outside Accra", async () => {
    const church = new Church({ ...baseDoc(), region: "Outside Accra" });
    await expect(church.validate()).resolves.toBeUndefined();
  });

  it("rejects a region outside the allowed set", async () => {
    const church = new Church({ ...baseDoc(), region: "Kumasi" });
    await expect(church.validate()).rejects.toThrow(/Region must be one of/);
  });
});

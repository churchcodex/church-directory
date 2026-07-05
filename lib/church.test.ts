import { describe, it, expect } from "vitest";
import { serializeChurch } from "./church";

describe("serializeChurch", () => {
  const baseDoc = () => ({
    _id: { toString: () => "507f1f77bcf86cd799439011" },
    name: "First Love Center",
    location: "Trinity Theological Seminary",
    region: "Accra",
    head_pastor: { toString: () => "507f191e810c19729de860ea" },
    members: 100,
    income: 5000,
    images: ["a.jpg"],
  });

  it("turns the Mongo _id ObjectId into a string id", () => {
    const result = serializeChurch(baseDoc());
    expect(result.id).toBe("507f1f77bcf86cd799439011");
  });

  it("turns the head_pastor ObjectId into a string", () => {
    const result = serializeChurch(baseDoc());
    expect(result.head_pastor).toBe("507f191e810c19729de860ea");
  });

  it("returns an empty string when head_pastor is missing", () => {
    const doc = baseDoc();
    delete (doc as any).head_pastor;
    const result = serializeChurch(doc);
    expect(result.head_pastor).toBe("");
  });

  it("keeps the stored region", () => {
    const result = serializeChurch({ ...baseDoc(), region: "Outside Accra" });
    expect(result.region).toBe("Outside Accra");
  });

  it("defaults region to Accra for pre-region-split churches", () => {
    const doc = baseDoc();
    delete (doc as any).region;
    const result = serializeChurch(doc);
    expect(result.region).toBe("Accra");
  });

  it("defaults images to an empty array", () => {
    const doc = baseDoc();
    delete (doc as any).images;
    const result = serializeChurch(doc);
    expect(result.images).toEqual([]);
  });
});

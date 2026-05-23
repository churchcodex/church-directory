import { describe, it, expect } from "vitest";
import { serializePastor, parsePastorInput } from "./pastor";

describe("serializePastor", () => {
  const baseDoc = () => ({
    _id: { toString: () => "507f1f77bcf86cd799439011" },
    first_name: "John",
    last_name: "Doe",
    clergy_type: ["Bishop"],
    council: ["Council A"],
    area: "Area 1",
    function: [],
    ministry_group: [],
  });

  it("turns the Mongo _id ObjectId into a string id", () => {
    const result = serializePastor(baseDoc());
    expect(result.id).toBe("507f1f77bcf86cd799439011");
  });

  it("wraps a scalar clergy_type into an array", () => {
    const result = serializePastor({ ...baseDoc(), clergy_type: "Bishop" });
    expect(result.clergy_type).toEqual(["Bishop"]);
  });

  it("returns an empty array when clergy_type is missing", () => {
    const doc = baseDoc();
    delete (doc as any).clergy_type;
    const result = serializePastor(doc);
    expect(result.clergy_type).toEqual([]);
  });

  it("normalizes council, function, and ministry_group from scalar to array", () => {
    const result = serializePastor({
      ...baseDoc(),
      council: "Council A",
      function: "Overseer",
      ministry_group: "Spiders",
    });
    expect(result.council).toEqual(["Council A"]);
    expect(result.function).toEqual(["Overseer"]);
    expect(result.ministry_group).toEqual(["Spiders"]);
  });

  it("defaults missing council, function, and ministry_group to empty arrays", () => {
    const doc = baseDoc();
    delete (doc as any).council;
    delete (doc as any).function;
    delete (doc as any).ministry_group;
    const result = serializePastor(doc);
    expect(result.council).toEqual([]);
    expect(result.function).toEqual([]);
    expect(result.ministry_group).toEqual([]);
  });

  it("relocates Governor from clergy_type to function", () => {
    const result = serializePastor({
      ...baseDoc(),
      clergy_type: ["Bishop", "Governor"],
      function: ["Overseer"],
    });
    expect(result.clergy_type).toEqual(["Bishop"]);
    expect(result.function).toEqual(["Overseer", "Governor"]);
  });

  it("does not duplicate Governor in function if it is already there", () => {
    const result = serializePastor({
      ...baseDoc(),
      clergy_type: ["Governor"],
      function: ["Governor"],
    });
    expect(result.clergy_type).toEqual([]);
    expect(result.function).toEqual(["Governor"]);
  });

  it("formats dates as YYYY-MM-DD strings", () => {
    const result = serializePastor({
      ...baseDoc(),
      date_of_birth: new Date("1990-05-15T12:00:00.000Z"),
      date_of_appointment: new Date("2020-01-01T00:00:00.000Z"),
    });
    expect(result.date_of_birth).toBe("1990-05-15");
    expect(result.date_of_appointment).toBe("2020-01-01");
  });

  it("returns empty strings when dates are missing", () => {
    const doc = baseDoc();
    delete (doc as any).date_of_birth;
    delete (doc as any).date_of_appointment;
    const result = serializePastor(doc);
    expect(result.date_of_birth).toBe("");
    expect(result.date_of_appointment).toBe("");
  });

  it("converts church ObjectId to string and returns empty string when missing", () => {
    const withChurch = serializePastor({
      ...baseDoc(),
      church: { toString: () => "65a1f2b3c4d5e6f7a8b9c0d1" },
    });
    expect(withChurch.church).toBe("65a1f2b3c4d5e6f7a8b9c0d1");

    const noChurch = serializePastor(baseDoc());
    expect(noChurch.church).toBe("");
  });

  it("dedups duplicate values within list fields", () => {
    const result = serializePastor({
      ...baseDoc(),
      clergy_type: ["Bishop", "Bishop"],
      council: ["Council A", "Council A"],
      function: ["Overseer", "Overseer"],
      ministry_group: ["Spiders", "Spiders"],
    });
    expect(result.clergy_type).toEqual(["Bishop"]);
    expect(result.council).toEqual(["Council A"]);
    expect(result.function).toEqual(["Overseer"]);
    expect(result.ministry_group).toEqual(["Spiders"]);
  });
});

describe("parsePastorInput", () => {
  it("coerces a scalar function value into a deduped array", () => {
    const result = parsePastorInput({ function: "Overseer" });
    expect(result.function).toEqual(["Overseer"]);
  });

  it("coerces and dedups clergy_type, council, function, and ministry_group", () => {
    const result = parsePastorInput({
      clergy_type: ["Bishop", "Bishop"],
      council: "Council A",
      function: ["Overseer", "Overseer"],
      ministry_group: ["Spiders", "Spiders"],
    });
    expect(result.clergy_type).toEqual(["Bishop"]);
    expect(result.council).toEqual(["Council A"]);
    expect(result.function).toEqual(["Overseer"]);
    expect(result.ministry_group).toEqual(["Spiders"]);
  });

  it("relocates Governor from clergy_type to function on write", () => {
    const result = parsePastorInput({
      clergy_type: ["Bishop", "Governor"],
      function: ["Overseer"],
    });
    expect(result.clergy_type).toEqual(["Bishop"]);
    expect(result.function).toEqual(["Overseer", "Governor"]);
  });

  it("relocates Governor even when function is not in the payload", () => {
    const result = parsePastorInput({ clergy_type: ["Governor"] });
    expect(result.clergy_type).toEqual([]);
    expect(result.function).toEqual(["Governor"]);
  });

  it("turns an empty-string church into undefined", () => {
    const result = parsePastorInput({ church: "" });
    expect(result.church).toBeUndefined();
    expect("church" in result).toBe(true);
  });

  it("preserves a non-empty church id", () => {
    const result = parsePastorInput({ church: "65a1f2b3c4d5e6f7a8b9c0d1" });
    expect(result.church).toBe("65a1f2b3c4d5e6f7a8b9c0d1");
  });

  it("omits list-field keys that were not present in the input (PUT partial)", () => {
    const result = parsePastorInput({ first_name: "Jane" });
    expect("clergy_type" in result).toBe(false);
    expect("function" in result).toBe(false);
    expect("council" in result).toBe(false);
    expect("ministry_group" in result).toBe(false);
  });

  it("passes scalar fields through unchanged", () => {
    const result = parsePastorInput({
      first_name: "Jane",
      last_name: "Doe",
      area: "Area 4",
      email: "jane@example.com",
    });
    expect(result.first_name).toBe("Jane");
    expect(result.last_name).toBe("Doe");
    expect(result.area).toBe("Area 4");
    expect(result.email).toBe("jane@example.com");
  });
});

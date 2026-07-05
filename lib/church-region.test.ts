import { describe, it, expect } from "vitest";
import { isAccraPastor } from "./church-region";

describe("isAccraPastor", () => {
  const nonAccraChurchIds = new Set(["kumasi-church"]);

  it("counts a pastor of an Accra church as Accra", () => {
    expect(isAccraPastor({ church: "accra-church" }, nonAccraChurchIds)).toBe(true);
  });

  it("excludes a pastor of a non-Accra church", () => {
    expect(isAccraPastor({ church: "kumasi-church" }, nonAccraChurchIds)).toBe(false);
  });

  it("counts church-less pastors as Accra (ADR 0001)", () => {
    expect(isAccraPastor({ church: null }, nonAccraChurchIds)).toBe(true);
    expect(isAccraPastor({ church: undefined }, nonAccraChurchIds)).toBe(true);
    expect(isAccraPastor({}, nonAccraChurchIds)).toBe(true);
  });

  it("matches ObjectId-like values via string coercion", () => {
    const idLike = { toString: () => "kumasi-church" };
    expect(isAccraPastor({ church: idLike }, nonAccraChurchIds)).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import {
  MAX_PART_BYTES,
  buildMissingCsv,
  isCloudinaryPhoto,
  packIntoParts,
  partFilename,
  photoExtension,
  planPhotoArchive,
  primaryTitle,
  sanitizeFilename,
  titleFolder,
  transformedPhotoUrl,
} from "./pastor-photo-archive";

const cloudinaryPhoto = "https://res.cloudinary.com/demo/image/upload/v1712345678/church-directory/abc123.jpg";
const s3Photo = "https://fl-admin-apps.s3.eu-west-2.amazonaws.com/pastors/joe.jpg";
const drivePhoto = "https://drive.google.com/uc?export=view&id=abc";

function pastor(overrides: Partial<Parameters<typeof planPhotoArchive>[0][number]> = {}) {
  return {
    id: "p1",
    first_name: "Kwame",
    last_name: "Mensah",
    clergy_type: ["Pastor"],
    profile_image: cloudinaryPhoto,
    ...overrides,
  };
}

describe("primaryTitle", () => {
  it("picks the most senior of two titles regardless of stored order", () => {
    expect(primaryTitle(["Reverend", "Bishop"])).toBe("Bishop");
    expect(primaryTitle(["Bishop", "Reverend"])).toBe("Bishop");
    expect(primaryTitle(["Sister", "Mother"])).toBe("Mother");
  });

  it("treats Not Applicable as having no title", () => {
    expect(primaryTitle(["Not Applicable"])).toBeNull();
  });

  it("ignores Not Applicable when a real title is also present", () => {
    expect(primaryTitle(["Not Applicable", "Reverend"])).toBe("Reverend");
  });

  it("returns null for missing or empty titles", () => {
    expect(primaryTitle([])).toBeNull();
    expect(primaryTitle(undefined)).toBeNull();
  });

  it("keeps an admin-added title that is outside the known ranking", () => {
    expect(primaryTitle(["Archbishop"])).toBe("Archbishop");
  });

  it("prefers a known title over an unranked one", () => {
    expect(primaryTitle(["Archbishop", "Bishop"])).toBe("Bishop");
  });
});

describe("titleFolder", () => {
  it("pluralises the known titles", () => {
    expect(titleFolder("Bishop")).toBe("Bishops");
    expect(titleFolder("Reverend")).toBe("Reverends");
    expect(titleFolder("Mother")).toBe("Mothers");
  });

  it("files the untitled under Unspecified", () => {
    expect(titleFolder(null)).toBe("Unspecified");
  });

  it("falls back to the raw title rather than guessing a plural", () => {
    expect(titleFolder("Bishop Emeritus")).toBe("Bishop Emeritus");
  });
});

describe("sanitizeFilename", () => {
  it("replaces spaces with underscores", () => {
    expect(sanitizeFilename("Kwame Kofi Mensah")).toBe("Kwame_Kofi_Mensah");
  });

  it("strips characters that would nest folders or break Windows", () => {
    expect(sanitizeFilename("Ama/Owusu")).toBe("AmaOwusu");
    expect(sanitizeFilename('Yaw:Boateng?*')).toBe("YawBoateng");
  });

  it("keeps apostrophes and accents", () => {
    expect(sanitizeFilename("Kojo O'Brien")).toBe("Kojo_O'Brien");
    expect(sanitizeFilename("José Darko")).toBe("José_Darko");
  });

  it("drops trailing dots that Windows rejects", () => {
    expect(sanitizeFilename("Kwame Jr.")).toBe("Kwame_Jr");
  });

  it("never returns an empty name", () => {
    expect(sanitizeFilename("///")).toBe("Pastor");
  });
});

describe("isCloudinaryPhoto / transformedPhotoUrl", () => {
  it("recognises Cloudinary uploads", () => {
    expect(isCloudinaryPhoto(cloudinaryPhoto)).toBe(true);
    expect(isCloudinaryPhoto(s3Photo)).toBe(false);
    expect(isCloudinaryPhoto(drivePhoto)).toBe(false);
  });

  it("injects the downscale transform into Cloudinary URLs", () => {
    expect(transformedPhotoUrl(cloudinaryPhoto)).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_2000,c_limit,q_90,f_jpg/v1712345678/church-directory/abc123.jpg",
    );
  });

  it("limits rather than scales, so small photos are never upscaled past their original", () => {
    // c_scale (Cloudinary's default) would return a *larger* file than the original
    // for any photo narrower than 2000px.
    expect(transformedPhotoUrl(cloudinaryPhoto)).toContain("c_limit");
  });

  it("leaves legacy URLs untouched — they have no transformation API", () => {
    expect(transformedPhotoUrl(s3Photo)).toBe(s3Photo);
    expect(transformedPhotoUrl(drivePhoto)).toBe(drivePhoto);
  });
});

describe("photoExtension", () => {
  it("is always .jpg for Cloudinary photos because f_jpg re-encodes them", () => {
    expect(photoExtension(cloudinaryPhoto, false)).toBe(".jpg");
  });

  it("keeps the legacy photo's own extension", () => {
    expect(photoExtension("https://example.com/pastors/joe.PNG", true)).toBe(".png");
  });

  it("falls back to .jpg for extensionless legacy URLs", () => {
    expect(photoExtension(drivePhoto, true)).toBe(".jpg");
  });
});

describe("planPhotoArchive", () => {
  it("files pastors under their Primary Title, named by display name", () => {
    const { entries } = planPhotoArchive([
      pastor({ id: "p1", clergy_type: ["Reverend", "Bishop"] }),
      pastor({ id: "p2", first_name: "Ama", last_name: "Owusu", clergy_type: ["Reverend"] }),
    ]);

    expect(entries.map((e) => e.path)).toEqual(["Bishops/Kwame_Mensah.jpg", "Reverends/Ama_Owusu.jpg"]);
  });

  it("includes the middle name when there is one", () => {
    const { entries } = planPhotoArchive([pastor({ middle_name: "Kofi" })]);
    expect(entries[0].path).toBe("Pastors/Kwame_Kofi_Mensah.jpg");
  });

  it("reports pastors with no photo instead of dropping them silently", () => {
    const { entries, missing } = planPhotoArchive([
      pastor({ id: "p1" }),
      pastor({ id: "p2", first_name: "Yaw", last_name: "Boateng", personal_code: "G-0091", profile_image: undefined }),
    ]);

    expect(entries).toHaveLength(1);
    expect(missing).toEqual([{ name: "Yaw Boateng", code: "G-0091", title: "Pastor", reason: "No photo on record" }]);
  });

  it("appends personal_code only to names that collide", () => {
    const { entries } = planPhotoArchive([
      pastor({ id: "p1", personal_code: "G-0042", clergy_type: ["Bishop"] }),
      pastor({ id: "p2", personal_code: "G-0117", clergy_type: ["Bishop"] }),
      pastor({ id: "p3", first_name: "Ama", last_name: "Owusu", personal_code: "G-0088", clergy_type: ["Bishop"] }),
    ]);

    expect(entries.map((e) => e.path)).toEqual([
      "Bishops/Kwame_Mensah_G-0042.jpg",
      "Bishops/Kwame_Mensah_G-0117.jpg",
      "Bishops/Ama_Owusu.jpg",
    ]);
  });

  it("does not treat same names in different folders as colliding", () => {
    const { entries } = planPhotoArchive([
      pastor({ id: "p1", personal_code: "G-0042", clergy_type: ["Bishop"] }),
      pastor({ id: "p2", personal_code: "G-0117", clergy_type: ["Reverend"] }),
    ]);

    expect(entries.map((e) => e.path)).toEqual(["Bishops/Kwame_Mensah.jpg", "Reverends/Kwame_Mensah.jpg"]);
  });

  it("falls back to a numeric suffix when colliding pastors have no code", () => {
    const { entries } = planPhotoArchive([
      pastor({ id: "p1", personal_code: undefined, clergy_type: ["Bishop"] }),
      pastor({ id: "p2", personal_code: undefined, clergy_type: ["Bishop"] }),
    ]);

    expect(entries.map((e) => e.path)).toEqual(["Bishops/Kwame_Mensah_(1).jpg", "Bishops/Kwame_Mensah_(2).jpg"]);
  });

  it("routes legacy photos through the proxy and Cloudinary photos direct", () => {
    const { entries } = planPhotoArchive([
      pastor({ id: "p1" }),
      pastor({ id: "p2", first_name: "Ama", last_name: "Owusu", profile_image: s3Photo }),
    ]);

    expect(entries[0].proxied).toBe(false);
    expect(entries[0].url).toContain("w_2000,c_limit,q_90,f_jpg");
    expect(entries[1].proxied).toBe(true);
    expect(entries[1].url).toBe("/api/pastors/photo/p2");
  });

  it("files untitled pastors under Unspecified", () => {
    const { entries } = planPhotoArchive([pastor({ clergy_type: ["Not Applicable"] })]);
    expect(entries[0].path).toBe("Unspecified/Kwame_Mensah.jpg");
  });
});

describe("packIntoParts", () => {
  const sized = (bytes: number, i: number) => ({
    pastorId: `p${i}`,
    path: `Pastors/p${i}.jpg`,
    url: "u",
    proxied: false,
    bytes,
  });

  it("keeps everything in one part when it fits", () => {
    const entries = [sized(100, 1), sized(100, 2)];
    expect(packIntoParts(entries, 1000)).toHaveLength(1);
  });

  it("starts a new part when the cap would be exceeded", () => {
    const entries = [sized(600, 1), sized(600, 2), sized(600, 3)];
    const parts = packIntoParts(entries, 1000);
    expect(parts.map((p) => p.length)).toEqual([1, 1, 1]);
  });

  it("packs greedily up to the cap", () => {
    const entries = [sized(400, 1), sized(400, 2), sized(400, 3)];
    const parts = packIntoParts(entries, 1000);
    expect(parts.map((p) => p.length)).toEqual([2, 1]);
  });

  it("gives an oversized photo its own part rather than dropping it", () => {
    const entries = [sized(5000, 1), sized(100, 2)];
    const parts = packIntoParts(entries, 1000);
    expect(parts.map((p) => p.length)).toEqual([1, 1]);
  });

  it("assumes a size for photos whose length could not be read", () => {
    const parts = packIntoParts([sized(0, 1)], MAX_PART_BYTES);
    expect(parts).toHaveLength(1);
  });

  it("returns no parts for no entries", () => {
    expect(packIntoParts([], 1000)).toEqual([]);
  });
});

describe("partFilename", () => {
  it("omits the part suffix for a single-part archive", () => {
    expect(partFilename("2026-07-15", 1, 1)).toBe("pastor_photos_2026-07-15.zip");
  });

  it("numbers multi-part archives", () => {
    expect(partFilename("2026-07-15", 2, 8)).toBe("pastor_photos_2026-07-15_part-2-of-8.zip");
  });
});

describe("buildMissingCsv", () => {
  it("writes a header even with no rows", () => {
    expect(buildMissingCsv([])).toBe("Name,Code,Title,Reason");
  });

  it("quotes fields and escapes embedded quotes", () => {
    const csv = buildMissingCsv([
      { name: 'Yaw "YB" Boateng', code: "G-0091", title: "Pastor", reason: "No photo on record" },
    ]);
    expect(csv.split("\r\n")[1]).toBe('"Yaw ""YB"" Boateng","G-0091","Pastor","No photo on record"');
  });
});

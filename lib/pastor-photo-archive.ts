import { Pastor } from "@/types/entities";
import { buildPastorDisplayName } from "@/lib/pastor";

// Photo archive: pastors' photos zipped by Primary Title, named by pastor (ADR 0002).

// Title seniority, most senior first. A pastor holds one or two titles; the more
// senior one decides their folder, so every pastor is filed exactly once.
export const TITLE_SENIORITY = ["Bishop", "Reverend", "Mother", "Sister", "Pastor"] as const;

// "Not Applicable" means "no title", not a title named that.
const NO_TITLE = "Not Applicable";

// Folder names are plural. Titles are admin-editable via PastorFieldOptions, so an
// unknown title falls back to its own name rather than a guessed plural.
const TITLE_FOLDERS: Record<string, string> = {
  Bishop: "Bishops",
  Reverend: "Reverends",
  Mother: "Mothers",
  Sister: "Sisters",
  Pastor: "Pastors",
};

export const UNSPECIFIED_FOLDER = "Unspecified";

const CLOUDINARY_HOST_PREFIX = "https://res.cloudinary.com/";
const UPLOAD_SEGMENT = "/image/upload/";

// Print-safe: 2000px covers a full A5 page at 300 DPI.
//   c_limit — shrink only. Cloudinary's default (c_scale) upscales anything
//     narrower than 2000px, producing a file larger than the original for no
//     added detail.
//   f_jpg  — explicit. The display loader's f_auto serves WebP/AVIF, which would
//     put the wrong bytes inside .jpg files.
export const PHOTO_TRANSFORM = "w_2000,c_limit,q_90,f_jpg";

// client-zip buffers a part before it can be saved, so parts are capped for
// browser memory, not bandwidth.
export const MAX_PART_BYTES = 400 * 1024 * 1024;

// Photos whose size we can't read before downloading still have to be packed.
const ASSUMED_PHOTO_BYTES = 600 * 1024;

export type MissingReason = "No photo on record" | string;

export interface PhotoEntry {
  pastorId: string;
  /** Path within the zip, e.g. "Bishops/Kwame_Mensah.jpg". */
  path: string;
  /** Where to fetch the bytes: Cloudinary direct, or our proxy for legacy hosts. */
  url: string;
  /** Legacy photos go through the proxy and arrive un-downscaled. */
  proxied: boolean;
}

export interface MissingRow {
  name: string;
  code: string;
  title: string;
  reason: MissingReason;
}

/**
 * The most senior of a pastor's titles, or null when they have none. Array order
 * is whatever order the admin ticked the boxes in, so it is never trusted.
 */
export function primaryTitle(clergyType: string[] | undefined): string | null {
  if (!clergyType || clergyType.length === 0) return null;
  const held = new Set(clergyType.filter((title) => title && title !== NO_TITLE));
  if (held.size === 0) return null;

  for (const title of TITLE_SENIORITY) {
    if (held.has(title)) return title;
  }

  // An admin-added title outside the known ranking still beats having none.
  return clergyType.find((title) => held.has(title)) ?? null;
}

export function titleFolder(title: string | null): string {
  if (!title) return UNSPECIFIED_FOLDER;
  return TITLE_FOLDERS[title] || title;
}

/**
 * Make a name safe as a zip entry. A "/" would otherwise silently nest folders,
 * and Windows rejects <>:"/\|?* as well as trailing dots and spaces.
 */
export function sanitizeFilename(name: string): string {
  const cleaned = name
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/[\x00-\x1f]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/\.+$/, "");
  return cleaned || "Pastor";
}

/** ".jpg" for anything Cloudinary re-encodes; legacy photos keep their own extension. */
export function photoExtension(url: string, proxied: boolean): string {
  if (!proxied) return ".jpg";
  const path = url.split("?")[0];
  const match = path.match(/\.([a-zA-Z0-9]{2,5})$/);
  return match ? `.${match[1].toLowerCase()}` : ".jpg";
}

export function isCloudinaryPhoto(url: string): boolean {
  return url.startsWith(CLOUDINARY_HOST_PREFIX) && url.includes(UPLOAD_SEGMENT);
}

/**
 * Ask Cloudinary for a downscaled copy. Originals are left untouched; this only
 * affects delivery. Non-Cloudinary URLs have no transformation API and are
 * returned unchanged (ADR 0002).
 */
export function transformedPhotoUrl(url: string): string {
  if (!isCloudinaryPhoto(url)) return url;
  return url.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}${PHOTO_TRANSFORM}/`);
}

export function proxyPhotoUrl(pastorId: string): string {
  return `/api/pastors/photo/${pastorId}`;
}

export function pastorPhotoName(pastor: Pick<Pastor, "first_name" | "middle_name" | "last_name">): string {
  return sanitizeFilename(buildPastorDisplayName(pastor.first_name, pastor.middle_name, pastor.last_name));
}

type ArchivePastor = Pick<
  Pastor,
  "id" | "first_name" | "middle_name" | "last_name" | "clergy_type" | "personal_code" | "profile_image"
>;

/**
 * Plan the archive: one entry per pastor with a photo, plus a row per pastor
 * without one.
 *
 * Two pastors may legitimately share a full name (the duplicate check is first +
 * last + date of birth), so names that collide within a folder get their
 * personal_code appended. Only the colliding pastors pay that cost; everyone else
 * keeps a clean name. Codes are sparse, so a collision between pastors lacking one
 * falls back to a numeric suffix.
 */
export function planPhotoArchive(pastors: ArchivePastor[]): { entries: PhotoEntry[]; missing: MissingRow[] } {
  const entries: PhotoEntry[] = [];
  const missing: MissingRow[] = [];

  const withPhoto: Array<{ pastor: ArchivePastor; folder: string; name: string }> = [];

  for (const pastor of pastors) {
    const title = primaryTitle(pastor.clergy_type);
    if (!pastor.profile_image) {
      missing.push({
        name: buildPastorDisplayName(pastor.first_name, pastor.middle_name, pastor.last_name),
        code: pastor.personal_code || "",
        title: title || "",
        reason: "No photo on record",
      });
      continue;
    }
    withPhoto.push({ pastor, folder: titleFolder(title), name: pastorPhotoName(pastor) });
  }

  // Collisions are scoped to a folder — two same-named pastors of different
  // titles never share a directory and both keep clean names.
  const nameCounts = new Map<string, number>();
  for (const { folder, name } of withPhoto) {
    const key = `${folder}/${name}`;
    nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
  }

  const seen = new Map<string, number>();
  for (const { pastor, folder, name } of withPhoto) {
    const key = `${folder}/${name}`;
    let finalName = name;

    if ((nameCounts.get(key) || 0) > 1) {
      const nth = (seen.get(key) || 0) + 1;
      seen.set(key, nth);
      finalName = pastor.personal_code ? `${name}_${sanitizeFilename(pastor.personal_code)}` : `${name}_(${nth})`;
    }

    const url = pastor.profile_image as string;
    const proxied = !isCloudinaryPhoto(url);

    entries.push({
      pastorId: pastor.id,
      path: `${folder}/${finalName}${photoExtension(url, proxied)}`,
      url: proxied ? proxyPhotoUrl(pastor.id) : transformedPhotoUrl(url),
      proxied,
    });
  }

  return { entries, missing };
}

export interface SizedEntry extends PhotoEntry {
  bytes: number;
}

/**
 * Split entries into parts that each stay under the memory cap. A single photo
 * larger than the cap gets its own part rather than being dropped.
 */
export function packIntoParts(entries: SizedEntry[], maxBytes: number = MAX_PART_BYTES): SizedEntry[][] {
  const parts: SizedEntry[][] = [];
  let current: SizedEntry[] = [];
  let currentBytes = 0;

  for (const entry of entries) {
    const bytes = entry.bytes > 0 ? entry.bytes : ASSUMED_PHOTO_BYTES;
    if (current.length > 0 && currentBytes + bytes > maxBytes) {
      parts.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(entry);
    currentBytes += bytes;
  }

  if (current.length > 0) parts.push(current);
  return parts;
}

export function partFilename(date: string, part: number, totalParts: number): string {
  if (totalParts <= 1) return `pastor_photos_${date}.zip`;
  return `pastor_photos_${date}_part-${part}-of-${totalParts}.zip`;
}

export function buildMissingCsv(rows: MissingRow[]): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = ["Name,Code,Title,Reason"];
  for (const row of rows) {
    lines.push([row.name, row.code, row.title, row.reason].map(escape).join(","));
  }
  return lines.join("\r\n");
}

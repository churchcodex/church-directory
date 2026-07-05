import mongoose from "mongoose";
import Church from "@/models/Church";

/**
 * Resolves a church id to its region. Returns null when the id is malformed
 * or no such church exists, so callers can reject the reference. Churches
 * created before the region split have no stored region; they are Accra
 * (ADR 0001).
 */
export async function findChurchRegion(churchId: string): Promise<string | null> {
  if (!mongoose.isValidObjectId(churchId)) return null;
  const church: any = await Church.findById(churchId).select("region").lean();
  if (!church) return null;
  return church.region || "Accra";
}

/**
 * Ids of all churches whose region is not Accra. Churches without a stored
 * region are Accra (ADR 0001), so they are never in this set.
 */
export async function getNonAccraChurchIds(): Promise<Set<string>> {
  const churches = await Church.find({ region: { $nin: ["Accra", null, ""] } })
    .select("_id")
    .lean();
  return new Set(churches.map((church: any) => church._id.toString()));
}

/**
 * A pastor is an Accra pastor unless their church is in a non-Accra region.
 * Church-less pastors count as Accra (ADR 0001).
 */
export function isAccraPastor(pastor: { church?: unknown }, nonAccraChurchIds: Set<string>): boolean {
  if (!pastor.church) return true;
  return !nonAccraChurchIds.has(String(pastor.church));
}

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

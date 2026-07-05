import { Church } from "@/types/entities";

// A head pastor is optional (see ADR 0001). Forms may still send "" for "none";
// Mongoose cannot cast "" to an ObjectId, so coerce it to null before create/update.
export function normalizeChurchInput<T extends { head_pastor?: unknown }>(body: T): T {
  if (body.head_pastor === "") {
    return { ...body, head_pastor: null };
  }
  return body;
}

export function serializeChurch(church: any): Church {
  return {
    ...church,
    id: church._id.toString(),
    head_pastor: church.head_pastor ? church.head_pastor.toString() : "",
    // Churches created before the region split have no region; they are Accra (see ADR 0001).
    region: church.region || "Accra",
    images: Array.isArray(church.images) ? church.images : [],
  };
}

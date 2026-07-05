import { Church } from "@/types/entities";

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

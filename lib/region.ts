import { Church, Pastor, REGIONS } from "@/types/entities";

// The dashboard and list views filter by Region. "All" is a view filter,
// never a stored region value.
export const ALL_REGIONS = "All";
export const REGION_FILTERS = [...REGIONS, ALL_REGIONS] as const;
export type RegionFilter = string;

export function churchRegion(church: Pick<Church, "region">): string {
  // Churches created before the region split have no region; they are Accra (ADR 0001).
  return church.region || "Accra";
}

export function buildRegionByChurchId(churches: Array<Pick<Church, "id" | "region">>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const church of churches) {
    map[church.id] = churchRegion(church);
  }
  return map;
}

export function pastorRegion(
  pastor: Pick<Pastor, "church">,
  regionByChurchId: Record<string, string>,
): string {
  // A pastor's region is derived from their church; no church → Accra (ADR 0001).
  if (!pastor.church) return "Accra";
  return regionByChurchId[pastor.church] || "Accra";
}

export function matchesRegionFilter(region: string, filter: RegionFilter): boolean {
  return filter === ALL_REGIONS || region === filter;
}

export function filterChurchesByRegion<T extends Pick<Church, "region">>(
  churches: T[],
  filter: RegionFilter,
): T[] {
  if (filter === ALL_REGIONS) return churches;
  return churches.filter((church) => matchesRegionFilter(churchRegion(church), filter));
}

export function filterPastorsByRegion<T extends Pick<Pastor, "church">>(
  pastors: T[],
  filter: RegionFilter,
  regionByChurchId: Record<string, string>,
): T[] {
  if (filter === ALL_REGIONS) return pastors;
  return pastors.filter((pastor) => matchesRegionFilter(pastorRegion(pastor, regionByChurchId), filter));
}

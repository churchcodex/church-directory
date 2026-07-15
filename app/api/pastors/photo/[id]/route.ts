import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Pastor from "@/models/Pastor";
import { requireAdmin } from "@/lib/auth";
import { isCloudinaryPhoto } from "@/lib/pastor-photo-archive";

const FETCH_TIMEOUT_MS = 30000;

/**
 * Streams a pastor's photo for the bulk photo archive (ADR 0002).
 *
 * Only legacy S3/Google Drive photos need this: they send no CORS headers, so the
 * browser cannot fetch them directly the way it fetches Cloudinary photos. They
 * also have no transformation API, so they arrive at their original size.
 *
 * The URL is resolved from the pastor id server-side and never taken from the
 * caller — accepting a ?url= parameter would turn this into an open proxy and an
 * SSRF vector.
 */
/** Resolves the legacy photo URL for a pastor, or the response to return instead. */
async function resolveLegacyPhotoUrl(id: string): Promise<{ url: string } | { error: NextResponse }> {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return { error: adminCheck };

  await dbConnect();
  const pastor: any = await Pastor.findById(id).select("profile_image").lean();
  if (!pastor) {
    return { error: NextResponse.json({ success: false, error: "Pastor not found" }, { status: 404 }) };
  }

  const url: string = pastor.profile_image || "";
  if (!url) {
    return { error: NextResponse.json({ success: false, error: "Pastor has no photo" }, { status: 404 }) };
  }

  // Cloudinary photos are fetched browser-direct; proxying them would put
  // avoidable bytes through this function.
  if (isCloudinaryPhoto(url)) {
    return {
      error: NextResponse.json(
        { success: false, error: "Cloudinary photos are fetched directly, not proxied" },
        { status: 400 },
      ),
    };
  }

  return { url };
}

/**
 * Size-only pre-flight. Next derives HEAD from GET automatically, which would
 * stream the whole photo just to read its length — this asks upstream for headers
 * instead. A host that omits Content-Length simply leaves the size unknown, which
 * the packer treats as an estimate.
 */
export async function HEAD(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const resolved = await resolveLegacyPhotoUrl(id);
    if ("error" in resolved) return new NextResponse(null, { status: resolved.error.status });

    const upstream = await fetch(resolved.url, { method: "HEAD", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!upstream.ok) return new NextResponse(null, { status: 502 });

    const headers = new Headers();
    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);
    return new NextResponse(null, { status: 200, headers });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const resolved = await resolveLegacyPhotoUrl(id);
    if ("error" in resolved) return resolved.error;

    const upstream = await fetch(resolved.url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { success: false, error: `Photo host returned ${upstream.status}` },
        { status: 502 },
      );
    }

    const headers = new Headers({
      "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    });
    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error: any) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    return NextResponse.json(
      { success: false, error: timedOut ? "Photo host timed out" : "Failed to fetch photo" },
      { status: 502 },
    );
  }
}

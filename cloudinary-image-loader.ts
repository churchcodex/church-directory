interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

const CLOUDINARY_HOST_PREFIX = "https://res.cloudinary.com/";
const UPLOAD_SEGMENT = "/image/upload/";

/**
 * Global next/image loader (wired via images.loaderFile in next.config.ts).
 * Cloudinary images are resized and re-encoded by Cloudinary's CDN, so the
 * Next.js server never downloads the multi-MB originals itself.
 *
 * This file must stay at the project root: Turbopack on Windows fails to
 * resolve a loaderFile in a subdirectory because Next.js hands it the path
 * with backslashes (e.g. "./lib\cloudinary-image-loader.ts"), silently
 * falling back to the default loader, which then throws
 * "missing loader prop" at render time.
 */
export default function cloudinaryImageLoader({ src, width, quality }: ImageLoaderParams): string {
  if (src.startsWith(CLOUDINARY_HOST_PREFIX) && src.includes(UPLOAD_SEGMENT)) {
    const transform = `f_auto,q_${quality ?? "auto"},w_${width}`;
    return src.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}${transform}/`);
  }

  // Files in /public are served as-is; the query param only satisfies
  // next/image's check that a custom loader varies its URL by width.
  if (src.startsWith("/")) {
    return `${src}?w=${width}`;
  }

  // Other hosts (legacy S3 / Google Drive photos) offer no resizing API, and
  // their URLs must not be altered.
  return src;
}

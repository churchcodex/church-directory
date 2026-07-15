# The pastor photo archive is zipped in the browser, not by Cloudinary or the server

Admins need every listed Pastor's photo as a zip, filed under the Pastor's **Primary Title** and named after the Pastor. The obvious move — hand the whole job to Cloudinary's `generate_archive`/`download_zip_url` — cannot work: it names entries by `public_id` (random) or `use_original_filename` (`IMG_1234.jpg`), and offers **no per-file rename**. Naming by Pastor is the entire point of the feature, so the archive is assembled client-side with `client-zip`, fetching each photo browser-direct from Cloudinary at `w_2000,q_90,f_jpg` and writing ~400MB parts sequentially.

## Considered Options

- **Cloudinary `generate_archive`:** rejected — no per-file naming, as above. It would otherwise be ideal (zero egress, no timeout). Revisit only if Cloudinary adds per-entry names, or if `public_id`s are ever made to match Pastor identity.
- **Server-streamed zip (`archiver` in a route):** rejected — naming and the three photo hosts would all be trivial, but every byte would cross Vercel (~0.6GB per run, several GB before downscaling was adopted), and a slow client risks the 300s function timeout mid-stream, yielding a truncated zip with no resume.
- **File System Access API (stream to a folder, no zip):** rejected — technically the best fit (no memory ceiling, no batching, resumable), but Chromium-only. Kept as an upgrade path; `client-zip` emits a `ReadableStream` that could pipe straight to a `FileSystemWritableFileStream`.
- **Cloudinary `image/fetch` for legacy photos:** rejected for now — it would downscale S3/Drive photos uniformly and remove the proxy, but fetch is disabled by default, caches copies against the storage quota, and 404s on >5 redirects (which Google Drive links hit).
- **Originals instead of downscaled copies:** rejected — uploads are raw camera files (`ImageUpload.tsx` does no resizing; `POST /api/upload` permits 50MB), so originals run to several GB per download and would exhaust a modest Cloudinary bandwidth quota in a handful of runs. `w_2000` still covers a full A5 page at 300 DPI.

## Consequences

- Photos are fetched from three hosts, but only Cloudinary sends CORS headers. Legacy S3 and Google Drive photos must be proxied through `/api/pastors/photo/[id]`, which resolves `profile_image` server-side — it must **never** accept a caller-supplied URL, or it becomes an open proxy and an SSRF vector.
- Cloudinary transformations don't apply to non-Cloudinary URLs, so proxied legacy photos land in the archive at full size, un-downscaled. Accepted: an oversized photo never ruins a print, a missing one does. Migrating legacy photos into Cloudinary would erase this whole branch — and would also fix their `unoptimized` full-size page loads.
- Batching exists for browser memory, not bandwidth: `client-zip` buffers a part before saving, so parts are capped near 400MB. At today's volume that's ~2 parts; it scales with the directory rather than needing revisiting.
- The size pre-flight (`HEAD` per photo, reading the CORS-exposed `Content-Length`) triggers first-time derivative generation on Cloudinary, so the **first** run after photos change is slow — minutes, not seconds. Later runs hit cached derivatives.
- The download must force `f_jpg`. The display path uses `f_auto` (`cloudinary-image-loader.ts`), which would serve WebP/AVIF bytes inside `.jpg` files.
- Zip entries are stored, never deflated — JPEGs are already compressed, so DEFLATE costs CPU for ~1% gain.

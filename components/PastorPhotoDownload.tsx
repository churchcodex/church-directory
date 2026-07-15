"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, ImageDown, Loader2 } from "lucide-react";
import { downloadZip } from "client-zip";
import { Pastor } from "@/types/entities";
import { buildPastorDisplayName } from "@/lib/pastor";
import {
  MAX_PART_BYTES,
  MissingRow,
  SizedEntry,
  buildMissingCsv,
  packIntoParts,
  partFilename,
  planPhotoArchive,
} from "@/lib/pastor-photo-archive";

// Browsers cap connections per host anyway; this keeps the pre-flight and the
// download from queueing up thousands of requests at once.
const FETCH_CONCURRENCY = 8;

interface PastorPhotoDownloadProps {
  pastors: Pastor[];
  /** Overridable so the dev harness can force multi-part saving with small images. */
  maxPartBytes?: number;
}

type Phase = "idle" | "sizing" | "confirm" | "downloading" | "done";

interface Plan {
  parts: SizedEntry[][];
  missing: MissingRow[];
  totalBytes: number;
  photoCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${Math.round(bytes / 1024 ** 2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/** Runs tasks with a fixed number of workers, preserving input order in the result. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T, index: number) => Promise<R>,
  signal?: AbortSignal,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      if (signal?.aborted) return;
      const index = next++;
      results[index] = await task(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking straight after click() can cancel a large save before it starts.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export default function PastorPhotoDownload({ pastors, maxPartBytes = MAX_PART_BYTES }: PastorPhotoDownloadProps) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sized, setSized] = useState(0);
  const [toSize, setToSize] = useState(0);
  const [done, setDone] = useState(0);
  const [currentPart, setCurrentPart] = useState(0);
  const [failed, setFailed] = useState<MissingRow[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const reset = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("idle");
    setPlan(null);
    setError(null);
    setSized(0);
    setToSize(0);
    setDone(0);
    setCurrentPart(0);
    setFailed([]);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  // Reading Content-Length up front is what makes the size warning and the part
  // count honest. The first run after photos change is slow: each HEAD makes
  // Cloudinary generate the downscaled derivative. Later runs hit its cache.
  const startSizing = async () => {
    setPhase("sizing");
    setError(null);

    const { entries, missing } = planPhotoArchive(pastors);
    setToSize(entries.length);
    if (entries.length === 0) {
      setPlan({ parts: [], missing, totalBytes: 0, photoCount: 0 });
      setPhase("confirm");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const sizedEntries = await mapWithConcurrency(
        entries,
        FETCH_CONCURRENCY,
        async (entry) => {
          let bytes = 0;
          try {
            const response = await fetch(entry.url, { method: "HEAD", signal: controller.signal });
            const length = response.headers.get("content-length");
            if (response.ok && length) bytes = Number(length) || 0;
          } catch {
            // An unreadable size is not fatal — the packer falls back to an estimate
            // and a genuinely broken photo is reported during the download itself.
          }
          setSized((n) => n + 1);
          return { ...entry, bytes };
        },
        controller.signal,
      );

      if (controller.signal.aborted) return;

      const totalBytes = sizedEntries.reduce((sum, entry) => sum + entry.bytes, 0);
      setPlan({
        parts: packIntoParts(sizedEntries, maxPartBytes),
        missing,
        totalBytes,
        photoCount: sizedEntries.length,
      });
      setPhase("confirm");
    } catch {
      setError("Could not read photo sizes. Check your connection and try again.");
      setPhase("idle");
    } finally {
      abortRef.current = null;
    }
  };

  const startDownload = async () => {
    if (!plan) return;
    setPhase("downloading");
    setDone(0);
    setFailed([]);

    const controller = new AbortController();
    abortRef.current = controller;
    const failures: MissingRow[] = [];

    try {
      for (let partIndex = 0; partIndex < plan.parts.length; partIndex++) {
        if (controller.signal.aborted) return;
        setCurrentPart(partIndex + 1);

        const part = plan.parts[partIndex];
        const files = await mapWithConcurrency(
          part,
          FETCH_CONCURRENCY,
          async (entry) => {
            try {
              const response = await fetch(entry.url, { signal: controller.signal });
              if (!response.ok) throw new Error(String(response.status));
              const blob = await response.blob();
              setDone((n) => n + 1);
              return { name: entry.path, input: blob };
            } catch (fetchError) {
              if (controller.signal.aborted) throw fetchError;
              const pastor = pastors.find((p) => p.id === entry.pastorId);
              failures.push({
                name: pastor
                  ? buildPastorDisplayName(pastor.first_name, pastor.middle_name, pastor.last_name)
                  : entry.path,
                code: pastor?.personal_code || "",
                title: pastor?.clergy_type?.join(", ") || "",
                reason: `Download failed (${fetchError instanceof Error ? fetchError.message : "error"})`,
              });
              setDone((n) => n + 1);
              return null;
            }
          },
          controller.signal,
        );

        if (controller.signal.aborted) return;

        // Aborting leaves holes in the results array, so this guards undefined too.
        const zipFiles: Array<{ name: string; input: Blob | string; lastModified?: Date }> = files.filter(
          (file): file is { name: string; input: Blob } => file != null,
        );

        // The report rides in the last part, not the first: failures are only all
        // known once every part has been fetched.
        if (partIndex === plan.parts.length - 1) {
          const rows = [...plan.missing, ...failures];
          if (rows.length > 0) {
            zipFiles.push({ name: "_missing.csv", input: buildMissingCsv(rows), lastModified: new Date() });
          }
        }

        if (zipFiles.length === 0) continue;

        const blob = await downloadZip(zipFiles).blob();
        saveBlob(blob, partFilename(new Date().toISOString().split("T")[0], partIndex + 1, plan.parts.length));
      }

      setFailed(failures);
      setPhase("done");
    } catch {
      if (!controller.signal.aborted) {
        setError("The download stopped partway. Any parts already saved are complete.");
        setPhase("confirm");
      }
    } finally {
      abortRef.current = null;
    }
  };

  const totalPastors = pastors.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" title="Download pastor photos as a zip">
          <ImageDown className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Download photos</DialogTitle>
          <DialogDescription>
            Photos for the {totalPastors} pastor{totalPastors === 1 ? "" : "s"} currently listed, in folders by title and
            named after each pastor. Inactive pastors are not included.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {phase === "idle" && (
          <p className="text-sm text-muted-foreground">
            We&apos;ll check each photo&apos;s size first so you can see how large the download is before it starts. The
            first run can take a few minutes while the resized copies are prepared.
          </p>
        )}

        {phase === "sizing" && (
          <div className="flex items-center gap-3 py-4 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              Checking photo sizes… {sized} of {toSize}
            </span>
          </div>
        )}

        {phase === "confirm" && plan && (
          <div className="space-y-3">
            {plan.photoCount === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>None of the listed pastors has a photo on record.</AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>
                    {plan.photoCount} photo{plan.photoCount === 1 ? "" : "s"} ≈ {formatBytes(plan.totalBytes)}
                  </strong>{" "}
                  in {plan.parts.length} zip file{plan.parts.length === 1 ? "" : "s"}. Your browser will save each part as
                  it finishes.
                </AlertDescription>
              </Alert>
            )}
            {plan.missing.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {plan.missing.length} pastor{plan.missing.length === 1 ? " has" : "s have"} no photo on record and will be
                listed in <code>_missing.csv</code>.
              </p>
            )}
          </div>
        )}

        {phase === "downloading" && plan && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-3 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                Part {currentPart} of {plan.parts.length} — {done} of {plan.photoCount} photos
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${plan.photoCount ? Math.round((done / plan.photoCount) * 100) : 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Keep this tab open until every part has saved.</p>
          </div>
        )}

        {phase === "done" && plan && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Saved {plan.parts.length} zip file{plan.parts.length === 1 ? "" : "s"}.
              {failed.length > 0 ? ` ${failed.length} photo${failed.length === 1 ? "" : "s"} failed and ${failed.length === 1 ? "is" : "are"} listed in _missing.csv.` : ""}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          {phase === "idle" && (
            <Button onClick={startSizing} disabled={totalPastors === 0} className="gap-2">
              <ImageDown className="h-4 w-4" />
              Check size
            </Button>
          )}
          {phase === "sizing" && (
            <Button variant="outline" onClick={reset}>
              Cancel
            </Button>
          )}
          {phase === "confirm" && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={startDownload} disabled={!plan || plan.photoCount === 0} className="gap-2">
                <ImageDown className="h-4 w-4" />
                Download
              </Button>
            </>
          )}
          {phase === "downloading" && (
            <Button variant="outline" onClick={reset}>
              Stop
            </Button>
          )}
          {phase === "done" && <Button onClick={() => handleOpenChange(false)}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

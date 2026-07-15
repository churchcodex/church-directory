"use client";

import { useMemo, useState } from "react";
import { notFound } from "next/navigation";
import { Pastor } from "@/types/entities";
import PastorPhotoDownload from "@/components/PastorPhotoDownload";
import { planPhotoArchive } from "@/lib/pastor-photo-archive";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

/**
 * Dev-only harness for the pastor photo archive (ADR 0002).
 *
 * The archive's pure logic is unit tested; this exercises what tests can't reach —
 * the real fetch/zip/save path in a real browser. It runs on Cloudinary's public
 * demo cloud with synthetic pastors, so it needs no login, no real pastor data, and
 * costs nothing against this project's Cloudinary quota.
 *
 * Not reachable in production.
 */

// Demo-cloud assets of differing sizes, so part packing has something to chew on.
const DEMO = (id: string) => `https://res.cloudinary.com/demo/image/upload/v1/${id}`;
const DEMO_PHOTOS = [
  DEMO("sample.jpg"),
  DEMO("woman.jpg"),
  DEMO("couple.jpg"),
  DEMO("lady.jpg"),
  DEMO("balloons.jpg"),
  DEMO("sheep.jpg"),
];

const LEGACY_PHOTO = "https://fl-admin-apps.s3.eu-west-2.amazonaws.com/pastors/joe.jpg";

interface Scenario {
  collisions: boolean;
  missing: boolean;
  dualTitles: boolean;
  noTitle: boolean;
  legacy: boolean;
}

function buildPastors(scenario: Scenario): Pastor[] {
  const base = (over: Partial<Pastor> & { id: string }): Pastor =>
    ({
      first_name: "Ama",
      last_name: "Owusu",
      clergy_type: ["Pastor"],
      council: [],
      area: "",
      function: [],
      ministry_group: [],
      status: "Active",
      ...over,
    }) as Pastor;

  const pastors: Pastor[] = [
    base({ id: "1", first_name: "Ama", last_name: "Owusu", clergy_type: ["Reverend"], profile_image: DEMO_PHOTOS[0], personal_code: "G-0001" }),
    base({ id: "2", first_name: "Yaw", last_name: "Boateng", clergy_type: ["Pastor"], profile_image: DEMO_PHOTOS[1], personal_code: "G-0002" }),
    base({ id: "3", first_name: "Esi", last_name: "Darko", clergy_type: ["Mother"], profile_image: DEMO_PHOTOS[2], personal_code: "G-0003" }),
    base({ id: "4", first_name: "Kojo", middle_name: "Nii", last_name: "Asante", clergy_type: ["Sister"], profile_image: DEMO_PHOTOS[3], personal_code: "G-0004" }),
  ];

  if (scenario.dualTitles) {
    // Stored least-senior-first on purpose: the folder must still be Bishops.
    pastors.push(
      base({ id: "5", first_name: "Kwabena", last_name: "Osei", clergy_type: ["Reverend", "Bishop"], profile_image: DEMO_PHOTOS[4], personal_code: "G-0005" }),
    );
  }

  if (scenario.collisions) {
    pastors.push(
      base({ id: "6", first_name: "Kwame", last_name: "Mensah", clergy_type: ["Bishop"], profile_image: DEMO_PHOTOS[5], personal_code: "G-0042" }),
      base({ id: "7", first_name: "Kwame", last_name: "Mensah", clergy_type: ["Bishop"], profile_image: DEMO_PHOTOS[0], personal_code: "G-0117" }),
      // Same name again, but no code — must fall back to a numeric suffix.
      base({ id: "8", first_name: "Adwoa", last_name: "Nyarko", clergy_type: ["Reverend"], profile_image: DEMO_PHOTOS[1] }),
      base({ id: "9", first_name: "Adwoa", last_name: "Nyarko", clergy_type: ["Reverend"], profile_image: DEMO_PHOTOS[2] }),
    );
  }

  if (scenario.noTitle) {
    pastors.push(
      base({ id: "10", first_name: "Efua", last_name: "Tetteh", clergy_type: ["Not Applicable"], profile_image: DEMO_PHOTOS[3], personal_code: "G-0010" }),
      // A name carrying characters that would nest folders / break Windows.
      base({ id: "11", first_name: "Kofi/Kojo", last_name: 'A"koto', clergy_type: ["Not Applicable"], profile_image: DEMO_PHOTOS[4], personal_code: "G-0011" }),
    );
  }

  if (scenario.missing) {
    pastors.push(
      base({ id: "12", first_name: "Abena", last_name: "Frimpong", clergy_type: ["Pastor"], personal_code: "G-0012" }),
      base({ id: "13", first_name: "Kwesi", last_name: "Appiah", clergy_type: ["Bishop"], personal_code: "G-0013" }),
    );
  }

  if (scenario.legacy) {
    // Routes to /api/pastors/photo/13 — which 404s here (no such pastor) and lands
    // in _missing.csv as a failed download. That is the point: it proves the proxy
    // branch is taken and that failures are reported rather than swallowed.
    pastors.push(
      base({ id: "14", first_name: "Yaa", last_name: "Adjei", clergy_type: ["Pastor"], profile_image: LEGACY_PHOTO, personal_code: "G-0014" }),
    );
  }

  return pastors;
}

const PART_CAPS = [
  { label: "400 MB (production)", value: 400 * 1024 * 1024 },
  { label: "500 KB (forces parts)", value: 500 * 1024 },
  { label: "200 KB (forces many)", value: 200 * 1024 },
];

export default function PhotoHarnessPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const [scenario, setScenario] = useState<Scenario>({
    collisions: true,
    missing: true,
    dualTitles: true,
    noTitle: true,
    legacy: false,
  });
  const [capIndex, setCapIndex] = useState(1);

  const pastors = useMemo(() => buildPastors(scenario), [scenario]);
  const { entries, missing } = useMemo(() => planPhotoArchive(pastors), [pastors]);

  // Group entries into their folders for the preview tree.
  const tree = useMemo(() => {
    const byFolder = new Map<string, string[]>();
    for (const entry of entries) {
      const [folder, file] = [entry.path.slice(0, entry.path.indexOf("/")), entry.path.slice(entry.path.indexOf("/") + 1)];
      byFolder.set(folder, [...(byFolder.get(folder) || []), file]);
    }
    return Array.from(byFolder.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [entries]);

  const toggle = (key: keyof Scenario) => setScenario((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Photo archive harness</h1>
        <p className="text-sm text-muted-foreground">
          Synthetic pastors on Cloudinary&apos;s public demo cloud. No login, no real data, no quota cost. Dev only.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          The preview below is computed by the same <code>planPhotoArchive()</code> the real button uses. Clicking
          <strong> Download photos</strong> runs the real fetch → zip → save path and writes actual files to your
          Downloads folder.
        </AlertDescription>
      </Alert>

      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-medium">Scenario</h2>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["collisions", "Name collisions"],
              ["missing", "Missing photos"],
              ["dualTitles", "Dual titles"],
              ["noTitle", "No title + unsafe chars"],
              ["legacy", "Legacy URL (proxy → fails)"],
            ] as Array<[keyof Scenario, string]>
          ).map(([key, label]) => (
            <Button key={key} variant={scenario[key] ? "default" : "outline"} size="sm" onClick={() => toggle(key)}>
              {scenario[key] ? "✓ " : ""}
              {label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-sm font-medium">Part cap:</span>
          {PART_CAPS.map((cap, i) => (
            <Button key={cap.label} variant={capIndex === i ? "default" : "outline"} size="sm" onClick={() => setCapIndex(i)}>
              {cap.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-medium">
            Zip preview — {entries.length} photo{entries.length === 1 ? "" : "s"}
          </h2>
          <pre className="overflow-x-auto text-xs leading-relaxed">
            {tree.map(([folder, files]) => `${folder}/\n${files.map((f) => `  ${f}`).join("\n")}`).join("\n")}
            {missing.length > 0 ? `\n_missing.csv  (${missing.length} row${missing.length === 1 ? "" : "s"})` : ""}
          </pre>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-medium">Missing report</h2>
          {missing.length === 0 ? (
            <p className="text-xs text-muted-foreground">No pastors without photos in this scenario.</p>
          ) : (
            <pre className="overflow-x-auto text-xs leading-relaxed">
              {missing.map((row) => `${row.name} · ${row.code || "—"} · ${row.title || "—"}\n  ${row.reason}`).join("\n")}
            </pre>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Download failures are appended to this at run time, so the real <code>_missing.csv</code> may have more rows.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border p-4">
        <PastorPhotoDownload pastors={pastors} maxPartBytes={PART_CAPS[capIndex].value} />
        <span className="text-sm text-muted-foreground">
          ← the real component, {pastors.length} synthetic pastors, {PART_CAPS[capIndex].label} cap
        </span>
      </div>
    </div>
  );
}

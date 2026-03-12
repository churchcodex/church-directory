import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Pastor from "@/models/Pastor";
import { generateUniquePastorCode } from "@/lib/pastor-code";
import * as XLSX from "xlsx";

function toUtcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function normalizeContactNumber(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.replace(/\s+/g, "").trim();
  return normalized || undefined;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getUtcDayRange(date: Date) {
  const start = toUtcDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

// Helper function to parse dates from Excel (handles numbers, strings, and Date objects)
function parseDate(value: unknown): Date | undefined {
  if (!value) return undefined;

  // Normalize Date instances to UTC date-only values.
  if (value instanceof Date && !isNaN(value.getTime())) {
    return toUtcDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  // If it's a number (Excel serial date), decode using XLSX parser.
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed || !parsed.y || !parsed.m || !parsed.d) {
      return undefined;
    }
    return toUtcDate(parsed.y, parsed.m, parsed.d);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    // ISO date (YYYY-MM-DD)
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return toUtcDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    }

    // Slash/hyphen date (DD/MM/YYYY or DD-MM-YYYY)
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (dmyMatch) {
      return toUtcDate(Number(dmyMatch[3]), Number(dmyMatch[2]), Number(dmyMatch[1]));
    }

    // Fallback for text dates like "12 Mar 2000"
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return toUtcDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
    }

    return undefined;
  }

  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required to bulk upload pastors." },
        { status: 403 },
      );
    }

    await dbConnect();

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    // Read the Excel file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: true });

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, error: "Excel file is empty" }, { status: 400 });
    }

    const results = {
      total: data.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>,
    };

    // Track created vs updated for reporting
    let created = 0;
    let updated = 0;

    // Fetch dynamic field options from endpoint (fallback to defaults if request fails)
    let allowedFunctions: string[] = ["Governor", "Overseer", "Not Applicable"];
    let allowedCouncils: string[] = [];
    let allowedAreas: string[] = [];

    try {
      const fieldsUrl = new URL(request.url);
      fieldsUrl.pathname = "/api/pastor-fields";
      const fieldsResp = await fetch(fieldsUrl.toString(), { method: "GET" });
      if (fieldsResp.ok) {
        const fieldsJson = await fieldsResp.json();
        const dynamicFunctions = fieldsJson?.data?.pastorFunctions?.options;
        allowedCouncils = fieldsJson?.data?.councils?.options || [];
        allowedAreas = fieldsJson?.data?.areas?.options || [];
        if (Array.isArray(dynamicFunctions) && dynamicFunctions.length > 0) {
          allowedFunctions = dynamicFunctions;
        }
      }
    } catch (error) {
      // Swallow error and continue with fallback values.
    }

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have a header row

      try {
        // Map Excel columns to pastor fields
        const pastorData: any = {
          first_name: row["First Name"] || row["first_name"],
          middle_name: row["Middle Name"] || row["middle_name"] || undefined,
          last_name: row["Last Name"] || row["last_name"],
          date_of_birth: parseDate(row["Date of Birth"] || row["date_of_birth"]),
          date_of_appointment: parseDate(row["Date of Appointment"] || row["date_of_appointment"]),
          profile_image: row["Profile Image URL"] || row["profile_image"] || undefined,
          marital_status: row["Marital Status"] || row["marital_status"] || undefined,
          church: row["Church ID"] || row["church"] || undefined,
          gender: row["Gender"] || row["gender"] || undefined,
          council: row["Council"] || row["council"] || undefined,
          area: row["Area"] || row["area"] || undefined,
          // occupation handled below to support "Other Occupation"
          country: row["Country"] || row["country"] || undefined,
          email: row["Email"] || row["email"] || undefined,
          contact_number: normalizeContactNumber(row["Contact Number"] || row["contact_number"] || undefined),
          status: row["Status"] || row["status"] || "Active",
          personal_code: undefined,
        };

        // Handle Occupation + Other Occupation (aligns with Pastor form behavior)
        const occupationRaw = row["Occupation"] || row["occupation"] || undefined;
        const otherOccupationRaw = row["Other Occupation"] || row["other_occupation"] || undefined;

        if (typeof occupationRaw === "string" && occupationRaw.trim().toLowerCase() === "other") {
          const custom = otherOccupationRaw !== undefined ? String(otherOccupationRaw).trim() : "";
          if (custom) {
            pastorData.occupation = custom;
          } else {
            results.failed++;
            results.errors.push({
              row: rowNumber,
              error: "Occupation is 'Other' but 'Other Occupation' is missing or empty. Provide a specific occupation.",
              data: row,
            });
            continue;
          }
        } else {
          pastorData.occupation = occupationRaw || undefined;
        }

        // Handle clergy_type which can be comma-separated
        const clergyTypeRaw = row["Clergy Type"] || row["clergy_type"];
        if (clergyTypeRaw) {
          pastorData.clergy_type =
            typeof clergyTypeRaw === "string" ? clergyTypeRaw.split(",").map((t: string) => t.trim()) : [clergyTypeRaw];
        }

        // Handle function (comma-separated allowed)
        const functionRaw = row["Function"] || row["function"];
        if (functionRaw) {
          const parsedFunctions =
            typeof functionRaw === "string"
              ? functionRaw
                  .split(",")
                  .map((value: string) => value.trim())
                  .filter(Boolean)
              : [functionRaw].filter(Boolean);
          pastorData.function = Array.from(new Set(parsedFunctions));
        } else {
          pastorData.function = [];
        }

        const invalidFunctions = (pastorData.function || []).filter(
          (value: string) => !allowedFunctions.includes(value),
        );

        if (invalidFunctions.length > 0) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: `Invalid function value(s): ${invalidFunctions.join(", ")}. Allowed: ${allowedFunctions.join(", ")}`,
            data: row,
          });
          continue;
        }

        // Normalize council to array (comma-separated allowed)
        if (pastorData.council !== undefined) {
          const councilArray = Array.isArray(pastorData.council)
            ? pastorData.council
            : String(pastorData.council)
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean);
          pastorData.council = Array.from(new Set(councilArray));
        }

        // Validate required fields
        if (!pastorData.first_name || !pastorData.last_name) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: "Missing required fields: first_name and last_name are required",
            data: row,
          });
          continue;
        }

        if (!pastorData.council || !Array.isArray(pastorData.council) || pastorData.council.length === 0) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: "Council is required. Provide one or more councils separated by commas.",
            data: row,
          });
          continue;
        }

        // Sanitize empty strings/whitespace to undefined for select/date fields
        if (typeof pastorData.area === "string" && pastorData.area.trim() === "") pastorData.area = undefined;

        if (Array.isArray(pastorData.council) && allowedCouncils.length > 0) {
          const invalidCouncils = pastorData.council.filter((c: string) => !allowedCouncils.includes(c));
          if (invalidCouncils.length > 0) {
            results.failed++;
            results.errors.push({
              row: rowNumber,
              error: `Invalid council(s): ${invalidCouncils.join(", ")}. Allowed values are managed in Admin → Pastor Fields`,
              data: row,
            });
            continue;
          }
        }

        if (pastorData.area && allowedAreas.length > 0 && !allowedAreas.includes(pastorData.area)) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: `Invalid area: ${pastorData.area}. Allowed values are managed in Admin → Pastor Fields`,
            data: row,
          });
          continue;
        }

        const duplicateQuery: Record<string, unknown> = {
          first_name: new RegExp(`^${escapeRegex(String(pastorData.first_name).trim())}$`, "i"),
          last_name: new RegExp(`^${escapeRegex(String(pastorData.last_name).trim())}$`, "i"),
        };

        if (pastorData.date_of_birth instanceof Date) {
          const { start, end } = getUtcDayRange(pastorData.date_of_birth);
          duplicateQuery.date_of_birth = { $gte: start, $lt: end };
        }

        if (pastorData.contact_number) {
          duplicateQuery.contact_number = pastorData.contact_number;
        }

        const existingPastor = await Pastor.findOne(duplicateQuery);

        if (existingPastor) {
          existingPastor.set(pastorData);
          await existingPastor.save();

          // Immutable schema fields can be ignored in Mongoose updates for existing docs.
          if (!existingPastor.personal_code) {
            const generatedCode = await generateUniquePastorCode();
            await Pastor.collection.updateOne({ _id: existingPastor._id }, { $set: { personal_code: generatedCode } });
          }

          updated++;
        } else {
          await Pastor.create({
            ...pastorData,
            personal_code: await generateUniquePastorCode(),
          });
          created++;
        }

        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          error: error.message || "Unknown error occurred",
          data: row,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...results,
        summary: `${created} created, ${updated} updated`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

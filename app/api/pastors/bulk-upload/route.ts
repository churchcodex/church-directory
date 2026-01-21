import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Pastor from "@/models/Pastor";
import * as XLSX from "xlsx";

// Helper function to parse dates from Excel (handles numbers, strings, and Date objects)
function parseDate(value: any): Date | undefined {
  if (!value) return undefined;

  // If it's already a Date, return it
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  // If it's a number (Excel serial date), convert it
  if (typeof value === "number") {
    // Excel serial dates: 1 = Jan 1, 1900 (with leap year bug)
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (value - 1) * 24 * 60 * 60 * 1000);
    return !isNaN(date.getTime()) ? date : undefined;
  }

  // If it's a string, try to parse it
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    // Try parsing as ISO string (YYYY-MM-DD) or other common formats
    const date = new Date(trimmed);
    return !isNaN(date.getTime()) ? date : undefined;
  }

  return undefined;
}

export async function POST(request: NextRequest) {
  try {
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
    const data = XLSX.utils.sheet_to_json(worksheet);

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
    try {
      const fieldsUrl = new URL(request.url);
      fieldsUrl.pathname = "/api/pastor-fields";
      const fieldsResp = await fetch(fieldsUrl.toString(), { method: "GET" });
      if (fieldsResp.ok) {
        const fieldsJson = await fieldsResp.json();
        const dynamicFunctions = fieldsJson?.data?.pastorFunctions?.options;
        if (Array.isArray(dynamicFunctions) && dynamicFunctions.length > 0) {
          allowedFunctions = dynamicFunctions;
        }
      }
    } catch (e) {
      // Swallow error and continue with default allowedFunctions
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
          contact_number: row["Contact Number"] || row["contact_number"] || undefined,
          status: row["Status"] || row["status"] || "Active",
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

        // Sanitize empty strings/whitespace to undefined for select/date fields
        if (typeof pastorData.council === "string" && pastorData.council.trim() === "") pastorData.council = undefined;
        if (typeof pastorData.area === "string" && pastorData.area.trim() === "") pastorData.area = undefined;

        // Optional: pre-validate council/area against dynamic options
        // When endpoint returns configured options, ensure provided values are recognized
        try {
          const fieldsUrl = new URL(request.url);
          fieldsUrl.pathname = "/api/pastor-fields";
          const fieldsResp = await fetch(fieldsUrl.toString(), { method: "GET" });
          if (fieldsResp.ok) {
            const fieldsJson = await fieldsResp.json();
            const allowedCouncils: string[] = fieldsJson?.data?.councils?.options || [];
            const allowedAreas: string[] = fieldsJson?.data?.areas?.options || [];
            if (pastorData.council && allowedCouncils.length > 0 && !allowedCouncils.includes(pastorData.council)) {
              results.failed++;
              results.errors.push({
                row: rowNumber,
                error: `Invalid council: ${pastorData.council}. Allowed values are managed in Admin → Pastor Fields`,
                data: row,
              });
              continue;
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
          }
        } catch (e) {
          // If the endpoint is unavailable, skip pre-validation and let DB validations handle
        }

        // Check for duplicate pastor and upsert (update if exists, create if not)
        // Use findOneAndUpdate with upsert to handle duplicates automatically
        const query = {
          first_name: pastorData.first_name,
          last_name: pastorData.last_name,
          ...(pastorData.date_of_birth && { date_of_birth: pastorData.date_of_birth }),
        };

        const existingPastor = await Pastor.findOneAndUpdate(query, pastorData, {
          new: true,
          runValidators: true,
          upsert: true, // Create if not found
        });

        results.successful++;
        if (existingPastor.wasNew) {
          created++;
        } else {
          updated++;
        }
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

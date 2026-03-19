import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Pastor from "@/models/Pastor";
import { generateUniquePastorCode, isSequentialPastorCode } from "@/lib/pastor-code";
import { buildPastorDisplayName, sendPastorCodeSms } from "@/lib/codeslaw-bms";
import * as XLSX from "xlsx";

// Normalize a phone number to a canonical form for duplicate detection.
// Strips leading +, spaces, and converts 0XX -> 233XX so that
// +233244000000, 233244000000 and 0244000000 all compare equal.
function normalizePhone(raw: any): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw).replace(/\s+/g, "").replace(/^\+/, "");
  if (!s) return undefined;
  // 0XXXXXXXXX → 233XXXXXXXXX
  if (s.startsWith("0")) return "233" + s.slice(1);
  return s;
}

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

    const smsResults = {
      attempted: 0,
      sent: 0,
      failed: 0,
      errors: [] as Array<{
        row: number;
        pastorName: string;
        phoneNumber?: string;
        reason?: string;
        error: string;
      }>,
    };

    // Track created vs updated for reporting
    let created = 0;
    let updated = 0;

    // Fetch dynamic field options from endpoint (fallback to defaults if request fails)
    let allowedFunctions: string[] = ["Governor", "Overseer", "Not Applicable"];
    let allowedCouncils: string[] = [];
    let allowedAreas: string[] = [];
    let allowedMinistryGroups: string[] = [];

    try {
      const fieldsUrl = new URL(request.url);
      fieldsUrl.pathname = "/api/pastor-fields";
      const fieldsResp = await fetch(fieldsUrl.toString(), { method: "GET" });
      if (fieldsResp.ok) {
        const fieldsJson = await fieldsResp.json();
        const dynamicFunctions = fieldsJson?.data?.pastorFunctions?.options;
        allowedCouncils = fieldsJson?.data?.councils?.options || [];
        allowedAreas = fieldsJson?.data?.areas?.options || [];
        allowedMinistryGroups = fieldsJson?.data?.ministryGroups?.options || [];
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
          ministry_group: undefined, // handled below
          // occupation handled below to support "Other Occupation"
          country: row["Country"] || row["country"] || undefined,
          email: row["Email"] || row["email"] || undefined,
          contact_number: row["Contact Number"] || row["contact_number"] || undefined,
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

        // Handle ministry_group (comma-separated, only relevant for Area 4)
        const ministryGroupRaw = row["Ministry Group"] || row["ministry_group"];
        if (ministryGroupRaw) {
          const parsedGroups =
            typeof ministryGroupRaw === "string"
              ? ministryGroupRaw
                  .split(",")
                  .map((g: string) => g.trim())
                  .filter(Boolean)
              : [String(ministryGroupRaw).trim()].filter(Boolean);
          pastorData.ministry_group = Array.from(new Set(parsedGroups));
        } else {
          pastorData.ministry_group = [];
        }

        // Handle clergy_type which can be comma-separated
        const clergyTypeRaw = row["Clergy Type"] || row["clergy_type"];
        let governorSelectedAsTitle = false;
        if (clergyTypeRaw) {
          const parsedClergyTypes =
            typeof clergyTypeRaw === "string"
              ? clergyTypeRaw
                  .split(",")
                  .map((t: string) => t.trim())
                  .filter(Boolean)
              : [clergyTypeRaw].filter(Boolean);
          governorSelectedAsTitle = parsedClergyTypes.includes("Governor");
          pastorData.clergy_type = parsedClergyTypes.filter((value: string) => value !== "Governor");
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

        if (governorSelectedAsTitle && !pastorData.function.includes("Governor")) {
          pastorData.function = [...pastorData.function, "Governor"];
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

        // Validate ministry_group values (only when provided and allowed list is available)
        if (
          Array.isArray(pastorData.ministry_group) &&
          pastorData.ministry_group.length > 0 &&
          allowedMinistryGroups.length > 0
        ) {
          const invalidGroups = pastorData.ministry_group.filter((g: string) => !allowedMinistryGroups.includes(g));
          if (invalidGroups.length > 0) {
            results.failed++;
            results.errors.push({
              row: rowNumber,
              error: `Invalid ministry group(s): ${invalidGroups.join(", ")}. Allowed values are managed in Admin → Pastor Fields`,
              data: row,
            });
            continue;
          }
        }

        // Normalize contact numbers for comparison
        const normalizedIncoming = normalizePhone(pastorData.contact_number);

        // Build idempotency query: match on name + DOB when available, then
        // fall back to also matching on normalized phone if no DOB is supplied.
        const nameQuery = {
          first_name: pastorData.first_name,
          last_name: pastorData.last_name,
        };

        let query: any;
        if (pastorData.date_of_birth) {
          query = { ...nameQuery, date_of_birth: pastorData.date_of_birth };
        } else if (normalizedIncoming) {
          // Try to find an existing pastor whose stored phone normalizes to the same value
          const existingByPhone = (await Pastor.find(nameQuery).lean()) as any[];
          const phoneMatch = existingByPhone.find((p: any) => normalizePhone(p.contact_number) === normalizedIncoming);
          query = phoneMatch ? { _id: phoneMatch._id } : nameQuery;
        } else {
          query = nameQuery;
        }

        const existingPastor = await Pastor.findOne(query);

        // If no match yet and we have a phone, try matching by normalized phone across all name variants
        // (handles cases where name wasn't an exact match but phone is the real unique identifier)
        let resolvedPastor = existingPastor;
        if (!resolvedPastor && normalizedIncoming) {
          const allByName = (await Pastor.find({
            first_name: pastorData.first_name,
            last_name: pastorData.last_name,
          }).lean()) as any[];
          const phoneMatch = allByName.find((p: any) => normalizePhone(p.contact_number) === normalizedIncoming);
          if (phoneMatch) {
            resolvedPastor = await Pastor.findById(phoneMatch._id);
          }
        }

        let generatedCode: string | null = null;
        let pastorWithLatestCode: any = null;

        if (resolvedPastor) {
          const shouldGenerateCode = !isSequentialPastorCode(resolvedPastor.personal_code);
          const nextCode = shouldGenerateCode ? await generateUniquePastorCode() : resolvedPastor.personal_code;

          if (shouldGenerateCode) {
            generatedCode = nextCode;
          }

          resolvedPastor.set({
            ...pastorData,
            personal_code: nextCode,
          });
          await resolvedPastor.save();
          pastorWithLatestCode = resolvedPastor;
          updated++;
        } else {
          generatedCode = await generateUniquePastorCode();

          pastorWithLatestCode = await Pastor.create({
            ...pastorData,
            personal_code: generatedCode,
          });

          created++;
        }

        if (generatedCode && pastorWithLatestCode) {
          smsResults.attempted += 1;

          const pastorName = buildPastorDisplayName(
            pastorWithLatestCode.first_name,
            pastorWithLatestCode.middle_name,
            pastorWithLatestCode.last_name,
          );

          const sms = await sendPastorCodeSms({
            phoneNumber: pastorWithLatestCode.contact_number,
            pastorName,
            code: generatedCode,
          });

          if (sms.success) {
            smsResults.sent += 1;
          } else {
            smsResults.failed += 1;
            smsResults.errors.push({
              row: rowNumber,
              pastorName,
              phoneNumber: pastorWithLatestCode.contact_number,
              reason: sms.reason,
              error: sms.error || "Failed to send pastor code SMS.",
            });
          }
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
        sms: smsResults,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

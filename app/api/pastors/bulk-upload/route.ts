import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Pastor from "@/models/Pastor";
import { generateUniquePastorCode, isSequentialPastorCode } from "@/lib/pastor-code";
import { buildPastorDisplayName, sendPastorCodeSms } from "@/lib/codeslaw-bms";
import { getFieldOptions } from "@/lib/pastor-field-options";
import { normalizePastorDraft } from "@/lib/pastor-intake";
import { findChurchRegion } from "@/lib/church-region";
import * as XLSX from "xlsx";

function normalizePhone(raw: any): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw).replace(/\s+/g, "").replace(/^\+/, "");
  if (!s) return undefined;
  if (s.startsWith("0")) return "233" + s.slice(1);
  return s;
}

function parseDate(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (value - 1) * 24 * 60 * 60 * 1000);
    return !isNaN(date.getTime()) ? date : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const date = new Date(trimmed);
    return !isNaN(date.getTime()) ? date : undefined;
  }
  return undefined;
}

function splitCsvCell(value: any): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const single = String(value).trim();
  return single ? [single] : [];
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    await dbConnect();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const churchIdInput = formData.get("churchId");

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    // Every batch targets one admin-chosen church; each row attaches to it and
    // inherits its region's validation ("church first, then its pastors").
    const churchId = typeof churchIdInput === "string" ? churchIdInput.trim() : "";
    if (!churchId) {
      return NextResponse.json(
        { success: false, error: "A target church is required for bulk upload" },
        { status: 400 },
      );
    }

    const churchRegion = await findChurchRegion(churchId);
    if (!churchRegion) {
      return NextResponse.json({ success: false, error: "Selected church not found" }, { status: 400 });
    }

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

    let created = 0;
    let updated = 0;

    const fieldOptions = await getFieldOptions();
    const allowed = {
      councils: fieldOptions.councils.options,
      areas: fieldOptions.areas.options,
      pastorFunctions: fieldOptions.pastorFunctions.options,
      ministryGroups: fieldOptions.ministryGroups.options,
    };

    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      const rowNumber = i + 2;

      try {
        const rawArea = row["Area"] || row["area"];
        const draft: Record<string, any> = {
          first_name: row["First Name"] || row["first_name"],
          middle_name: row["Middle Name"] || row["middle_name"] || undefined,
          last_name: row["Last Name"] || row["last_name"],
          date_of_birth: parseDate(row["Date of Birth"] || row["date_of_birth"]),
          date_of_appointment: parseDate(row["Date of Appointment"] || row["date_of_appointment"]),
          profile_image: row["Profile Image URL"] || row["profile_image"] || undefined,
          marital_status: row["Marital Status"] || row["marital_status"] || undefined,
          church: churchId,
          gender: row["Gender"] || row["gender"] || undefined,
          council: splitCsvCell(row["Council"] || row["council"]),
          area: typeof rawArea === "string" && rawArea.trim() === "" ? undefined : rawArea || undefined,
          ministry_group: splitCsvCell(row["Ministry Group"] || row["ministry_group"]) ?? [],
          clergy_type: splitCsvCell(row["Clergy Type"] || row["clergy_type"]),
          function: splitCsvCell(row["Function"] || row["function"]) ?? [],
          occupation: row["Occupation"] || row["occupation"] || undefined,
          customOccupation: row["Other Occupation"] || row["other_occupation"] || undefined,
          country: row["Country"] || row["country"] || undefined,
          email: row["Email"] || row["email"] || undefined,
          contact_number: row["Contact Number"] || row["contact_number"] || undefined,
          status: row["Status"] || row["status"] || "Active",
        };

        if (!draft.first_name || !draft.last_name) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: "Missing required fields: first_name and last_name are required",
            data: row,
          });
          continue;
        }

        const { payload, errors } = normalizePastorDraft(draft, { mode: "create", churchRegion, allowed });

        if (errors.length > 0) {
          results.failed++;
          results.errors.push({ row: rowNumber, error: errors[0].message, data: row });
          continue;
        }

        const pastorData: Record<string, any> = { ...payload, personal_code: undefined };

        const normalizedIncoming = normalizePhone(pastorData.contact_number);

        const nameQuery = {
          first_name: pastorData.first_name,
          last_name: pastorData.last_name,
        };

        let query: any;
        if (pastorData.date_of_birth) {
          query = { ...nameQuery, date_of_birth: pastorData.date_of_birth };
        } else if (normalizedIncoming) {
          const existingByPhone = (await Pastor.find(nameQuery).lean()) as any[];
          const phoneMatch = existingByPhone.find((p: any) => normalizePhone(p.contact_number) === normalizedIncoming);
          query = phoneMatch ? { _id: phoneMatch._id } : nameQuery;
        } else {
          query = nameQuery;
        }

        const existingPastor = await Pastor.findOne(query);

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

          resolvedPastor.set({ ...pastorData, personal_code: nextCode });
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

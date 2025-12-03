import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Pastor from "@/models/Pastor";
import * as XLSX from "xlsx";

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
          date_of_birth: row["Date of Birth"] || row["date_of_birth"] || undefined,
          date_of_appointment: row["Date of Appointment"] || row["date_of_appointment"] || undefined,
          profile_image: row["Profile Image URL"] || row["profile_image"] || undefined,
          marital_status: row["Marital Status"] || row["marital_status"] || undefined,
          church: row["Church ID"] || row["church"] || undefined,
          gender: row["Gender"] || row["gender"] || undefined,
          council: row["Council"] || row["council"] || undefined,
          area: row["Area"] || row["area"] || undefined,
          occupation: row["Occupation"] || row["occupation"] || undefined,
          country: row["Country"] || row["country"] || undefined,
          email: row["Email"] || row["email"] || undefined,
          contact_number: row["Contact Number"] || row["contact_number"] || undefined,
          status: row["Status"] || row["status"] || "Active",
          function: row["Function"] || row["function"] || "N/A",
        };

        // Handle clergy_type which can be comma-separated
        const clergyTypeRaw = row["Clergy Type"] || row["clergy_type"];
        if (clergyTypeRaw) {
          pastorData.clergy_type =
            typeof clergyTypeRaw === "string" ? clergyTypeRaw.split(",").map((t: string) => t.trim()) : [clergyTypeRaw];
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

        // Sanitize empty strings to undefined for enum fields
        if (pastorData.council === "") pastorData.council = undefined;
        if (pastorData.area === "") pastorData.area = undefined;

        // Check for duplicate pastor
        const existingPastor = await Pastor.findOne({
          first_name: pastorData.first_name,
          last_name: pastorData.last_name,
          ...(pastorData.date_of_birth && { date_of_birth: new Date(pastorData.date_of_birth) }),
        });

        if (existingPastor) {
          results.failed++;
          results.errors.push({
            row: rowNumber,
            error: "Duplicate pastor: A pastor with the same name and date of birth already exists",
            data: row,
          });
          continue;
        }

        // Create pastor
        await Pastor.create(pastorData);
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
      data: results,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

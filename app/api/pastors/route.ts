import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Pastor from "@/models/Pastor";
import { requireAdmin } from "@/lib/auth";
import { generateUniquePastorCode } from "@/lib/pastor-code";
import { serializePastor, parsePastorInput } from "@/lib/pastor";
import { buildPastorDisplayName, sendPastorCodeSms } from "@/lib/codeslaw-bms";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    // Exclude pastors with status 'Inactive'
    const pastors = await Pastor.find({ status: { $ne: "Inactive" } }).lean();
    const transformedPastors = pastors.map((pastor: any) => serializePastor(pastor));
    return NextResponse.json({ success: true, data: transformedPastors });
  } catch (error: any) {
    console.error("Error fetching pastors:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch pastors",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    await dbConnect();
    const body = await request.json();
    const sanitizedData: Record<string, any> = { ...parsePastorInput(body), personal_code: undefined };

    if (!Array.isArray(sanitizedData.council) || sanitizedData.council.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select at least one council",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(sanitizedData.clergy_type) || sanitizedData.clergy_type.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select at least one title",
        },
        { status: 400 },
      );
    }

    // Build duplicate check query - always check first name and last name
    const duplicateQuery: any = {
      first_name: sanitizedData.first_name,
      last_name: sanitizedData.last_name,
    };

    // Add date of birth to query if provided
    if (sanitizedData.date_of_birth) {
      duplicateQuery.date_of_birth = new Date(sanitizedData.date_of_birth);
    }

    // Check for duplicate pastor
    const existingPastor = await Pastor.findOne(duplicateQuery);

    if (existingPastor) {
      const errorMessage = sanitizedData.date_of_birth
        ? "A pastor with the same first name, last name, and date of birth already exists"
        : "A pastor with the same first name and last name already exists";

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 409 },
      );
    }

    const personalCode = await generateUniquePastorCode();

    const pastor: any = await Pastor.create({
      ...sanitizedData,
      personal_code: personalCode,
    });

    const sms = await sendPastorCodeSms({
      phoneNumber: pastor.contact_number,
      pastorName: buildPastorDisplayName(pastor.first_name, pastor.middle_name, pastor.last_name),
      code: personalCode,
    });

    const transformedPastor = serializePastor(pastor.toObject());

    return NextResponse.json(
      {
        success: true,
        data: transformedPastor,
        sms,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating pastor:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create pastor",
      },
      { status: 400 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Pastor from "@/models/Pastor";
import { authOptions } from "@/lib/auth";

const allowedFunctions = ["Governor", "Overseer", "Not Applicable"];

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    // Exclude pastors with status 'Inactive'
    const pastors = await Pastor.find({ status: { $ne: "Inactive" } }).lean();
    const transformedPastors = pastors.map((pastor: any) => ({
      ...pastor,
      id: pastor._id.toString(),
      church: pastor.church ? pastor.church.toString() : "",
      date_of_birth: pastor.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
      date_of_appointment: pastor.date_of_appointment
        ? new Date(pastor.date_of_appointment).toISOString().split("T")[0]
        : "",
      first_name: pastor.first_name || "",
      middle_name: pastor.middle_name || "",
      last_name: pastor.last_name || "",
      function: (Array.isArray(pastor.function) ? pastor.function : pastor.function ? [pastor.function] : []).filter(
        (value: string) => allowedFunctions.includes(value),
      ),
    }));
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
    const session = await getServerSession(authOptions);

    // Only admins can create pastors
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Admin access required to create pastors.",
        },
        { status: 403 },
      );
    }

    await dbConnect();
    const body = await request.json();

    const normalizedFunction = Array.isArray(body.function) ? body.function : body.function ? [body.function] : [];
    const functionValues = Array.from(new Set(normalizedFunction.filter(Boolean))) as string[];

    // Validate clergy_type
    if (!body.clergy_type || body.clergy_type.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select at least one title",
        },
        { status: 400 },
      );
    }

    const invalidFunctions = functionValues.filter((value: string) => !allowedFunctions.includes(value));
    if (invalidFunctions.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid function selection. Allowed options are Governor, Overseer, or Not Applicable",
        },
        { status: 400 },
      );
    }

    // Sanitize empty strings to undefined for optional enum fields only
    const sanitizedData = {
      ...body,
      function: functionValues,
      church: body.church === "" ? undefined : body.church,
      // Council and Area are now required, so don't sanitize them
    };

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

    const pastor: any = await Pastor.create(sanitizedData);
    const transformedPastor = {
      ...pastor.toObject(),
      id: pastor._id.toString(),
      church: pastor.church?.toString() || "",
      date_of_birth: pastor.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
      date_of_appointment: pastor.date_of_appointment
        ? new Date(pastor.date_of_appointment).toISOString().split("T")[0]
        : "",
      first_name: pastor.first_name || "",
      middle_name: pastor.middle_name || "",
      last_name: pastor.last_name || "",
      function: Array.isArray(pastor.function) ? pastor.function : pastor.function ? [pastor.function] : [],
    };
    return NextResponse.json({ success: true, data: transformedPastor }, { status: 201 });
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

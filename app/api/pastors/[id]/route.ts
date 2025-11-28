import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Pastor from "@/models/Pastor";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const pastor: any = await Pastor.findById(id).lean();

    if (!pastor) {
      return NextResponse.json({ success: false, error: "Pastor not found" }, { status: 404 });
    }

    const transformedPastor = {
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
      clergy_type: pastor.clergy_type || [],
    };

    return NextResponse.json({ success: true, data: transformedPastor });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch pastor" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Validate clergy_type
    if (!body.clergy_type || body.clergy_type.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select at least one title",
        },
        { status: 400 }
      );
    }

    // Sanitize empty strings to undefined for optional enum fields only
    const sanitizedData = {
      ...body,
      church: body.church === "" ? undefined : body.church,
      ministry_group: body.ministry_group === "" ? undefined : body.ministry_group,
      // Council, Area, and Ministry are now required, so don't sanitize them
    };

    // Build duplicate check query - always check first name and last name, exclude current pastor
    const duplicateQuery: any = {
      _id: { $ne: id },
      first_name: sanitizedData.first_name,
      last_name: sanitizedData.last_name,
    };

    // Add date of birth to query if provided
    if (sanitizedData.date_of_birth) {
      duplicateQuery.date_of_birth = new Date(sanitizedData.date_of_birth);
    }

    // Check for duplicate pastor (excluding the current pastor being updated)
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
        { status: 409 }
      );
    }

    const pastor: any = await Pastor.findByIdAndUpdate(id, sanitizedData, {
      new: true,
      runValidators: true,
    }).lean();

    if (!pastor) {
      return NextResponse.json({ success: false, error: "Pastor not found" }, { status: 404 });
    }

    const transformedPastor = {
      ...pastor,
      id: pastor._id.toString(),
      church: pastor.church?.toString() || "",
      date_of_birth: pastor.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
      date_of_appointment: pastor.date_of_appointment
        ? new Date(pastor.date_of_appointment).toISOString().split("T")[0]
        : "",
      first_name: pastor.first_name || "",
      middle_name: pastor.middle_name || "",
      last_name: pastor.last_name || "",
    };

    return NextResponse.json({ success: true, data: transformedPastor });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const deletedPastor = await Pastor.findByIdAndDelete(id);

    if (!deletedPastor) {
      return NextResponse.json({ success: false, error: "Pastor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete pastor" }, { status: 400 });
  }
}

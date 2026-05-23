import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Pastor from "@/models/Pastor";
import { authOptions } from "@/lib/auth";
import { generateUniquePastorCode, isSequentialPastorCode } from "@/lib/pastor-code";
import { serializePastor, parsePastorInput } from "@/lib/pastor";
import { buildPastorDisplayName, sendPastorCodeSms } from "@/lib/codeslaw-bms";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const pastor: any = await Pastor.findById(id).lean();

    if (!pastor) {
      return NextResponse.json({ success: false, error: "Pastor not found" }, { status: 404 });
    }

    const transformedPastor = {
      ...serializePastor(pastor),
      clergy_type: pastor.clergy_type || [],
    };

    return NextResponse.json({ success: true, data: transformedPastor });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch pastor" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can update pastors
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Admin access required to update pastors.",
        },
        { status: 403 },
      );
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const sanitizedData: Record<string, any> = { ...parsePastorInput(body), personal_code: undefined };

    if (sanitizedData.council !== undefined && (!Array.isArray(sanitizedData.council) || sanitizedData.council.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select at least one council",
        },
        { status: 400 },
      );
    }

    if (sanitizedData.clergy_type !== undefined && (!Array.isArray(sanitizedData.clergy_type) || sanitizedData.clergy_type.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select at least one title",
        },
        { status: 400 },
      );
    }

    // Build duplicate check query only if name or DOB is being updated
    if (body.first_name !== undefined || body.last_name !== undefined || body.date_of_birth !== undefined) {
      const duplicateQuery: any = {
        _id: { $ne: id },
      };

      // Add fields that are being updated or fetch current values
      const currentPastor = await Pastor.findById(id);
      if (!currentPastor) {
        return NextResponse.json({ success: false, error: "Pastor not found" }, { status: 404 });
      }

      duplicateQuery.first_name = body.first_name !== undefined ? sanitizedData.first_name : currentPastor.first_name;
      duplicateQuery.last_name = body.last_name !== undefined ? sanitizedData.last_name : currentPastor.last_name;

      // Add date of birth to query if provided in update or exists in current record
      if (sanitizedData.date_of_birth) {
        duplicateQuery.date_of_birth = new Date(sanitizedData.date_of_birth);
      } else if (currentPastor.date_of_birth) {
        duplicateQuery.date_of_birth = currentPastor.date_of_birth;
      }

      // Check for duplicate pastor (excluding the current pastor being updated)
      const existingPastor = await Pastor.findOne(duplicateQuery);

      if (existingPastor) {
        const errorMessage = duplicateQuery.date_of_birth
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
    }

    const currentPastor = await Pastor.findById(id);

    if (!currentPastor) {
      return NextResponse.json({ success: false, error: "Pastor not found" }, { status: 404 });
    }

    const generatedCode = isSequentialPastorCode(currentPastor.personal_code) ? null : await generateUniquePastorCode();

    const pastor: any = await Pastor.findByIdAndUpdate(
      id,
      {
        ...sanitizedData,
        ...(generatedCode ? { personal_code: generatedCode } : {}),
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    if (!pastor) {
      return NextResponse.json({ success: false, error: "Pastor not found" }, { status: 404 });
    }

    const transformedPastor = serializePastor(pastor);

    const sms = generatedCode
      ? await sendPastorCodeSms({
          phoneNumber: pastor.contact_number,
          pastorName: buildPastorDisplayName(pastor.first_name, pastor.middle_name, pastor.last_name),
          code: generatedCode,
        })
      : null;

    return NextResponse.json({ success: true, data: transformedPastor, sms });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can delete pastors
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Admin access required to delete pastors.",
        },
        { status: 403 },
      );
    }

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

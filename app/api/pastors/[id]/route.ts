import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Pastor from "@/models/Pastor";
import { requireAdmin } from "@/lib/auth";
import { generateUniquePastorCode, isSequentialPastorCode } from "@/lib/pastor-code";
import { buildPastorDisplayName, serializePastor } from "@/lib/pastor";
import { normalizePastorDraft } from "@/lib/pastor-intake";
import { getFieldOptions } from "@/lib/pastor-field-options";
import { findChurchRegion } from "@/lib/church-region";
import { sendPastorCodeSms } from "@/lib/codeslaw-bms";

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
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const currentPastor = await Pastor.findById(id);
    if (!currentPastor) {
      return NextResponse.json({ success: false, error: "Pastor not found" }, { status: 404 });
    }

    // Council/Area requiredness depends on the effective church's region:
    // the newly chosen church if one is submitted, else the pastor's current
    // church; a church-less pastor counts as Accra (ADR 0001).
    let churchRegion = "Accra";
    if (typeof body.church === "string" && body.church.length > 0) {
      const region = await findChurchRegion(body.church);
      if (!region) {
        return NextResponse.json({ success: false, error: "Selected church not found" }, { status: 400 });
      }
      churchRegion = region;
    } else if (currentPastor.church) {
      churchRegion = (await findChurchRegion(currentPastor.church.toString())) || "Accra";
    }

    const fieldOptions = await getFieldOptions();
    const { payload, errors } = normalizePastorDraft(body, {
      mode: "update",
      churchRegion,
      allowed: {
        councils: fieldOptions.councils.options,
        areas: fieldOptions.areas.options,
        pastorFunctions: fieldOptions.pastorFunctions.options,
        ministryGroups: fieldOptions.ministryGroups.options,
      },
    });

    if (errors.length > 0) {
      return NextResponse.json({ success: false, error: errors[0].message }, { status: 400 });
    }

    const sanitizedData: Record<string, any> = { ...payload, personal_code: undefined };

    if (body.first_name !== undefined || body.last_name !== undefined || body.date_of_birth !== undefined) {
      const duplicateQuery: any = { _id: { $ne: id } };

      duplicateQuery.first_name = body.first_name !== undefined ? sanitizedData.first_name : currentPastor.first_name;
      duplicateQuery.last_name = body.last_name !== undefined ? sanitizedData.last_name : currentPastor.last_name;

      if (sanitizedData.date_of_birth) {
        duplicateQuery.date_of_birth = new Date(sanitizedData.date_of_birth);
      } else if (currentPastor.date_of_birth) {
        duplicateQuery.date_of_birth = currentPastor.date_of_birth;
      }

      const existingPastor = await Pastor.findOne(duplicateQuery);
      if (existingPastor) {
        const errorMessage = duplicateQuery.date_of_birth
          ? "A pastor with the same first name, last name, and date of birth already exists"
          : "A pastor with the same first name and last name already exists";
        return NextResponse.json({ success: false, error: errorMessage }, { status: 409 });
      }
    }

    const generatedCode = isSequentialPastorCode(currentPastor.personal_code) ? null : await generateUniquePastorCode();

    const pastor: any = await Pastor.findByIdAndUpdate(
      id,
      {
        ...sanitizedData,
        ...(generatedCode ? { personal_code: generatedCode } : {}),
      },
      { new: true, runValidators: true },
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
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

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

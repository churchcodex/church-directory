import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import PastorFieldOptions from "@/models/PastorFieldOptions";
import User from "@/models/User";
import { defaultFieldValues, getFieldOptions } from "@/lib/pastor-field-options";

export async function GET(_req: NextRequest) {
  try {
    const fieldOptions = await getFieldOptions();
    return NextResponse.json({ success: true, data: fieldOptions });
  } catch (error) {
    console.error("Error fetching field options:", error);
    return NextResponse.json({ error: "Failed to fetch field options" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;
    const session = adminCheck;

    const { fieldName, options } = await req.json();

    if (!fieldName || !options || !Array.isArray(options)) {
      return NextResponse.json({ error: "Field name and options array are required" }, { status: 400 });
    }

    if (!defaultFieldValues[fieldName]) {
      return NextResponse.json({ error: "Invalid field name" }, { status: 400 });
    }

    if (fieldName === "clergyTypes" && options.includes("Governor")) {
      return NextResponse.json({ error: "Governor is a function, not a clergy type." }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user?.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const fieldOption = await PastorFieldOptions.findOneAndUpdate(
      { fieldName },
      { options, updatedBy: user._id },
      { upsert: true, new: true },
    );

    return NextResponse.json({
      success: true,
      message: "Field options updated successfully",
      data: fieldOption,
    });
  } catch (error) {
    console.error("Error updating field options:", error);
    return NextResponse.json({ error: "Failed to update field options" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminCheck = await requireAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const { searchParams } = new URL(req.url);
    const fieldName = searchParams.get("fieldName");

    if (!fieldName) {
      return NextResponse.json({ error: "Field name is required" }, { status: 400 });
    }

    if (!defaultFieldValues[fieldName]) {
      return NextResponse.json({ error: "Invalid field name" }, { status: 400 });
    }

    await dbConnect();

    await PastorFieldOptions.findOneAndDelete({ fieldName });

    return NextResponse.json({
      success: true,
      message: "Field options reset to defaults",
      data: { fieldName, options: defaultFieldValues[fieldName] },
    });
  } catch (error) {
    console.error("Error resetting field options:", error);
    return NextResponse.json({ error: "Failed to reset field options" }, { status: 500 });
  }
}

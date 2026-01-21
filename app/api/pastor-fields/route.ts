import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import PastorFieldOptions from "@/models/PastorFieldOptions";
import User from "@/models/User";

// Default values for each field
const defaultFieldValues: Record<string, string[]> = {
  clergyTypes: ["Bishop", "Mother", "Sister", "Reverend", "Pastor", "Not Applicable"],
  areas: [
    "HGE Area 1",
    "HGE Area 2",
    "HGE Area 3",
    "HGE Area 4",
    "Experience Area 1",
    "Experience Area 2",
    "Experience Area 3",
    "Experience Area 4",
    "None",
  ],
  councils: [
    "Philippians",
    "Galatians",
    "Colossians",
    "2 Corinthians",
    "Anagkazo",
    "Ephesians",
    "Signs and Wonders HGE",
    "Greater Love Club",
    "GLGC",
    "Film Stars",
    "Dancing Stars",
    "Praise and Worship",
    "Eels on wheels",
    "Spiders",
    "Doves",
    "Lizardos",
    "Butterflies",
    "Kangaroos",
    "Impalas",
    "Unicorns",
    "Gazelles",
    "Camels",
    "Eagles",
    "Lions",
    "Dolphins",
    "Actors Ministry",
    "Props Ministry",
    "Costume ministry",
    "Make up",
    "Protocol",
    "Script writers",
    "Social media",
    "Technical",
    "Love theatre company",
    "Many Are Called",
    "Love is Large",
    "Peace and Love",
    "True Love",
    "Love Never Fails",
    "Abundant Love",
    "Steadfast Love",
    "Perfect Love",
    "Unfeigned Love",
    "Love Is Patient",
    "Everlasting Love",
    "God So Loved",
    "Praise Stars",
    "Worship Stars",
    "N/A",
    "Backstage Hostesses",
    "Backstage Hosts",
    "Engedi Food Team",
    "Mood Changing Food Team",
    "Marriage Counseling",
    "Sheep seeking September",
    "Sheep seeking October",
    "Sheep seeking November",
    "Sheep seeking December",
    "Sheep seeking January",
    "Sheep seeking February",
    "Sheep seeking March",
    "Sheep seeking April",
    "Sheep seeking May",
    "Sheep seeking June",
    "Sheep seeking July",
    "Sheep seeking August",
    "School of Solid Foundation",
    "School of Victorious Living",
    "School of Evangelism",
    "School of the Word",
    "School of Apologetics",
    "Addictions and substance abuse Counsellors",
    "Grief and Trauma Counsellors",
    "Relationship and love related issues Counsellors",
    "Career and financial management Counsellors",
    "Business Community",
    "Music mixers",
    "Salvation corner ushers",
    "Podcast corner ushers",
    "Balcony ushers",
    "Left wing ushers",
    "Right wing ushers",
    "Middle ground ushers",
    "Photography Team",
    "Vox Team",
    "Video Clip Cutters Team",
    "YouTube & Graphics Team",
    "X Team",
    "TikTok & Snapchat Team",
    "Videography team",
    "Meta Team",
    "FLOC Production and editing Team",
    "Clap nighters",
    "Sunday intercessors",
    "Soul winning intercessors",
    "Testimony Maestros",
    "Mood changing Campus control",
    "External Campus control",
    "Cross Car Park Campus control",
    "Office block Car Park Campus control",
    "Revival street Campus control",
    "Lord's Tower- Praise and Worship",
    "Lord's Tower- Preaching and solo team",
    "Lord's Tower- Film stars",
    "Lord's Tower- Choir",
    "Lord's Tower- Dance",
    "Choir Telepastors",
    "Dancing stars Telepastors",
    "Film stars Telepastors",
    "Basonta Telepastors",
    "Philippians Telepastors",
    "Galatians Telepastors",
    "Ephesians Telepastors",
    "Anagkazo Telepastors",
    "Hostesses of the Offices",
    "Hostesses of the First timers",
    "Hostesses of the Greater lovers & Special Visitors",
    "Balcony Security",
    "Stage Security",
    "Ground Security",
    "I - church",
    "J - Church",
    "K - Church",
    "B - Church",
    "Y - Church",
    "Lovelets Check in",
    "Smiles on arrival airport stars",
    "First Offering airport stars",
    "Second offering airport stars",
    "Bus welcomers airport stars",
    "Car welcomers airport stars",
    "Car confirmers",
    "Bus confirmers",
    "Payments",
    "Treasurers",
    "Fragrance",
    "Governors lounge",
    "The Lord's garden",
    "HGE Telepastors",
    "HGE Understanding campaign",
    "HGE Sheep seeking",
    "HGE Airport Stars",
    "HGE Intimate counseling",
    "HGE Lord's tower",
    "HGE Ushers",
    "HGE Hostesses",
    "HGE Hearing and seeing",
    "None",
  ],
  occupations: [
    "Full Time Pastor",
    "Medical Doctor",
    "Lawyer",
    "Engineer",
    "Accountant",
    "Pharmacist",
    "Student",
    "Other",
  ],
  maritalStatuses: ["Single", "Married", "Divorced", "Widowed"],
  genders: ["Male", "Female"],
  statuses: ["Active", "Inactive"],
  pastorFunctions: ["Governor", "Overseer", "Not Applicable"],
};

const allowedFunctionValues = ["Governor", "Overseer", "Not Applicable"];

// GET all field options
export async function GET(req: NextRequest) {
  try {
    // Allow public access to GET field options for signup
    await dbConnect();

    // Get all field options or return defaults
    const fieldNames = Object.keys(defaultFieldValues);
    const fieldOptions: Record<string, any> = {};

    for (const fieldName of fieldNames) {
      const fieldOption = await PastorFieldOptions.findOne({ fieldName });
      const options = fieldOption ? fieldOption.options : defaultFieldValues[fieldName];

      if (!fieldOption) {
        // Return default values if not in database
        fieldOptions[fieldName] = {
          fieldName,
          options,
          isDefault: true,
        };
      } else {
        fieldOptions[fieldName] = {
          fieldName: fieldOption.fieldName,
          options,
          updatedAt: fieldOption.updatedAt,
          isDefault: false,
        };
      }
    }

    return NextResponse.json({ success: true, data: fieldOptions });
  } catch (error) {
    console.error("Error fetching field options:", error);
    return NextResponse.json({ error: "Failed to fetch field options" }, { status: 500 });
  }
}

// PUT - Update field options
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fieldName, options } = await req.json();

    if (!fieldName || !options || !Array.isArray(options)) {
      return NextResponse.json({ error: "Field name and options array are required" }, { status: 400 });
    }

    if (!defaultFieldValues[fieldName]) {
      return NextResponse.json({ error: "Invalid field name" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user?.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update or create field options
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

// DELETE - Reset field options to defaults
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fieldName = searchParams.get("fieldName");

    if (!fieldName) {
      return NextResponse.json({ error: "Field name is required" }, { status: 400 });
    }

    if (!defaultFieldValues[fieldName]) {
      return NextResponse.json({ error: "Invalid field name" }, { status: 400 });
    }

    await dbConnect();

    // Delete the custom field options to revert to defaults
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

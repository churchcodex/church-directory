import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import InviteToken from "@/models/InviteToken";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, token } = await request.json();

    if (!email || !password || !token) {
      return NextResponse.json({ error: "Email, password, and invite token are required" }, { status: 400 });
    }

    await dbConnect();

    // Verify invite token
    const inviteToken = await InviteToken.findOne({ token });

    if (!inviteToken) {
      return NextResponse.json({ error: "Invalid invite token" }, { status: 400 });
    }

    if (inviteToken.isUsed) {
      return NextResponse.json({ error: "This invite token has already been used" }, { status: 400 });
    }

    if (new Date() > inviteToken.expiresAt) {
      return NextResponse.json({ error: "This invite token has expired" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      role: "user",
      isActive: true,
    });

    // Mark token as used
    inviteToken.isUsed = true;
    inviteToken.usedBy = user._id;
    await inviteToken.save();

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: error.message || "Failed to register user" }, { status: 500 });
  }
}

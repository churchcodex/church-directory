import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import InviteToken from "@/models/InviteToken";

export async function POST(request: NextRequest) {
  try {
    const { password, token } = await request.json();

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ error: "Invalid signup link" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    await dbConnect();

    // Find and validate the invite token
    const inviteToken = await InviteToken.findOne({ token });

    if (!inviteToken) {
      return NextResponse.json({ error: "Invalid or expired invite token" }, { status: 400 });
    }

    if (inviteToken.isUsed) {
      return NextResponse.json({ error: "This invite token has already been used" }, { status: 400 });
    }

    if (new Date() > inviteToken.expiresAt) {
      return NextResponse.json({ error: "This invite token has expired" }, { status: 400 });
    }

    // Check if user already exists with this email
    const existingUser = await User.findOne({ email: inviteToken.email });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with email and council from token
    const user = await User.create({
      email: inviteToken.email,
      password: hashedPassword,
      role: (inviteToken as any).role || "user",
      council: inviteToken.council,
      isActive: true,
    });

    // Mark the token as used
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
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: error.message || "Failed to register user" }, { status: 500 });
  }
}

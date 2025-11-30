import dotenv from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User";

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

async function createAdminUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);
      process.exit(0);
    }

    // Get credentials from command line or use defaults
    const email = process.argv[2] || "admin@church.com";
    const password = process.argv[3] || "admin123";

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await User.create({
      email,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    console.log("\n✅ Admin user created successfully!");
    console.log("Email:", admin.email);
    console.log("Password:", password);
    console.log("\n⚠️  Please change the password after first login\n");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();

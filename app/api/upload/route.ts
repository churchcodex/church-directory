import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "File size exceeds 50MB limit" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    return new Promise<NextResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "church-directory",
            resource_type: "auto",
            max_file_size: 52428800, // 50MB in bytes for Cloudinary
          },
          (error, result) => {
            if (error) {
              resolve(NextResponse.json({ success: false, error: error.message }, { status: 400 }));
            } else {
              resolve(
                NextResponse.json({
                  success: true,
                  data: {
                    url: result?.secure_url,
                    public_id: result?.public_id,
                  },
                })
              );
            }
          }
        )
        .end(buffer);
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

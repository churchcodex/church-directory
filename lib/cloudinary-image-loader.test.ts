import { describe, expect, it } from "vitest";
import cloudinaryImageLoader from "../cloudinary-image-loader";

const CLOUDINARY_SRC = "https://res.cloudinary.com/demo/image/upload/v1712345678/church-directory/abc123.jpg";

describe("cloudinaryImageLoader", () => {
  it("injects format, quality and width transforms into Cloudinary image URLs", () => {
    expect(cloudinaryImageLoader({ src: CLOUDINARY_SRC, width: 640, quality: 60 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_60,w_640/v1712345678/church-directory/abc123.jpg"
    );
  });

  it("uses automatic quality when none is given", () => {
    expect(cloudinaryImageLoader({ src: CLOUDINARY_SRC, width: 96 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_96/v1712345678/church-directory/abc123.jpg"
    );
  });

  it("leaves non-image Cloudinary deliveries untouched", () => {
    const videoSrc = "https://res.cloudinary.com/demo/video/upload/v1/church-directory/tour.mp4";
    expect(cloudinaryImageLoader({ src: videoSrc, width: 640 })).toBe(videoSrc);
  });

  it("appends a width hint to local public files", () => {
    expect(cloudinaryImageLoader({ src: "/FL-Logo.webp", width: 128 })).toBe("/FL-Logo.webp?w=128");
  });

  it("leaves other remote hosts untouched", () => {
    const s3Src = "https://fl-admin-apps.s3.eu-west-2.amazonaws.com/pastors/joe.jpg";
    expect(cloudinaryImageLoader({ src: s3Src, width: 640, quality: 60 })).toBe(s3Src);

    const driveSrc = "https://drive.google.com/uc?export=view&id=abc";
    expect(cloudinaryImageLoader({ src: driveSrc, width: 640 })).toBe(driveSrc);
  });
});

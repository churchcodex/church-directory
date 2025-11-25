"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  value?: string | string[];
  onChange: (url: string | string[]) => void;
  multiple?: boolean;
  label?: string;
}

export default function ImageUpload({ value, onChange, multiple = false, label = "Upload Image" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>(Array.isArray(value) ? value : value ? [value] : []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.data.url);
        } else {
          throw new Error("Upload failed");
        }
      }

      if (multiple) {
        const newPreviews = [...previews, ...uploadedUrls];
        setPreviews(newPreviews);
        onChange(newPreviews);
      } else {
        setPreviews([uploadedUrls[0]]);
        onChange(uploadedUrls[0]);
      }
    } catch (error) {
      alert("Failed to upload image(s)");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    onChange(multiple ? newPreviews : newPreviews[0] || "");
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      <div className="flex flex-wrap gap-4">
        {previews.map((preview, index) => (
          <div key={index} className="relative group">
            <div className="relative h-32 w-32 rounded-lg overflow-hidden border-2 border-border">
              <Image src={preview} alt={`Preview ${index + 1}`} fill className="object-cover" />
            </div>
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-32 w-32 flex flex-col gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-xs">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8" />
                <span className="text-xs">{multiple ? "Add Images" : "Upload"}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {multiple && <p className="text-xs text-muted-foreground">You can upload multiple images</p>}
    </div>
  );
}

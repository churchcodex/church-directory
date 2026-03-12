"use client";

import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AttendanceUploadResult {
  attendanceDate: string;
  weekStart: string;
  weekEnd: string;
  totalRows: number;
  uniqueCodes: number;
  created: number;
  duplicateCodesInFile: number;
  alreadyMarkedCodes: string[];
  unmatchedCodes: string[];
}

interface AttendanceBulkUploadProps {
  attendanceDate: string;
  disabled?: boolean;
  onSuccess: () => void;
}

export default function AttendanceBulkUpload({ attendanceDate, disabled, onSuccess }: AttendanceBulkUploadProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<AttendanceUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDisabled = disabled || !attendanceDate;
  const dialogDescription = useMemo(() => {
    if (!attendanceDate) {
      return "Select an attendance date before uploading codes.";
    }

    return `Upload an Excel sheet containing pastor codes for ${attendanceDate}.`;
  }, [attendanceDate]);

  const resetUpload = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet([{ Code: "FLC-ABCDEFGH" }, { Code: "FLC-QWERTYUI" }]);

    worksheet["!cols"] = [{ wch: 18 }];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Tithe Payment Codes");
    XLSX.writeFile(workbook, "tithe_codes_template.xlsx");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      toast.error("Please select an Excel file (.xlsx or .xls).");
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file || !attendanceDate) {
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("attendanceDate", attendanceDate);

      const response = await fetch("/api/attendance/bulk-upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || "Failed to upload attendance codes.");
        return;
      }

      setResult(data.data);
      onSuccess();
      toast.success(`${data.data.created} attendance marks recorded.`);
    } catch {
      toast.error("Failed to upload attendance codes.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetUpload();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isDisabled}>
          <Upload className="h-4 w-4" />
          Upload Codes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Tithe Code Upload</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 mt-0.5 text-primary" />
              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="font-semibold">Template</h3>
                  <p className="text-sm text-muted-foreground">
                    The first sheet should contain one code per row. A single optional header row of Code is supported.
                  </p>
                </div>
                <Button onClick={downloadTemplate} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium">Excel File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Selected tithe payment date: {attendanceDate || "Not selected"}
            </p>
            <Button onClick={handleUpload} disabled={!file || isDisabled || uploading} className="gap-2">
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload Codes"}
            </Button>
          </div>

          {result && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Upload complete</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    {result.created} marks added for {result.attendanceDate}. {result.duplicateCodesInFile} duplicate
                    rows in the file were ignored.
                  </p>
                  {result.alreadyMarkedCodes.length > 0 && (
                    <p>Already marked for that date: {result.alreadyMarkedCodes.join(", ")}</p>
                  )}
                  {result.unmatchedCodes.length > 0 && <p>Unmatched codes: {result.unmatchedCodes.join(", ")}</p>}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!result && file && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ready to upload</AlertTitle>
              <AlertDescription>
                Uploading will apply all codes in this file to the selected tithe payment date.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

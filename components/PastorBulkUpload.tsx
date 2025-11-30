"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Download, AlertCircle, CheckCircle2, FileSpreadsheet, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from "xlsx";

interface UploadResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

interface PastorBulkUploadProps {
  onSuccess: () => void;
}

export default function PastorBulkUpload({ onSuccess }: PastorBulkUploadProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    // Create a sample Excel template with column headers
    const templateData = [
      {
        "First Name": "John",
        "Middle Name": "Paul",
        "Last Name": "Doe",
        "Date of Birth": "1990-01-15",
        "Date of Appointment": "2020-06-01",
        "Clergy Type": "Pastor,Governor",
        "Marital Status": "Married",
        Gender: "Male",
        Council: "Philippians",
        Area: "Experience Area 2",
        Occupation: "Medical Doctor",
        Country: "Ghana",
        Email: "john.doe@example.com",
        "Contact Number": "+233244000000",
        "Church ID": "",
        "Profile Image URL": "",
        Status: "Active",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();

    // Create reference sheet for council options (all options in one place)
    const councilData = [
      { "Council Options - Original Councils": "Philippians" },
      { "Council Options - Original Councils": "Galatians" },
      { "Council Options - Original Councils": "Colossians" },
      { "Council Options - Original Councils": "2 Corinthians" },
      { "Council Options - Original Councils": "Anagkazo" },
      { "Council Options - Original Councils": "Ephesians" },
      { "Council Options - Original Councils": "Signs and Wonders HGE" },
      { "Council Options - Original Councils": "None" },
    ];

    const ministryOptions = [
      { "Council Options - Ministries": "GLGC" },
      { "Council Options - Ministries": "Film Stars" },
      { "Council Options - Ministries": "Dancing Stars" },
      { "Council Options - Ministries": "Praise and Worship" },
    ];

    const glgcGroupOptions = [
      { "Council Options - GLGC Groups": "Many Are Called" },
      { "Council Options - GLGC Groups": "Love is Large" },
      { "Council Options - GLGC Groups": "Peace and Love" },
      { "Council Options - GLGC Groups": "True Love" },
      { "Council Options - GLGC Groups": "Love Never Fails" },
      { "Council Options - GLGC Groups": "Abundant Love" },
      { "Council Options - GLGC Groups": "Steadfast Love" },
      { "Council Options - GLGC Groups": "Perfect Love" },
      { "Council Options - GLGC Groups": "Unfeigned Love" },
      { "Council Options - GLGC Groups": "Love Is Patient" },
      { "Council Options - GLGC Groups": "Everlasting Love" },
      { "Council Options - GLGC Groups": "God So Loved" },
    ];

    const dancingStarsGroupOptions = [
      { "Council Options - Dancing Stars Groups": "Eels on wheels" },
      { "Council Options - Dancing Stars Groups": "Spiders" },
      { "Council Options - Dancing Stars Groups": "Doves" },
      { "Council Options - Dancing Stars Groups": "Lizardos" },
      { "Council Options - Dancing Stars Groups": "Butterflies" },
      { "Council Options - Dancing Stars Groups": "Kangaroos" },
      { "Council Options - Dancing Stars Groups": "Impalas" },
      { "Council Options - Dancing Stars Groups": "Unicorns" },
      { "Council Options - Dancing Stars Groups": "Gazelles" },
      { "Council Options - Dancing Stars Groups": "Camels" },
      { "Council Options - Dancing Stars Groups": "Eagles" },
      { "Council Options - Dancing Stars Groups": "Lions" },
      { "Council Options - Dancing Stars Groups": "Dolphins" },
    ];

    const filmStarsGroupOptions = [
      { "Council Options - Film Stars Groups": "Actors Ministry" },
      { "Council Options - Film Stars Groups": "Props Ministry" },
      { "Council Options - Film Stars Groups": "Costume ministry" },
      { "Council Options - Film Stars Groups": "Make up" },
      { "Council Options - Film Stars Groups": "Protocol" },
      { "Council Options - Film Stars Groups": "Script writers" },
      { "Council Options - Film Stars Groups": "Social media" },
      { "Council Options - Film Stars Groups": "Technical" },
      { "Council Options - Film Stars Groups": "Love theatre company" },
    ];

    const praiseWorshipGroupOptions = [
      { "Council Options - Praise & Worship Groups": "Praise Stars" },
      { "Council Options - Praise & Worship Groups": "Worship Stars" },
    ];

    const basontaOptions = [
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
    ];

    // Convert all options to sheet format
    const councilSheet = XLSX.utils.json_to_sheet(councilData);
    const ministrySheet = XLSX.utils.json_to_sheet(ministryOptions);
    const glgcGroupSheet = XLSX.utils.json_to_sheet(glgcGroupOptions);
    const dancingStarsGroupSheet = XLSX.utils.json_to_sheet(dancingStarsGroupOptions);
    const filmStarsGroupSheet = XLSX.utils.json_to_sheet(filmStarsGroupOptions);
    const praiseWorshipGroupSheet = XLSX.utils.json_to_sheet(praiseWorshipGroupOptions);
    const basontaData = basontaOptions.map((b) => ({ "Council Options - Basonta": b }));
    const basontaSheet = XLSX.utils.json_to_sheet(basontaData);

    // Create reference sheets for other fields
    const areasData = [
      { Area: "HGE Area 1" },
      { Area: "HGE Area 2" },
      { Area: "HGE Area 3" },
      { Area: "HGE Area 4" },
      { Area: "Experience Area 1" },
      { Area: "Experience Area 2" },
      { Area: "Experience Area 3" },
      { Area: "Experience Area 4" },
      { Area: "None" },
    ];
    const areasSheet = XLSX.utils.json_to_sheet(areasData);

    const clergyTypesData = [
      { "Clergy Type": "Bishop", Description: "Can be combined with Governor (max 2 titles)" },
      { "Clergy Type": "Mother", Description: "Can be combined with Governor (max 2 titles)" },
      { "Clergy Type": "Sister", Description: "Can be combined with Governor (max 2 titles)" },
      { "Clergy Type": "Reverend", Description: "Can be combined with Governor (max 2 titles)" },
      { "Clergy Type": "Pastor", Description: "Can be combined with Governor (max 2 titles)" },
      { "Clergy Type": "Governor", Description: "Can be combined with any other title" },
    ];
    const clergyTypesSheet = XLSX.utils.json_to_sheet(clergyTypesData);

    const maritalStatusData = [
      { "Marital Status": "Single" },
      { "Marital Status": "Married" },
      { "Marital Status": "Divorced" },
      { "Marital Status": "Widowed" },
    ];
    const maritalStatusSheet = XLSX.utils.json_to_sheet(maritalStatusData);

    const genderData = [{ Gender: "Male" }, { Gender: "Female" }];
    const genderSheet = XLSX.utils.json_to_sheet(genderData);

    const statusData = [{ Status: "Active" }, { Status: "Inactive" }];
    const statusSheet = XLSX.utils.json_to_sheet(statusData);

    // Append all sheets to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pastors");
    XLSX.utils.book_append_sheet(workbook, councilSheet, "Council-Original");
    XLSX.utils.book_append_sheet(workbook, ministrySheet, "Council-Ministries");
    XLSX.utils.book_append_sheet(workbook, glgcGroupSheet, "Council-GLGC");
    XLSX.utils.book_append_sheet(workbook, dancingStarsGroupSheet, "Council-DancingStars");
    XLSX.utils.book_append_sheet(workbook, filmStarsGroupSheet, "Council-FilmStars");
    XLSX.utils.book_append_sheet(workbook, praiseWorshipGroupSheet, "Council-PraiseWorship");
    XLSX.utils.book_append_sheet(workbook, basontaSheet, "Council-Basonta");
    XLSX.utils.book_append_sheet(workbook, areasSheet, "Areas");
    XLSX.utils.book_append_sheet(workbook, clergyTypesSheet, "Titles");
    XLSX.utils.book_append_sheet(workbook, maritalStatusSheet, "Marital Status");
    XLSX.utils.book_append_sheet(workbook, genderSheet, "Gender");
    XLSX.utils.book_append_sheet(workbook, statusSheet, "Status");

    // Set column widths
    worksheet["!cols"] = [
      { wch: 15 }, // First Name
      { wch: 15 }, // Middle Name
      { wch: 15 }, // Last Name
      { wch: 15 }, // Date of Birth
      { wch: 20 }, // Date of Appointment
      { wch: 20 }, // Clergy Type
      { wch: 15 }, // Marital Status
      { wch: 10 }, // Gender
      { wch: 30 }, // Council (expanded to fit longer names)
      { wch: 20 }, // Area
      { wch: 20 }, // Occupation
      { wch: 15 }, // Country
      { wch: 25 }, // Email
      { wch: 18 }, // Contact Number
      { wch: 25 }, // Church ID
      { wch: 30 }, // Profile Image URL
      { wch: 10 }, // Status
    ];

    // Set column widths for reference sheets
    councilSheet["!cols"] = [{ wch: 40 }];
    ministrySheet["!cols"] = [{ wch: 40 }];
    glgcGroupSheet["!cols"] = [{ wch: 40 }];
    dancingStarsGroupSheet["!cols"] = [{ wch: 40 }];
    filmStarsGroupSheet["!cols"] = [{ wch: 40 }];
    praiseWorshipGroupSheet["!cols"] = [{ wch: 40 }];
    basontaSheet["!cols"] = [{ wch: 50 }];
    areasSheet["!cols"] = [{ wch: 25 }];
    clergyTypesSheet["!cols"] = [{ wch: 20 }, { wch: 50 }];
    maritalStatusSheet["!cols"] = [{ wch: 20 }];
    genderSheet["!cols"] = [{ wch: 15 }];
    statusSheet["!cols"] = [{ wch: 15 }];

    // Add data validations for dropdowns
    if (!worksheet["!dataValidation"]) worksheet["!dataValidation"] = [];

    // Clergy Type - Note: This shows all options, user can type comma-separated values
    const clergyTypes = "Bishop,Mother,Sister,Reverend,Pastor,Governor";

    // Marital Status dropdown (column G, row 2 onwards)
    worksheet["!dataValidation"].push({
      sqref: "G2:G1000",
      type: "list",
      formula1: '"Single,Married,Divorced,Widowed"',
      showErrorMessage: true,
      errorTitle: "Invalid Marital Status",
      error: "Please select from the dropdown list",
    });

    // Gender dropdown (column H)
    worksheet["!dataValidation"].push({
      sqref: "H2:H1000",
      type: "list",
      formula1: '"Male,Female"',
      showErrorMessage: true,
      errorTitle: "Invalid Gender",
      error: "Please select Male or Female",
    });

    // Council dropdown (column I) - Note: Too many options for dropdown, refer to reference sheets
    // Users should manually type from the reference sheets
    // Note: Excel has a limit on dropdown list length, so council options are in reference sheets

    // Area dropdown (column J)
    worksheet["!dataValidation"].push({
      sqref: "J2:J1000",
      type: "list",
      formula1:
        '"HGE Area 1,HGE Area 2,HGE Area 3,HGE Area 4,Experience Area 1,Experience Area 2,Experience Area 3,Experience Area 4,None"',
      showErrorMessage: true,
      errorTitle: "Invalid Area",
      error: "Please select from the dropdown list",
    });

    // Status dropdown (column Q)
    worksheet["!dataValidation"].push({
      sqref: "Q2:Q1000",
      type: "list",
      formula1: '"Active,Inactive"',
      showErrorMessage: true,
      errorTitle: "Invalid Status",
      error: "Please select from the dropdown list",
    });

    XLSX.writeFile(workbook, "pastors_upload_template.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
        alert("Please select an Excel file (.xlsx or .xls)");
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/pastors/bulk-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        if (data.data.successful > 0) {
          onSuccess();
        }
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset after dialog closes
    setTimeout(() => {
      resetUpload();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Pastors</DialogTitle>
          <DialogDescription>Upload an Excel file to create multiple pastors at once</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template Section */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 mt-0.5 text-primary" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Download Template</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Download the Excel template with the correct column headers and a sample row.
                </p>
                <Button onClick={downloadTemplate} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>
          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Instructions:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Download the template and fill in pastor details</li>
                <li>
                  <strong>Required fields:</strong> First Name, Last Name
                </li>
                <li>For Title, separate multiple types with commas (e.g., "Pastor,Governor")</li>
                <li>
                  <strong>Ministry Group:</strong> Check the "Ministry Groups Reference" sheet to see which groups
                  belong to each ministry
                </li>
                <li>
                  <strong>Occupation:</strong> You can type any occupation - not limited to dropdown options
                </li>
                <li>Date format: YYYY-MM-DD (e.g., 2020-06-01)</li>
                <li>Leave Church ID blank if you don't have it yet</li>
                <li>Status defaults to "Active" if not specified</li>
              </ul>
            </AlertDescription>
          </Alert>
          {/* File Upload Section */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="excel-upload"
            />
            {!file ? (
              <label htmlFor="excel-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Click to select Excel file</p>
                <p className="text-xs text-muted-foreground">Supports .xlsx and .xls files</p>
              </label>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <Button variant="ghost" size="sm" onClick={resetUpload} disabled={uploading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {/* Upload Button */}
          {file && !result && (
            <Button onClick={handleUpload} disabled={uploading} className="w-full">
              {uploading ? "Uploading..." : "Upload and Process"}
            </Button>
          )}
          {/* Results Section */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">{result.total}</p>
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                </div>
                <div className="border rounded-lg p-4 text-center bg-green-50 dark:bg-green-950">
                  <p className="text-2xl font-bold text-green-600">{result.successful}</p>
                  <p className="text-sm text-muted-foreground">Successful</p>
                </div>
                <div className="border rounded-lg p-4 text-center bg-red-50 dark:bg-red-950">
                  <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>

              {result.successful > 0 && (
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Successfully created {result.successful} pastor{result.successful > 1 ? "s" : ""}!
                  </AlertDescription>
                </Alert>
              )}

              {result.errors.length > 0 && (
                <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950">
                  <h4 className="font-semibold mb-3 text-red-800 dark:text-red-200">Errors ({result.errors.length})</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {result.errors.map((error, index) => (
                      <div key={index} className="text-sm border-b pb-2 last:border-0">
                        <p className="font-medium text-red-700 dark:text-red-300">Row {error.row}:</p>
                        <p className="text-red-600 dark:text-red-400">{error.error}</p>
                        {error.data && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {error.data["First Name"] || error.data["first_name"]}{" "}
                            {error.data["Last Name"] || error.data["last_name"]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={resetUpload} variant="outline" className="flex-1">
                  Upload Another File
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

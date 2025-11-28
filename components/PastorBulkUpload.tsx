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
        "Clergy Type": "Pastor,Reverend",
        "Marital Status": "Married",
        Gender: "Male",
        Council: "Philippians",
        Area: "HGE Area 1",
        Ministry: "GLGC",
        "Ministry Group": "Many Are Called",
        Basonta: "School of the Word",
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

    // Create a reference sheet for ministry groups
    const referenceData = [
      {
        Ministry: "GLGC",
        "Ministry Groups":
          "Many Are Called, Love is Large, Peace and Love, True Love, Love Never Fails, Abundant Love, Steadfast Love, Perfect Love, Unfeigned Love, Love Is Patient, Everlasting Love, God So Loved",
      },
      {
        Ministry: "Dancing Stars",
        "Ministry Groups":
          "Eels on wheels, Spiders, Doves, Lizardos, Butterflies, Kangaroos, Impalas, Unicorns, Gazelles, Camels, Eagles, Lions, Dolphins",
      },
      {
        Ministry: "Film Stars",
        "Ministry Groups":
          "Actors Ministry, Props Ministry, Costume ministry, Make up, Protocol, Script writers, Social media, Technical, Love theatre company",
      },
      { Ministry: "Praise and Worship", "Ministry Groups": "Praise Stars, Worship Stars" },
    ];
    const referenceSheet = XLSX.utils.json_to_sheet(referenceData);

    XLSX.utils.book_append_sheet(workbook, worksheet, "Pastors");
    XLSX.utils.book_append_sheet(workbook, referenceSheet, "Ministry Groups Reference");

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
      { wch: 15 }, // Council
      { wch: 20 }, // Area
      { wch: 20 }, // Ministry
      { wch: 25 }, // Ministry Group
      { wch: 30 }, // Basonta
      { wch: 20 }, // Occupation
      { wch: 15 }, // Country
      { wch: 25 }, // Email
      { wch: 18 }, // Contact Number
      { wch: 25 }, // Church ID
      { wch: 30 }, // Profile Image URL
      { wch: 10 }, // Status
    ];

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

    // Council dropdown (column I)
    worksheet["!dataValidation"].push({
      sqref: "I2:I1000",
      type: "list",
      formula1: '"Philippians,Galatians,Colossians,2 Corinthians,Anagkazo,Ephesians,Signs and Wonders HGE,N/A"',
      showErrorMessage: true,
      errorTitle: "Invalid Council",
      error: "Please select from the dropdown list",
    });

    // Area dropdown (column J)
    worksheet["!dataValidation"].push({
      sqref: "J2:J1000",
      type: "list",
      formula1:
        '"HGE Area 1,HGE Area 2,HGE Area 3,HGE Area 4,Experience Area 1,Experience Area 2,Experience Area 3,Experience Area 4"',
      showErrorMessage: true,
      errorTitle: "Invalid Area",
      error: "Please select from the dropdown list",
    });

    // Ministry dropdown (column K)
    worksheet["!dataValidation"].push({
      sqref: "K2:K1000",
      type: "list",
      formula1: '"GLGC,Film Stars,Dancing Stars,Praise and Worship,N/A"',
      showErrorMessage: true,
      errorTitle: "Invalid Ministry",
      error: "Please select from the dropdown list",
    });

    // Ministry Group dropdown (column L) - Combined list with note to check reference sheet
    const ministryGroups = [
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
      "Praise Stars",
      "Worship Stars",
    ].join(",");

    worksheet["!dataValidation"].push({
      sqref: "L2:L1000",
      type: "list",
      formula1: `"${ministryGroups}"`,
      showErrorMessage: true,
      errorTitle: "Invalid Ministry Group",
      error: "Please select based on your Ministry (see 'Ministry Groups Reference' sheet)",
    });

    // Basonta dropdown (column M) - Very long list
    const basontaList = [
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
    ].join(",");

    worksheet["!dataValidation"].push({
      sqref: "M2:M1000",
      type: "list",
      formula1: `"${basontaList}"`,
      showErrorMessage: true,
      errorTitle: "Invalid Basonta",
      error: "Please select from the dropdown list",
    });

    // Status dropdown (column T)
    worksheet["!dataValidation"].push({
      sqref: "T2:T1000",
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
          Bulk Upload
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
                <li>For Clergy Type, separate multiple types with commas (e.g., "Pastor,Reverend")</li>
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

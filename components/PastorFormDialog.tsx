"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/ImageUpload";
import SearchableSelect from "@/components/ui/searchable-select";
import MultiSelect from "@/components/ui/multi-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  Pastor,
  ClergyType,
  MaritalStatus,
  Gender,
  Council,
  Area,
  Status,
  Occupation,
  PastorFunction,
} from "@/types/entities";
import ChurchFormDialog from "@/components/ChurchFormDialog";
import ReactSelect from "react-select";

interface PastorFormDialogProps {
  pastor?: Pastor;
  onSuccess?: () => void;
}

const clergyTypes: ClergyType[] = ["Bishop", "Mother", "Sister", "Reverend", "Pastor", "Governor"];
const areas: Area[] = [
  "HGE Area 1",
  "HGE Area 2",
  "HGE Area 3",
  "HGE Area 4",
  "Experience Area 1",
  "Experience Area 2",
  "Experience Area 3",
  "Experience Area 4",
  "None",
];
const statuses: Status[] = ["Active", "Inactive"];
const pastorFunctions: PastorFunction[] = ["Governor", "Overseer", "N/A"];
const occupations: Occupation[] = [
  "Full Time Pastor",
  "Medical Doctor",
  "Lawyer",
  "Engineer",
  "Accountant",
  "Pharmacist",
  "Student",
  "Other",
];

const councils: Council[] = [
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
];

const maritalStatuses: MaritalStatus[] = ["Single", "Married", "Divorced", "Widowed"];
const genders: Gender[] = ["Male", "Female"];

export default function PastorFormDialog({ pastor, onSuccess }: PastorFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [churches, setChurches] = useState<any[]>([]);
  const [loadingChurches, setLoadingChurches] = useState(true);
  const [countries, setCountries] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [formData, setFormData] = useState({
    first_name: pastor?.first_name || "",
    middle_name: pastor?.middle_name || "",
    last_name: pastor?.last_name || "",
    date_of_birth: pastor?.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
    date_of_appointment: pastor?.date_of_appointment
      ? new Date(pastor.date_of_appointment).toISOString().split("T")[0]
      : "",
    profile_image: pastor?.profile_image || "",
    clergy_type: pastor?.clergy_type || ["Pastor"],
    marital_status: pastor?.marital_status || "Single",
    church: pastor?.church || "",
    gender: pastor?.gender || "Male",
    council: pastor?.council || "",
    area: pastor?.area || "",
    occupation: pastor?.occupation || "Medical Doctor",
    country: pastor?.country || "",
    email: pastor?.email || "",
    contact_number: pastor?.contact_number || "",
    status: pastor?.status || "Active",
    function: pastor?.function || "N/A",
  });
  const [occupationType, setOccupationType] = useState<Occupation>(
    pastor?.occupation && occupations.includes(pastor.occupation as Occupation)
      ? (pastor.occupation as Occupation)
      : pastor?.occupation
      ? "Other"
      : "Medical Doctor"
  );
  const [customOccupation, setCustomOccupation] = useState(
    pastor?.occupation && !occupations.includes(pastor.occupation as Occupation) ? pastor.occupation : ""
  );

  // Fetch churches when dialog opens
  useEffect(() => {
    if (open) {
      fetchChurches();
      fetchCountries();
    }
  }, [open]);

  const fetchChurches = async () => {
    try {
      setLoadingChurches(true);
      const response = await fetch("/api/churches");
      const data = await response.json();
      if (data.success) {
        setChurches(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch churches:", error);
      toast.error("Failed to load churches. Please try again.", {
        style: {
          background: "#7f1d1d",
          border: "1px solid #991b1b",
          color: "#fef2f2",
        },
      });
    } finally {
      setLoadingChurches(false);
    }
  };

  const fetchCountries = async () => {
    try {
      setLoadingCountries(true);
      const response = await fetch("https://restcountries.com/v3.1/all?fields=name");
      const data = await response.json();
      const countryNames = data
        .map((country: any) => country.name.common)
        .sort((a: string, b: string) => a.localeCompare(b));
      setCountries(countryNames);
    } catch (error) {
      console.error("Failed to fetch countries:", error);
      toast.error("Failed to load countries. Using fallback list.", {
        style: {
          background: "#7f1d1d",
          border: "1px solid #991b1b",
          color: "#fef2f2",
        },
      });
      // Fallback to a basic list if API fails
      setCountries([
        "Ghana",
        "Nigeria",
        "United States",
        "United Kingdom",
        "Canada",
        "South Africa",
        "Kenya",
        "Uganda",
      ]);
    } finally {
      setLoadingCountries(false);
    }
  };

  // Update form data when pastor prop changes or dialog opens
  useEffect(() => {
    if (open && pastor) {
      const isStandardOccupation = occupations.includes(pastor.occupation as Occupation);
      setOccupationType(isStandardOccupation ? (pastor.occupation as Occupation) : "Other");
      setCustomOccupation(isStandardOccupation ? "" : pastor.occupation || "");

      setFormData({
        first_name: pastor.first_name || "",
        middle_name: pastor.middle_name || "",
        last_name: pastor.last_name || "",
        date_of_birth: pastor.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
        date_of_appointment: pastor.date_of_appointment
          ? new Date(pastor.date_of_appointment).toISOString().split("T")[0]
          : "",
        profile_image: pastor.profile_image || "",
        clergy_type: pastor.clergy_type || ["Pastor"],
        marital_status: pastor.marital_status || "Single",
        church: pastor.church || "",
        gender: pastor.gender || "Male",
        council: pastor.council || "",
        area: pastor.area || "",
        occupation: pastor.occupation || "Medical Doctor",
        country: pastor.country || "",
        email: pastor.email || "",
        contact_number: pastor.contact_number || "",
        status: pastor.status || "Active",
        function: pastor.function || "N/A",
      });
    }
  }, [open, pastor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = pastor ? `/api/pastors/${pastor.id}` : "/api/pastors";
      const method = pastor ? "PUT" : "POST";

      const submissionData = {
        ...formData,
        occupation: occupationType === "Other" ? customOccupation : occupationType,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        setOpen(false);
        router.refresh();
        toast.success(pastor ? "Pastor updated successfully" : "Pastor created successfully");
        if (onSuccess) onSuccess();
        // Reset form for create mode
        if (!pastor) {
          setFormData({
            first_name: "",
            middle_name: "",
            last_name: "",
            date_of_birth: "",
            date_of_appointment: "",
            profile_image: "",
            clergy_type: ["Pastor"],
            marital_status: "Single",
            church: "",
            gender: "Male",
            council: "",
            area: "",
            occupation: "Medical Doctor",
            country: "",
            email: "",
            contact_number: "",
            status: "Active",
            function: "N/A",
          });
          setOccupationType("Medical Doctor");
          setCustomOccupation("");
        }
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save pastor. Please try again.", {
          style: {
            background: "#7f1d1d",
            border: "1px solid #991b1b",
            color: "#fef2f2",
          },
        });
      }
    } catch (error) {
      console.error("Failed to save pastor:", error);
      toast.error("An unexpected error occurred. Please try again.", {
        style: {
          background: "#7f1d1d",
          border: "1px solid #991b1b",
          color: "#fef2f2",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChurchCreated = async (churchId?: string) => {
    await fetchChurches();
    if (churchId) {
      setFormData({ ...formData, church: churchId });
    }
  };

  // Get appointment date label based on clergy type
  const getAppointmentDateLabel = () => {
    const types = formData.clergy_type || [];

    // Check for Bishops, Mothers, or Sisters first (Date of Consecration)
    if (types.includes("Bishop") || types.includes("Mother") || types.includes("Sister")) {
      return "Date of Consecration";
    }
    // Then check for Reverend (Date of Ordination)
    else if (types.includes("Reverend")) {
      return "Date of Ordination";
    }
    // Default for Pastor and Governor (Date of Appointment)
    else if (types.includes("Pastor") || types.includes("Governor")) {
      return "Date of Appointment";
    }

    return "Date of Appointment";
  };

  // Validate clergy type selection
  const handleClergyTypeChange = (selectedValues: string[]) => {
    // Require at least one title
    if (selectedValues.length === 0) {
      toast.error("Please select at least one title", {
        style: {
          background: "#7f1d1d",
          border: "1px solid #991b1b",
          color: "#fef2f2",
        },
      });
      return;
    }

    // Allow maximum of 2 titles
    if (selectedValues.length > 2) {
      toast.error("A pastor can have a maximum of 2 titles", {
        style: {
          background: "#7f1d1d",
          border: "1px solid #991b1b",
          color: "#fef2f2",
        },
      });
      return;
    }

    // If there are 2 titles, one must be Governor
    if (selectedValues.length === 2 && !selectedValues.includes("Governor")) {
      toast.error("If a pastor has 2 titles, one must be Governor", {
        style: {
          background: "#7f1d1d",
          border: "1px solid #991b1b",
          color: "#fef2f2",
        },
      });
      return;
    }

    setFormData({ ...formData, clergy_type: selectedValues as ClergyType[] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {pastor ? (
          <Button
            variant="outline"
            size="sm"
            className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
          >
            Edit
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pastor ? "Edit Pastor Details" : "Add New Pastor"}</DialogTitle>
          <DialogDescription>{pastor ? "Update pastor information" : "Create a new pastor entry"}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  value={formData.middle_name}
                  onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                  placeholder="Paul"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="MacArthur"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <SearchableSelect
                  options={genders.map((g) => ({ value: g, label: g }))}
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value as Gender })}
                  placeholder="Select gender"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clergy_type">Title (Required) *</Label>
                <MultiSelect
                  options={clergyTypes.map((t) => ({ value: t, label: t }))}
                  value={formData.clergy_type}
                  onValueChange={handleClergyTypeChange}
                  placeholder="Select title(s)"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_appointment">{getAppointmentDateLabel()}</Label>
                <Input
                  id="date_of_appointment"
                  type="date"
                  value={formData.date_of_appointment}
                  onChange={(e) => setFormData({ ...formData, date_of_appointment: e.target.value })}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <SearchableSelect
                  options={occupations.map((o) => ({ value: o, label: o }))}
                  value={occupationType}
                  onValueChange={(value) => {
                    setOccupationType(value as Occupation);
                    if (value !== "Other") {
                      setFormData({ ...formData, occupation: value });
                      setCustomOccupation("");
                    }
                  }}
                  placeholder="Select occupation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marital_status">Marital Status</Label>
                <SearchableSelect
                  options={maritalStatuses.map((s) => ({ value: s, label: s }))}
                  value={formData.marital_status}
                  onValueChange={(value) => setFormData({ ...formData, marital_status: value as MaritalStatus })}
                  placeholder="Select status"
                />
              </div>
            </div>

            {occupationType === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="custom_occupation">Specify Occupation</Label>
                <Input
                  id="custom_occupation"
                  value={customOccupation}
                  onChange={(e) => {
                    setCustomOccupation(e.target.value);
                    setFormData({ ...formData, occupation: e.target.value });
                  }}
                  placeholder="Enter occupation"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="council">Council *</Label>
                <SearchableSelect
                  options={councils.map((c) => ({ value: c, label: c }))}
                  value={formData.council}
                  onValueChange={(value) => {
                    // Auto-select area based on council selection
                    let newArea = formData.area;

                    // HGE related councils get HGE Area 1
                    if (value === "Signs and Wonders HGE" || value.includes("HGE") || value.startsWith("HGE ")) {
                      newArea = "HGE Area 1";
                    }
                    // Experience related councils (original councils) get Experience Area 2
                    else if (
                      value === "Philippians" ||
                      value === "Galatians" ||
                      value === "Colossians" ||
                      value === "2 Corinthians" ||
                      value === "Anagkazo" ||
                      value === "Ephesians"
                    ) {
                      newArea = "Experience Area 2";
                    }
                    // For None and other councils, keep current area

                    setFormData({ ...formData, council: value as Council, area: newArea });
                  }}
                  placeholder="Select council"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Area *</Label>
                <SearchableSelect
                  options={areas.map((a) => ({ value: a, label: a }))}
                  value={formData.area}
                  onValueChange={(value) => setFormData({ ...formData, area: value as Area })}
                  placeholder="Select area"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                {loadingCountries ? (
                  <div className="flex items-center justify-center h-10 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <SearchableSelect
                    options={countries.map((c) => ({ value: c, label: c }))}
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                    placeholder="Select a country"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="pastor@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="church">Campus</Label>
              {loadingChurches ? (
                <div className="flex items-center justify-center h-10 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : churches.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">No churches available. Please add a church first.</p>
                  <ChurchFormDialog onSuccess={handleChurchCreated}>
                    <Button type="button" variant="outline" className="w-full gap-2">
                      <Building2 className="h-4 w-4" />
                      Add Church
                    </Button>
                  </ChurchFormDialog>
                </div>
              ) : (
                <div className="flex gap-2">
                  <SearchableSelect
                    options={churches.map((church) => ({
                      value: church._id,
                      label: `${church.name} - ${church.location}`,
                    }))}
                    value={formData.church}
                    onValueChange={(value) => setFormData({ ...formData, church: value })}
                    placeholder="Select a campus"
                    className="flex-1"
                  />
                  <ChurchFormDialog onSuccess={handleChurchCreated}>
                    <Button type="button" variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </ChurchFormDialog>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="function">Function *</Label>
                <SearchableSelect
                  options={pastorFunctions.map((f) => ({ value: f, label: f }))}
                  value={formData.function}
                  onValueChange={(value) => setFormData({ ...formData, function: value as PastorFunction })}
                  placeholder="Select function"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_number">Contact Number</Label>
                <Input
                  id="contact_number"
                  type="tel"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  placeholder="+233 123 456 789"
                />
              </div>
            </div>

            {pastor && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <SearchableSelect
                  options={statuses.map((s) => ({ value: s, label: s }))}
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as Status })}
                  placeholder="Select status"
                />
              </div>
            )}

            <ImageUpload
              label="Profile Image"
              value={formData.profile_image}
              onChange={(url) => setFormData({ ...formData, profile_image: url as string })}
              multiple={false}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pastor ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

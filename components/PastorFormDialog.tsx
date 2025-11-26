"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/ImageUpload";
import SearchableSelect from "@/components/ui/searchable-select";
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
import { Pastor, ClergyType, MaritalStatus, Gender, Council, Occupation } from "@/types/entities";
import ChurchFormDialog from "@/components/ChurchFormDialog";

interface PastorFormDialogProps {
  pastor?: Pastor;
  onSuccess?: () => void;
}

const clergyTypes: ClergyType[] = ["Bishop", "Mother", "Sister", "Reverend", "Pastor"];

const maritalStatuses: MaritalStatus[] = ["Single", "Married", "Divorced", "Widowed"];
const genders: Gender[] = ["Male", "Female"];
const councils: Council[] = ["Philippians", "Galatians", "2 Corinthians", "Anagkazo", "Area 1", "Area 3", "Area 4"];
const occupations: Occupation[] = ["Medical Doctor", "Lawyer", "Engineer", "Accountant", "Pharmacist", "Other"];

export default function PastorFormDialog({ pastor, onSuccess }: PastorFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [churches, setChurches] = useState<any[]>([]);
  const [loadingChurches, setLoadingChurches] = useState(true);
  const [countries, setCountries] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [formData, setFormData] = useState({
    name: pastor?.name || "",
    date_of_birth: pastor?.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
    position: pastor?.position || "",
    profile_image: pastor?.profile_image || "",
    clergy_type: pastor?.clergy_type || "Pastor",
    marital_status: pastor?.marital_status || "Single",
    church: pastor?.church || "",
    gender: pastor?.gender || "Male",
    council: pastor?.council || "Philippians",
    occupation: pastor?.occupation || "Medical Doctor",
    country: pastor?.country || "",
    phone_number: pastor?.phone_number || "",
    whatsapp_number: pastor?.whatsapp_number || "",
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
      setCustomOccupation(isStandardOccupation ? "" : pastor.occupation);

      setFormData({
        name: pastor.name || "",
        date_of_birth: pastor.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
        position: pastor.position || "",
        profile_image: pastor.profile_image || "",
        clergy_type: pastor.clergy_type || "Pastor",
        marital_status: pastor.marital_status || "Single",
        church: pastor.church || "",
        gender: pastor.gender || "Male",
        council: pastor.council || "Philippians",
        occupation: pastor.occupation || "Medical Doctor",
        country: pastor.country || "",
        phone_number: pastor.phone_number || "",
        whatsapp_number: pastor.whatsapp_number || "",
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
        if (onSuccess) onSuccess();
        // Reset form for create mode
        if (!pastor) {
          setFormData({
            name: "",
            date_of_birth: "",
            position: "",
            profile_image: "",
            clergy_type: "Pastor",
            marital_status: "Single",
            church: "",
            gender: "Male",
            council: "Philippians",
            occupation: "Medical Doctor",
            country: "",
            phone_number: "",
            whatsapp_number: "",
          });
          setOccupationType("Medical Doctor");
          setCustomOccupation("");
        }
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Failed to save pastor");
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {pastor ? (
          <Button variant="outline" size="sm">
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
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John MacArthur"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  required
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
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
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Senior Pastor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation *</Label>
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
            </div>

            {occupationType === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="custom_occupation">Specify Occupation *</Label>
                <Input
                  id="custom_occupation"
                  required
                  value={customOccupation}
                  onChange={(e) => {
                    setCustomOccupation(e.target.value);
                    setFormData({ ...formData, occupation: e.target.value });
                  }}
                  placeholder="Enter occupation"
                />
              </div>
            )}

            <ImageUpload
              label="Profile Image"
              value={formData.profile_image}
              onChange={(url) => setFormData({ ...formData, profile_image: url as string })}
              multiple={false}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clergy_type">Pastor Title *</Label>
                <SearchableSelect
                  options={clergyTypes.map((t) => ({ value: t, label: t }))}
                  value={formData.clergy_type}
                  onValueChange={(value) => setFormData({ ...formData, clergy_type: value as ClergyType })}
                  placeholder="Select title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marital_status">Marital Status *</Label>
                <SearchableSelect
                  options={maritalStatuses.map((s) => ({ value: s, label: s }))}
                  value={formData.marital_status}
                  onValueChange={(value) => setFormData({ ...formData, marital_status: value as MaritalStatus })}
                  placeholder="Select status"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="council">Council *</Label>
                <SearchableSelect
                  options={councils.map((c) => ({ value: c, label: c }))}
                  value={formData.council}
                  onValueChange={(value) => setFormData({ ...formData, council: value as Council })}
                  placeholder="Select council"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number *</Label>
                <Input
                  id="phone_number"
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+233 123 456 789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp Number *</Label>
                <Input
                  id="whatsapp_number"
                  type="tel"
                  required
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  placeholder="+233 123 456 789"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="church">Church *</Label>
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
                    placeholder="Select a church"
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || churches.length === 0 || !formData.country}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pastor ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

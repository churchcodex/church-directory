"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/ImageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Pastor, ClergyType, MaritalStatus } from "@/types/entities";
import ChurchFormDialog from "@/components/ChurchFormDialog";

interface PastorFormDialogProps {
  pastor?: Pastor;
  onSuccess?: () => void;
}

const clergyTypes: ClergyType[] = ["Bishop", "Mother", "Sister", "Reverend", "Pastor", "Basonta Leader", "Governor"];
const maritalStatuses: MaritalStatus[] = ["Single", "Married", "Divorced", "Widowed"];

export default function PastorFormDialog({ pastor, onSuccess }: PastorFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [churches, setChurches] = useState<any[]>([]);
  const [loadingChurches, setLoadingChurches] = useState(true);
  const [formData, setFormData] = useState({
    name: pastor?.name || "",
    date_of_birth: pastor?.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
    position: pastor?.position || "",
    profile_image: pastor?.profile_image || "",
    clergy_type: pastor?.clergy_type || "Pastor",
    marital_status: pastor?.marital_status || "Single",
    church: pastor?.church || "",
  });

  // Fetch churches when dialog opens
  useEffect(() => {
    if (open) {
      fetchChurches();
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

  // Update form data when pastor prop changes or dialog opens
  useEffect(() => {
    if (open && pastor) {
      setFormData({
        name: pastor.name || "",
        date_of_birth: pastor.date_of_birth ? new Date(pastor.date_of_birth).toISOString().split("T")[0] : "",
        position: pastor.position || "",
        profile_image: pastor.profile_image || "",
        clergy_type: pastor.clergy_type || "Pastor",
        marital_status: pastor.marital_status || "Single",
        church: pastor.church || "",
      });
    }
  }, [open, pastor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = pastor ? `/api/pastors/${pastor.id}` : "/api/pastors";
      const method = pastor ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
          });
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
            Add Clergy
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pastor ? "Edit Clergy" : "Add New Clergy"}</DialogTitle>
          <DialogDescription>{pastor ? "Update clergy information" : "Create a new clergy entry"}</DialogDescription>
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
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Senior Pastor"
                />
              </div>
            </div>

            <ImageUpload
              label="Profile Image"
              value={formData.profile_image}
              onChange={(url) => setFormData({ ...formData, profile_image: url as string })}
              multiple={false}
            />

            <div className="space-y-2">
              <Label htmlFor="clergy_type">Clergy Type *</Label>
              <Select
                value={formData.clergy_type}
                onValueChange={(value) => setFormData({ ...formData, clergy_type: value as ClergyType })}
              >
                <SelectTrigger id="clergy_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {clergyTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marital_status">Marital Status *</Label>
              <Select
                value={formData.marital_status}
                onValueChange={(value) => setFormData({ ...formData, marital_status: value as MaritalStatus })}
              >
                <SelectTrigger id="marital_status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {maritalStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <ChurchFormDialog onSuccess={fetchChurches}>
                    <Button type="button" variant="outline" className="w-full gap-2">
                      <Building2 className="h-4 w-4" />
                      Add Church
                    </Button>
                  </ChurchFormDialog>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={formData.church}
                    onValueChange={(value) => setFormData({ ...formData, church: value })}
                  >
                    <SelectTrigger id="church" className="w-full">
                      <SelectValue placeholder="Select a church" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {churches.map((church) => (
                        <SelectItem key={church._id} value={church._id}>
                          {church.name} - {church.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ChurchFormDialog onSuccess={fetchChurches}>
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
            <Button type="submit" disabled={loading || churches.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pastor ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

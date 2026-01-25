"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Loader2 } from "lucide-react";
import { Church, Pastor } from "@/types/entities";

interface ChurchFormDialogProps {
  church?: Church;
  onSuccess?: (churchId?: string) => void;
  children?: React.ReactNode;
}

export default function ChurchFormDialog({ church, onSuccess, children }: ChurchFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pastors, setPastors] = useState<Pastor[]>([]);
  const [pastorsLoading, setPastorsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: church?.name || "",
    location: church?.location || "",
    head_pastor: church?.head_pastor || "",
    members: church?.members || 0,
    income: church?.income || 0,
    images: church?.images || [],
  });

  useEffect(() => {
    if (open) {
      fetchPastors();
    }
  }, [open]);

  const fetchPastors = async () => {
    setPastorsLoading(true);
    try {
      const response = await fetch("/api/pastors");
      const data = await response.json();
      if (data.success) {
        setPastors(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch pastors:", error);
    } finally {
      setPastorsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    try {
      const payload = {
        ...formData,
      };

      const url = church ? `/api/churches/${church.id}` : "/api/churches";
      const method = church ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setOpen(false);
        router.refresh();
        const responseData = await response.json();
        const createdChurchId = responseData.data?._id || responseData.data?.id;
        if (onSuccess) onSuccess(createdChurchId);
        // Reset form for create mode
        if (!church) {
          setFormData({
            name: "",
            location: "",
            head_pastor: "",
            members: 0,
            income: 0,
            images: [],
          });
        }
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert("Failed to save church");
    } finally {
      setLoading(false);
    }
  };

  const pastorOptions = pastors.map((pastor) => ({
    value: pastor.id,
    label: `${pastor.first_name} ${pastor.middle_name || ""} ${pastor.last_name}`.trim(),
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ||
          (church ? (
            <Button variant="outline" size="sm">
              Edit
            </Button>
          ) : (
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
            </Button>
          ))}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{church ? "Edit Church" : "Add New Church"}</DialogTitle>
          <DialogDescription>{church ? "Update church information" : "Create a new church entry"}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Church Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Grace Community Church"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Los Angeles, CA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="head_pastor">Head Pastor *</Label>
              <SearchableSelect
                placeholder={pastorsLoading ? "Loading pastors..." : "Select a pastor"}
                options={pastorOptions}
                value={formData.head_pastor}
                onValueChange={(value) => setFormData({ ...formData, head_pastor: value })}
                isDisabled={pastorsLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="members">Members *</Label>
                <Input
                  id="members"
                  type="number"
                  required
                  min="0"
                  value={formData.members}
                  onChange={(e) => setFormData({ ...formData, members: parseInt(e.target.value) || 0 })}
                  placeholder="8500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="income">Annual Income *</Label>
                <Input
                  id="income"
                  type="number"
                  required
                  min="0"
                  value={formData.income}
                  onChange={(e) => setFormData({ ...formData, income: parseInt(e.target.value) || 0 })}
                  placeholder="12500000"
                />
              </div>
            </div>

            <ImageUpload
              label="Church Images"
              value={formData.images}
              onChange={(urls) => setFormData({ ...formData, images: urls as string[] })}
              multiple
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {church ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

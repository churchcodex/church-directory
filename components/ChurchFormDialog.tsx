"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/ImageUpload";
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
import { Church } from "@/types/entities";

interface ChurchFormDialogProps {
  church?: Church;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export default function ChurchFormDialog({ church, onSuccess, children }: ChurchFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: church?.name || "",
    location: church?.location || "",
    head_pastor: church?.head_pastor || "",
    members: church?.members || 0,
    income: church?.income || 0,
    images: church?.images || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        if (onSuccess) onSuccess();
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
              Add Church
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
              <Input
                id="head_pastor"
                required
                value={formData.head_pastor}
                onChange={(e) => setFormData({ ...formData, head_pastor: e.target.value })}
                placeholder="John MacArthur"
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
            <Button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {church ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

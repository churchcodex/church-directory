"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, RotateCcw, X } from "lucide-react";

interface FieldOption {
  fieldName: string;
  options: string[];
  updatedAt?: string;
  isDefault: boolean;
}

const fieldLabels: Record<string, string> = {
  clergyTypes: "Titles",
  areas: "Areas",
  councils: "Councils",
  occupations: "Occupations",
  maritalStatuses: "Marital Statuses",
  genders: "Genders",
  statuses: "Statuses",
  pastorFunctions: "Functions",
};

export default function PastorFieldsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fieldOptions, setFieldOptions] = useState<Record<string, FieldOption>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [editingOptions, setEditingOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [fieldToReset, setFieldToReset] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && (session?.user as any)?.role !== "admin") {
      router.push("/");
      toast.error("Admin access required");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.role === "admin") {
      fetchFieldOptions();
    }
  }, [status, session]);

  const fetchFieldOptions = async () => {
    try {
      const response = await fetch("/api/pastor-fields");
      const data = await response.json();
      if (response.ok) {
        setFieldOptions(data.data);
      } else {
        toast.error("Failed to fetch field options");
      }
    } catch (error) {
      toast.error("Failed to fetch field options");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditField = (fieldName: string) => {
    setSelectedField(fieldName);
    setEditingOptions([...fieldOptions[fieldName].options]);
    setNewOption("");
  };

  const handleAddOption = () => {
    if (!newOption.trim()) {
      toast.error("Please enter an option value");
      return;
    }

    if (editingOptions.includes(newOption.trim())) {
      toast.error("This option already exists");
      return;
    }

    setEditingOptions([...editingOptions, newOption.trim()]);
    setNewOption("");
  };

  const handleRemoveOption = (index: number) => {
    setEditingOptions(editingOptions.filter((_, i) => i !== index));
  };

  const handleSaveOptions = async () => {
    if (!selectedField) return;

    if (editingOptions.length === 0) {
      toast.error("At least one option is required");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/pastor-fields", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fieldName: selectedField,
          options: editingOptions,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Field options updated successfully");
        await fetchFieldOptions();
        setSelectedField(null);
        setEditingOptions([]);
      } else {
        toast.error(data.error || "Failed to update field options");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetField = async () => {
    if (!fieldToReset) return;

    try {
      const response = await fetch(`/api/pastor-fields?fieldName=${fieldToReset}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Field options reset to defaults");
        await fetchFieldOptions();
        if (selectedField === fieldToReset) {
          setSelectedField(null);
          setEditingOptions([]);
        }
      } else {
        toast.error(data.error || "Failed to reset field options");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setFieldToReset(null);
    }
  };

  const handleCancel = () => {
    setSelectedField(null);
    setEditingOptions([]);
    setNewOption("");
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if ((session?.user as any)?.role !== "admin") {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pastor Field Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage available options for pastor entity fields</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/users")}>
          Back to Users
        </Button>
      </div>

      {selectedField ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit {fieldLabels[selectedField]}</CardTitle>
            <CardDescription>Add, remove, or reorder options for this field</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="newOption">Add New Option</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="newOption"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Enter new option"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                  />
                  <Button onClick={handleAddOption} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label>Current Options ({editingOptions.length})</Label>
              <div className="mt-2 space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
                {editingOptions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No options available</p>
                ) : (
                  editingOptions.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <span>{option}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSaveOptions} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(fieldOptions).map(([fieldName, field]) => (
            <Card key={fieldName}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{fieldLabels[fieldName]}</CardTitle>
                  {field.isDefault ? (
                    <Badge variant="secondary">Default</Badge>
                  ) : (
                    <Badge variant="default">Custom</Badge>
                  )}
                </div>
                <CardDescription>
                  {field.options.length} option{field.options.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-32 overflow-y-auto border rounded p-2">
                  <div className="flex flex-wrap gap-1">
                    {field.options.slice(0, 10).map((option, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {option}
                      </Badge>
                    ))}
                    {field.options.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{field.options.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditField(fieldName)} className="flex-1">
                    Edit Options
                  </Button>
                  {!field.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFieldToReset(fieldName)}
                      className="text-orange-500 hover:text-orange-700"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reset Field Confirmation Dialog */}
      <AlertDialog open={!!fieldToReset} onOpenChange={() => setFieldToReset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Defaults</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset {fieldToReset ? fieldLabels[fieldToReset] : ""} to default values? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetField}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

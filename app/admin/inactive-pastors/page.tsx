"use client";

import { useEffect, useState } from "react";
import { Pastor } from "@/types/entities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { RefreshCw, Trash2, Loader2, ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import Image from "next/image";
import { calculateAge } from "@/lib/utils";

export default function InactivePastorsPage() {
  const router = useRouter();
  const [pastors, setPastors] = useState<Pastor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchInactivePastors();
  }, []);

  const fetchInactivePastors = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/pastors/inactive");
      const data = await response.json();
      if (data.success) {
        setPastors(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch inactive pastors:", error);
      toast.error("Failed to fetch inactive pastors");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/pastors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Active" }),
      });

      if (response.ok) {
        toast.success("Pastor restored successfully");
        fetchInactivePastors();
      } else {
        const data = await response.json();
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      toast.error("Failed to restore pastor");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/pastors/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Pastor permanently deleted");
        fetchInactivePastors();
      } else {
        const data = await response.json();
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      toast.error("Failed to delete pastor");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading inactive pastors...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20 py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-2 md:gap-3 mb-6">
          <div className="flex justify-start">
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2 md:gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">Inactive Pastors</h1>
            <Badge variant="secondary" className="text-sm md:text-base px-3 py-2 md:px-4">
              {pastors.length} Inactive
            </Badge>
          </div>
        </div>

        {pastors.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center">
            <p className="text-muted-foreground text-base sm:text-lg">No inactive pastors found</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {pastors.map((pastor) => (
              <Card key={pastor.id} className="overflow-hidden">
                <div className="relative h-48 w-full">
                  {pastor.profile_image ? (
                    <Image
                      src={pastor.profile_image}
                      alt={[pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ")}
                      fill
                      className="object-cover object-top"
                      unoptimized={pastor.profile_image.includes("fl-admin-apps.s3.eu-west-2.amazonaws.com")}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-avatar.png";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <div className="text-muted-foreground text-4xl font-bold">
                        {pastor.first_name?.[0]}
                        {pastor.last_name?.[0]}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg truncate">
                      {[pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ")}
                    </h3>
                    {pastor.clergy_type && pastor.clergy_type.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {Array.isArray(pastor.clergy_type) ? pastor.clergy_type.join(" • ") : pastor.clergy_type}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {pastor.date_of_birth && (
                      <p className="text-muted-foreground">{calculateAge(pastor.date_of_birth)} years old</p>
                    )}
                    {(() => {
                      const councils = Array.isArray(pastor.council)
                        ? pastor.council
                        : pastor.council
                          ? [pastor.council]
                          : [];
                      const visibleCouncils = councils.filter((c) => c && c !== "None");
                      if (visibleCouncils.length === 0) return null;
                      return (
                        <p className="text-muted-foreground">
                          {visibleCouncils.join(" • ")} Council{visibleCouncils.length > 1 ? "s" : ""}
                        </p>
                      );
                    })()}
                  </div>

                  <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                    <Button
                      variant="outline"
                      className="w-full sm:flex-1 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                      onClick={() => handleRestore(pastor.id)}
                      disabled={actionLoading === pastor.id}
                    >
                      {actionLoading === pastor.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Restore
                        </>
                      )}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full sm:flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                          disabled={actionLoading === pastor.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Permanently Delete Pastor?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to permanently delete{" "}
                            <strong>
                              {[pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ")}
                            </strong>
                            ? This action cannot be undone and will remove all their information from the system.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(pastor.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            {actionLoading === pastor.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Permanently Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

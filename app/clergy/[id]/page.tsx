"use client";

import { useEffect, useState } from "react";
import { Pastor } from "@/types/entities";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PastorFormDialog from "@/components/PastorFormDialog";
import DeactivateButton from "@/components/DeactivateButton";
import DeleteButton from "@/components/DeleteButton";
import {
  Heart,
  Briefcase,
  ArrowLeft,
  Calendar,
  Church,
  User,
  Globe,
  Users,
  Award,
  Phone,
  Activity,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { calculateAge } from "@/lib/utils";

export default function ClergyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [pastor, setPastor] = useState<Pastor | null>(null);
  const [churchName, setChurchName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Smooth scroll to top when page loads
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (params.id) {
      fetchPastor(params.id as string);
    }
  }, [params.id]);

  const fetchPastor = async (id: string) => {
    try {
      const response = await fetch(`/api/pastors/${id}`);
      const data = await response.json();
      if (data.success) {
        setPastor(data.data);
        // Fetch church name only if church ID exists and is valid
        if (data.data.church && data.data.church.trim() !== "") {
          fetchChurch(data.data.church);
        } else {
          setChurchName("No Church Assigned");
        }
      }
    } catch (error) {
      console.error("Failed to fetch pastor:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChurch = async (churchId: string) => {
    try {
      const response = await fetch(`/api/churches/${churchId}`);
      const data = await response.json();
      if (data.success) {
        setChurchName(data.data.name);
      }
    } catch (error) {
      console.error("Failed to fetch church:", error);
      setChurchName("Unknown Church");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-6">
            <div className="h-10 w-24 bg-muted rounded-md animate-pulse" />
            <div className="flex gap-2">
              <div className="h-10 w-20 bg-muted rounded-md animate-pulse" />
              <div className="h-10 w-20 bg-muted rounded-md animate-pulse" />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="md:flex">
              {/* Image Skeleton */}
              <div className="md:w-1/2">
                <div className="h-96 md:h-full w-full bg-muted animate-pulse" />
              </div>

              {/* Details Skeleton */}
              <div className="p-8 md:w-1/2 space-y-6">
                {/* Title Skeleton */}
                <div className="text-center space-y-2">
                  <div className="h-10 bg-muted rounded-md animate-pulse w-2/3 mx-auto" />
                </div>

                {/* Info Cards Skeleton */}
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <div key={i} className="p-4 bg-muted rounded-lg animate-pulse">
                      <div className="flex justify-between items-center">
                        <div className="h-5 w-32 bg-muted-foreground/20 rounded" />
                        <div className="h-6 w-40 bg-muted-foreground/20 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!pastor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Pastor not found</h2>
          <Button onClick={() => router.push("/clergy")}>Back to Clergy</Button>
        </div>
      </div>
    );
  }

  // Get appointment date label based on clergy type
  const getAppointmentDateLabel = () => {
    // Handle both string and array formats
    const types = Array.isArray(pastor.clergy_type)
      ? pastor.clergy_type
      : pastor.clergy_type
      ? [pastor.clergy_type]
      : [];
    if (types.includes("Pastor") || types.includes("Governor")) {
      return "Date of Appointment";
    } else if (types.includes("Bishop") || types.includes("Mother")) {
      return "Date of Consecration";
    } else if (types.includes("Reverend") || types.includes("Sister")) {
      return "Date of Ordination";
    }
    return "Date of Appointment";
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => router.push("/clergy")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {pastor && (
            <div className="flex gap-2">
              <PastorFormDialog pastor={pastor} onSuccess={() => fetchPastor(params.id as string)} />
              <DeactivateButton
                id={pastor.id}
                name={[pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ")}
                currentStatus={pastor.status}
                onSuccess={() => fetchPastor(params.id as string)}
              />
              <DeleteButton
                id={pastor.id}
                name={[pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ")}
                onSuccess={() => router.push("/clergy")}
              />
            </div>
          )}
        </div>

        <Card className="overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2">
              <div className="relative h-96 md:h-full w-full">
                <Image
                  src={pastor.profile_image || ""}
                  alt={[pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ")}
                  fill
                  className="object-cover object-top rounded-3xl"
                />
              </div>
            </div>

            <div className="p-8 md:py-0 md:w-1/2 space-y-6">
              <div className="text-center">
                <h1 className="text-3xl lg:text-5xl font-bold mb-2">
                  {[pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ")}
                </h1>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Briefcase className="h-5 w-5" />
                    Pastor Title
                    {pastor.clergy_type && (Array.isArray(pastor.clergy_type) ? pastor.clergy_type.length > 1 : false)
                      ? "s"
                      : ""}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      // Handle both string and array formats
                      const clergyTypes = Array.isArray(pastor.clergy_type)
                        ? pastor.clergy_type
                        : pastor.clergy_type
                        ? [pastor.clergy_type]
                        : [];

                      return clergyTypes.length > 0 ? (
                        <span className="text-base font-semibold">{clergyTypes.join(", ")}</span>
                      ) : (
                        <span className="text-base font-semibold">N/A</span>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Activity className="h-5 w-5" />
                    Status
                  </span>
                  <span className="text-base font-semibold">
                    {!pastor.status || pastor.status === "Active" ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-5 w-5" />
                    Age
                  </span>
                  <span className="text-base font-semibold">{calculateAge(pastor.date_of_birth || "")} years</span>
                </div>

                {pastor.date_of_appointment && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Award className="h-5 w-5" />
                      {getAppointmentDateLabel()}
                    </span>
                    <span className="text-base font-semibold">{formatDate(pastor.date_of_appointment)}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-5 w-5" />
                    Gender
                  </span>
                  <span className="text-base font-semibold">{pastor.gender}</span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Heart className="h-5 w-5" />
                    Marital Status
                  </span>
                  <span className="text-base font-semibold">{pastor.marital_status}</span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Briefcase className="h-5 w-5" />
                    Occupation
                  </span>
                  <span className="text-base font-semibold">{pastor.occupation}</span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-5 w-5" />
                    Council
                  </span>
                  <span className="text-base font-semibold">{pastor.council}</span>
                </div>

                {pastor.area && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-5 w-5" />
                      Area
                    </span>
                    <span className="text-base font-semibold">{pastor.area}</span>
                  </div>
                )}

                {pastor.ministry && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-5 w-5" />
                      Ministry
                    </span>
                    <span className="text-base font-semibold">{pastor.ministry}</span>
                  </div>
                )}

                {pastor.ministry_group && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="h-5 w-5" />
                      Ministry Group
                    </span>
                    <span className="text-base font-semibold">{pastor.ministry_group}</span>
                  </div>
                )}

                {pastor.basonta && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Award className="h-5 w-5" />
                      Basonta
                    </span>
                    <span className="text-base font-semibold">{pastor.basonta}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Globe className="h-5 w-5" />
                    Country
                  </span>
                  <span className="text-base font-semibold">{pastor.country}</span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Church className="h-5 w-5" />
                    Church
                  </span>
                  <span className="text-base font-semibold">{churchName || "No Church Assigned"}</span>
                </div>

                {pastor.email && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="h-5 w-5" />
                      Email
                    </span>
                    <a
                      href={`mailto:${pastor.email}`}
                      className="text-base font-semibold text-primary hover:underline cursor-pointer break-all"
                    >
                      {pastor.email}
                    </a>
                  </div>
                )}

                {pastor.contact_number && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted rounded-lg gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-5 w-5" />
                      Contact Number
                    </span>
                    <a
                      href={`tel:${pastor.contact_number}`}
                      className="text-base font-semibold text-primary hover:underline cursor-pointer"
                    >
                      {pastor.contact_number}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

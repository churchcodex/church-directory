"use client";

import { useEffect, useState } from "react";
import { Pastor } from "@/types/entities";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PastorFormDialog from "@/components/PastorFormDialog";
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
  ImageIcon,
  Download,
} from "lucide-react";
import Image from "next/image";
import { calculateAge } from "@/lib/utils";
import { usePageTitle } from "@/contexts/PageTitleContext";

export default function ClergyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [pastor, setPastor] = useState<Pastor | null>(null);
  const [churchName, setChurchName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { setTitle } = usePageTitle();

  useEffect(() => {
    // Smooth scroll to top when page loads
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Clear page title for detail page
    setTitle("");

    if (params.id) {
      fetchPastor(params.id as string);
    }
  }, [params.id, setTitle]);

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

    // Check for Bishops, Mothers, or Sisters first (Date of Consecration)
    if (types.includes("Bishop") || types.includes("Mother") || types.includes("Sister")) {
      return "Date of Consecration";
    }
    // Then check for Reverend (Date of Ordination)
    else if (types.includes("Reverend")) {
      return "Date of Ordination";
    }
    // Default for Pastor and Governor (Date of Appointment)
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

  // Format clergy types in the correct order
  const formatClergyTypes = () => {
    const types = Array.isArray(pastor.clergy_type)
      ? pastor.clergy_type
      : pastor.clergy_type
      ? [pastor.clergy_type]
      : [];

    if (types.length === 0) return [];

    // Define the display order
    const order = ["Bishop", "Mother", "Sister", "Reverend", "Pastor", "Governor"];

    // Sort types according to the defined order
    const sortedTypes = types.sort((a, b) => {
      return order.indexOf(a) - order.indexOf(b);
    });

    return sortedTypes;
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20 py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
        <div className="flex justify-between items-center mb-2">
          <Button variant="ghost" onClick={() => router.push("/clergy")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            <p className="hidden md:block">Back</p>
          </Button>
          {pastor && (
            <div className="flex gap-2">
              <PastorFormDialog pastor={pastor} onSuccess={() => fetchPastor(params.id as string)} />
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
            <div className="md:w-3/7">
              <div className="relative h-96 md:h-full w-full">
                {pastor.profile_image ? (
                  <Image
                    src={pastor.profile_image}
                    alt={[pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ")}
                    fill
                    className="object-cover object-top rounded-lg"
                    unoptimized={pastor.profile_image.includes("fl-admin-apps.s3.eu-west-2.amazonaws.com")}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder-avatar.png";
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 md:w-4/7">
              <div className="mb-6 flex flex-col items-center text-center">
                <h1 className="text-2xl lg:text-5xl font-bold text-center mb-2 ">
                  {[pastor.first_name, pastor.middle_name, pastor.last_name].filter(Boolean).join(" ")}
                </h1>
                {(() => {
                  const types = formatClergyTypes();

                  if (types.length === 0) {
                    return null;
                  }

                  return <p className="lg:text-2xl text-primary">{types.join(" • ")}</p>;
                })()}
              </div>

              <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                <div className="flex items-center justify-center p-2 bg-muted rounded-lg">
                  <span className="text-sm font-semibold">{calculateAge(pastor.date_of_birth || "")} years</span>
                </div>

                {pastor.date_of_appointment && (
                  <div className="flex items-center justify-center p-2 bg-muted rounded-lg">
                    <span className="text-sm font-semibold">{formatDate(pastor.date_of_appointment)}</span>
                  </div>
                )}

                <div className="flex items-center justify-center p-2 bg-muted rounded-lg">
                  <span className="text-sm font-semibold">{pastor.gender}</span>
                </div>

                <div className="flex items-center justify-center p-2 bg-muted rounded-lg">
                  <span className="text-sm font-semibold">{pastor.marital_status}</span>
                </div>

                <div className="flex items-center justify-center p-2 bg-muted rounded-lg">
                  <span className="text-sm font-semibold">{pastor.occupation}</span>
                </div>

                {pastor.council && pastor.council !== "None" && pastor.council !== "N/A" && (
                  <div className="flex items-center justify-center p-2 bg-muted rounded-lg">
                    <span className="text-sm font-semibold">{pastor.council} Council</span>
                  </div>
                )}
                <div className="flex flex-col items-center justify-between p-2 bg-muted rounded-lg">
                  <span className="flex items-center text-xs mb-2">
                    <Church className="mr-2 h-4 w-4" />
                    Campus
                  </span>
                  <span className="text-sm font-semibold">{churchName}</span>
                </div>

                {pastor.area && pastor.area !== "None" && (
                  <div className="flex items-center justify-center p-2 bg-muted rounded-lg">
                    <span className="text-sm font-semibold">{pastor.area}</span>
                  </div>
                )}

                {pastor.email && (
                  <div className="flex items-center justify-center p-2 bg-muted rounded-lg">
                    <a
                      href={`mailto:${pastor.email}`}
                      className="text-sm font-semibold text-primary hover:underline cursor-pointer truncate"
                    >
                      {pastor.email}
                    </a>
                  </div>
                )}

                {pastor.contact_number && (
                  <div className="flex items-center justify-center p-2 bg-muted rounded-lg">
                    <a
                      href={`tel:${pastor.contact_number}`}
                      className="text-sm font-semibold text-primary hover:underline cursor-pointer"
                    >
                      {pastor.contact_number}
                    </a>
                  </div>
                )}

                {pastor.function && pastor.function !== "N/A" && (
                  <div className="flex items-center justify-center p-2 bg-muted rounded-lg">
                    <span className="text-sm font-semibold">{pastor.function}</span>
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

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Church } from "@/types/entities";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ChurchFormDialog from "@/components/ChurchFormDialog";
import DeleteButton from "@/components/DeleteButton";
import { MapPin, Users, DollarSign, ArrowLeft, User } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import Image from "next/image";
import { usePageTitle } from "@/contexts/PageTitleContext";

export default function ChurchDetailsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [church, setChurch] = useState<Church | null>(null);
  const [pastorName, setPastorName] = useState<string>("");
  const [pastorImage, setPastorImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { setTitle } = usePageTitle();

  useEffect(() => {
    // Smooth scroll to top when page loads
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Clear page title for detail page
    setTitle("");

    if (params.id) {
      fetchChurch(params.id as string);
    }
  }, [params.id, setTitle]);

  const fetchChurch = async (id: string) => {
    try {
      const response = await fetch(`/api/churches/${id}`);
      const data = await response.json();
      if (data.success) {
        setChurch(data.data);
        // Fetch pastor name if head_pastor is a reference ID
        if (data.data.head_pastor) {
          fetchPastorName(data.data.head_pastor);
        }
      }
    } catch (error) {
      console.error("Failed to fetch church:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPastorName = async (pastorId: string) => {
    try {
      const response = await fetch(`/api/pastors/${pastorId}`);
      const data = await response.json();
      if (data.success) {
        const pastor = data.data;
        console.log(pastor);

        const fullName = `${pastor.first_name} ${pastor.middle_name || ""} ${pastor.last_name}`.trim();
        setPastorName(fullName);
        setPastorImage(pastor.profile_image || "");
      }
    } catch (error) {
      console.error("Failed to fetch pastor name:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col md:px-6">
        {/* Header Skeleton */}
        <div className="my-4 px-4 flex justify-between items-center w-full mx-auto">
          <div className="h-10 w-24 bg-muted rounded-md animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 w-20 bg-muted rounded-md animate-pulse" />
            <div className="h-10 w-20 bg-muted rounded-md animate-pulse" />
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex flex-1 flex-col md:flex-row">
          {/* Left Side - Image Skeleton */}
          <div className="relative w-full md:w-2/3 h-[50vh] md:h-screen flex items-center justify-center bg-muted/20 p-8">
            <div className="relative w-full max-w-2xl aspect-square rounded-2xl overflow-hidden bg-muted animate-pulse" />
          </div>

          {/* Right Side - Details Skeleton */}
          <div className="w-full md:w-1/3 bg-background overflow-y-auto">
            <div className="p-8 md:p-12 space-y-8">
              {/* Title Skeleton */}
              <div className="space-y-4 pt-12 md:pt-0">
                <div className="h-12 bg-muted rounded-md animate-pulse w-3/4" />
                <div className="h-6 bg-muted rounded-md animate-pulse w-1/2" />
              </div>

              {/* Badge Skeleton */}
              <div className="p-6 rounded-xl flex items-center justify-center">
                <div className="h-10 w-40 bg-muted rounded-md animate-pulse" />
              </div>

              {/* Statistics Skeletons */}
              <div className="space-y-4">
                <div className="p-6 rounded-xl border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-32" />
                      <div className="h-8 bg-muted rounded animate-pulse w-24" />
                    </div>
                  </div>
                </div>
                <div className="p-6 rounded-xl border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-32" />
                      <div className="h-8 bg-muted rounded animate-pulse w-24" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!church) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Church not found</h2>
          <Button onClick={() => router.push("/churches")}>Back to Churches</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:px-6">
      {/* Header */}
      <div className="my-4 px-4 flex items-center gap-4 w-full mx-auto">
        <Button variant="ghost" onClick={() => router.push("/churches")} className="shadow-lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1 hidden lg:flex lg:flex-row items-center lg:justify-center gap-6 w-fit mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold">{church.name}</h1>
          <p className="flex items-center gap-2 text-muted-foreground text-lg md:text-xl w-fit">
            <MapPin className="h-5 w-5 md:h-6 md:w-6" />
            {church.location}
          </p>
        </div>
        {session?.user?.role === "admin" && (
          <div className="flex gap-2">
            <ChurchFormDialog church={church} onSuccess={() => fetchChurch(params.id as string)} />
            <DeleteButton id={church.id} name={church.name} type="campus" />
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col lg:hidden  items-center lg:justify-center gap-2 w-fit mx-auto text-center my-6">
        <h1 className="text-3xl md:text-4xl font-bold">{church.name}</h1>
        <p className="flex items-center gap-2 text-muted-foreground text-lg md:text-xl w-fit">
          <MapPin className="h-5 w-5 md:h-6 md:w-6" />
          {church.location}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Left Side - Image */}
        <div className="relative w-full md:w-2/3 h-[50vh] md:h-screen flex items-center justify-center bg-muted/20 p-8">
          <div className="relative w-full max-w-2xl aspect-square rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={church.images[0] || "/placeholder-church.jpg"}
              alt={church.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {church.images.length > 1 && (
            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex gap-2 justify-center overflow-x-auto pb-2">
                {church.images.slice(1, 5).map((image, index) => (
                  <div
                    key={index}
                    className="relative h-25 w-25 shrink-0 rounded-xl overflow-hidden border-2 border-white shadow-lg"
                  >
                    <Image src={image} alt={`${church.name} - Image ${index + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Details */}
        <div className="w-full md:w-1/3 bg-background overflow-y-auto">
          <div className="p-8 md:p-12 space-y-8">
            {/* Head Pastor */}
            <div className="p-6 rounded-xl flex flex-col items-center justify-center gap-4">
              {pastorImage && (
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-lg">
                  <Image src={pastorImage} alt={pastorName} fill className="object-cover" />
                </div>
              )}
              {!pastorImage && pastorName && (
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary shadow-lg">
                  <User className="h-16 w-16 text-primary" />
                </div>
              )}
              <Badge variant="default" className="text-lg px-4 py-2">
                {pastorName || "No pastor assigned"}
              </Badge>
            </div>

            {/* Statistics */}
            <div className="space-y-4">
              <div className="p-6 bg-linear-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500 rounded-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Attendance</p>
                      <p className="text-3xl font-bold">{formatNumber(church.members)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-linear-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500 rounded-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Income</p>
                      <p className="text-3xl font-bold">{formatCurrency(church.income)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Section */}
            {church.images.length > 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Gallery</h2>
                <div className="grid grid-cols-2 gap-4">
                  {church.images.slice(1).map((image, index) => (
                    <div
                      key={index}
                      className="relative h-40 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                    >
                      <Image src={image} alt={`${church.name} - Image ${index + 2}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

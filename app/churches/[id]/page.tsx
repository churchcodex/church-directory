"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Church } from "@/types/entities";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ChurchFormDialog from "@/components/ChurchFormDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DeleteButton from "@/components/DeleteButton";
import { MapPin, Users, DollarSign, ArrowLeft, User, Images, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? church!.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === church!.images.length - 1 ? 0 : prev + 1));
  };

  const openGallery = (index: number = 0) => {
    setCurrentImageIndex(index);
    setGalleryOpen(true);
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
      <div className="my-4 px-4 flex items-center justify-between w-full mx-auto">
        <Button variant="ghost" onClick={() => router.push("/churches")} className="shadow-lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          {church.images.length > 0 && (
            <Button variant="outline" onClick={() => openGallery(0)} className="shadow-lg">
              <Images className="mr-2 h-4 w-4" />
              Gallery
            </Button>
          )}
          {session?.user?.role === "admin" && (
            <>
              <ChurchFormDialog church={church} onSuccess={() => fetchChurch(params.id as string)} />
              <DeleteButton id={church.id} name={church.name} type="campus" />
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Left Side - Image */}
        <div className="relative w-full md:w-2/3 h-[50vh] md:h-screen flex items-center justify-center bg-muted/20 p-4 md:p-8">
          {/* Church Name and Location Overlay */}
          <div className="absolute top-0 left-0 right-0 z-10">
            <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-2xl">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 text-center">{church.name}</h1>
              <p className="flex items-center gap-2 text-white/90 text-base md:text-lg lg:text-xl text-center justify-center">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                {church.location}
              </p>
            </div>
          </div>
          <div className="relative w-full h-full max-w-2xl max-h-full rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={church.images[0] || "/placeholder-church.jpg"}
              alt={church.name}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Right Side - Details */}
        <div className="w-full md:w-1/3 bg-background overflow-y-auto">
          <div className="p-8 md:p-12 space-y-8">
            {/* Head Pastor */}
            <div className="p-6 rounded-xl flex flex-col items-center justify-center gap-4">
              {pastorImage && (
                <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary shadow-lg">
                  <Image src={pastorImage} alt={pastorName} fill className="object-cover" />
                </div>
              )}
              {!pastorImage && pastorName && (
                <div className="w-48 h-48 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary shadow-lg">
                  <User className="h-24 w-24 text-primary" />
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
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-3 bg-blue-500 rounded-lg shrink-0">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground truncate">Average Attendance</p>
                      <p className="text-3xl font-bold truncate">{formatNumber(church.members)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-linear-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-3 bg-green-500 rounded-lg shrink-0">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground truncate">Average Income</p>
                      <p className="text-3xl font-bold truncate">{formatCurrency(church.income)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-2xl">{church.name} - Gallery</DialogTitle>
          </DialogHeader>

          {/* Main Image Display */}
          <div className="relative w-full h-[60vh] bg-black/5 flex items-center justify-center">
            <div className="relative w-full h-full">
              <Image
                src={church.images[currentImageIndex]}
                alt={`${church.name} - Image ${currentImageIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Previous Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-12 w-12 rounded-full"
              onClick={handlePrevImage}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            {/* Next Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white h-12 w-12 rounded-full"
              onClick={handleNextImage}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
              {currentImageIndex + 1} / {church.images.length}
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className="px-6 pb-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {church.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`relative h-20 w-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex
                      ? "border-primary scale-105 shadow-lg"
                      : "border-transparent hover:border-primary/50"
                  }`}
                >
                  <Image src={image} alt={`${church.name} - Thumbnail ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

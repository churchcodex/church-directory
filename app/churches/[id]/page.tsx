"use client";

import { useEffect, useState } from "react";
import { Church } from "@/types/entities";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ChurchFormDialog from "@/components/ChurchFormDialog";
import DeleteButton from "@/components/DeleteButton";
import { MapPin, Users, DollarSign, ArrowLeft, User } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import Image from "next/image";

export default function ChurchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchChurch(params.id as string);
    }
  }, [params.id]);

  const fetchChurch = async (id: string) => {
    try {
      const response = await fetch(`/api/churches/${id}`);
      const data = await response.json();
      if (data.success) {
        setChurch(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch church:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading church details...</div>
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        <Button variant="secondary" onClick={() => router.push("/churches")} className="shadow-lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Churches
        </Button>
        <div className="flex gap-2">
          <ChurchFormDialog church={church} onSuccess={() => fetchChurch(params.id as string)} />
          <DeleteButton id={church.id} type="church" name={church.name} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:flex-row">
        {/* Left Side - Image */}
        <div className="relative w-full md:w-1/2 h-[50vh] md:h-screen flex items-center justify-center bg-muted/20 p-8">
          <div className="relative w-full max-w-md aspect-square rounded-full overflow-hidden shadow-2xl">
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
                    className="relative h-16 w-16 shrink-0 rounded-full overflow-hidden border-2 border-white shadow-lg"
                  >
                    <Image src={image} alt={`${church.name} - Image ${index + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Details */}
        <div className="w-full md:w-1/2 bg-background overflow-y-auto">
          <div className="p-8 md:p-12 space-y-8">
            {/* Church Name and Location */}
            <div className="space-y-4 pt-12 md:pt-0">
              <h1 className="text-4xl md:text-5xl font-bold">{church.name}</h1>
              <p className="flex items-center gap-2 text-muted-foreground text-xl">
                <MapPin className="h-6 w-6" />
                {church.location}
              </p>
            </div>

            {/* Head Pastor */}
            <div className="p-6 bg-muted rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <User className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Head Pastor</span>
              </div>
              <Badge variant="default" className="text-lg px-4 py-2">
                {church.head_pastor}
              </Badge>
            </div>

            {/* Statistics */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Church Statistics</h2>

              <div className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500 rounded-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Members</p>
                      <p className="text-3xl font-bold">{formatNumber(church.members)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500 rounded-lg">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Income</p>
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

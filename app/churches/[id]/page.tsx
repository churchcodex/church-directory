"use client";

import { useEffect, useState } from "react";
import { Church } from "@/types/entities";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ChurchFormDialog from "@/components/ChurchFormDialog";
import DeleteButton from "@/components/DeleteButton";
import { MapPin, Users, DollarSign, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => router.push("/churches")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Churches
          </Button>
          {church && (
            <div className="flex gap-2">
              <ChurchFormDialog church={church} onSuccess={() => fetchChurch(params.id as string)} />
              <DeleteButton id={church.id} type="church" name={church.name} />
            </div>
          )}
        </div>

        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative h-96 w-full">
              <Image
                src={church.images[0] || "/placeholder-church.jpg"}
                alt={church.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{church.name}</h1>
                <p className="flex items-center gap-2 text-muted-foreground text-lg">
                  <MapPin className="h-5 w-5" />
                  {church.location}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Head Pastor</span>
                  <Badge variant="secondary" className="text-base">
                    {church.head_pastor}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-5 w-5" />
                    Total Members
                  </span>
                  <span className="text-2xl font-bold">{formatNumber(church.members)}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-5 w-5" />
                    Annual Income
                  </span>
                  <span className="text-2xl font-bold">{formatCurrency(church.income)}</span>
                </div>
              </div>
            </div>
          </div>

          {church.images.length > 1 && (
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4">Gallery</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {church.images.slice(1).map((image, index) => (
                  <div key={index} className="relative h-32 rounded-lg overflow-hidden">
                    <Image src={image} alt={`${church.name} - Image ${index + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Pastor } from "@/types/entities";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PastorFormDialog from "@/components/PastorFormDialog";
import DeleteButton from "@/components/DeleteButton";
import { Heart, Briefcase, ArrowLeft, Calendar, Church, User, Globe, Users, Award } from "lucide-react";
import Image from "next/image";
import { calculateAge } from "@/lib/utils";

export default function ClergyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [pastor, setPastor] = useState<Pastor | null>(null);
  const [churchName, setChurchName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        // Fetch church name
        if (data.data.church) {
          fetchChurch(data.data.church);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading pastor's details...</div>
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

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => router.push("/clergy")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pastors
          </Button>
          {pastor && (
            <div className="flex gap-2">
              <PastorFormDialog pastor={pastor} onSuccess={() => fetchPastor(params.id as string)} />
              <DeleteButton id={pastor.id} type="pastor" name={pastor.name} />
            </div>
          )}
        </div>

        <Card className="overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/3 h-full">
              <div className="relative h-105 w-full">
                <Image src={pastor.profile_image} alt={pastor.name} fill className="object-cover object-top h-full" />
              </div>
            </div>

            <div className="p-8 md:w-2/3 space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{pastor.name}</h1>
                <p className="text-xl text-muted-foreground">{pastor.position}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Briefcase className="h-5 w-5" />
                    Pastor Title
                  </span>
                  <Badge variant="secondary" className="text-base">
                    {pastor.clergy_type}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-5 w-5" />
                    Age
                  </span>
                  <span className="text-xl font-bold">{calculateAge(pastor.date_of_birth)} years</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-5 w-5" />
                    Gender
                  </span>
                  <Badge variant="outline" className="text-base">
                    {pastor.gender}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Heart className="h-5 w-5" />
                    Marital Status
                  </span>
                  <Badge variant="outline" className="text-base">
                    {pastor.marital_status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Briefcase className="h-5 w-5" />
                    Occupation
                  </span>
                  <span className="text-base font-semibold">{pastor.occupation}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-5 w-5" />
                    Council
                  </span>
                  <Badge variant="secondary" className="text-base">
                    {pastor.council}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Globe className="h-5 w-5" />
                    Country
                  </span>
                  <span className="text-base font-semibold">{pastor.country}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Church className="h-5 w-5" />
                    Church
                  </span>
                  <span className="text-base font-semibold">{churchName || "Loading..."}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

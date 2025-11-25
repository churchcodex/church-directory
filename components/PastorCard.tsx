"use client";

import { Pastor } from "@/types/entities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Briefcase } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface PastorCardProps {
  pastor: Pastor;
}

export default function PastorCard({ pastor }: PastorCardProps) {
  return (
    <Link href={`/clergy/${pastor.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
        <div className="relative h-48 w-full">
          <Image src={pastor.profile_image} alt={pastor.name} fill className="object-cover" />
        </div>
        <CardHeader>
          <CardTitle className="text-xl">{pastor.name}</CardTitle>
          <CardDescription>{pastor.position}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Age</span>
            <span className="font-semibold">{pastor.age} years</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              Type
            </span>
            <Badge variant="secondary">{pastor.clergy_type}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Heart className="h-4 w-4" />
              Status
            </span>
            <Badge variant="outline">{pastor.marital_status}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

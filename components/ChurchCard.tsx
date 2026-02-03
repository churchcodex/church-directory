"use client";

import { Church } from "@/types/entities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, DollarSign, ImageIcon } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface ChurchCardProps {
  church: Church;
  pastorName?: string;
}

export default function ChurchCard({ church, pastorName }: ChurchCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Link href={`/churches/${church.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
        <div className="relative h-48 w-full bg-muted">
          {!imageError && church.images[0] ? (
            <Image
              src={church.images[0]}
              alt={church.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <ImageIcon className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardHeader>
          <CardTitle className="text-xl">{church.name}</CardTitle>
          <CardDescription className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {church.location}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pastor</span>
            <Badge variant="secondary">{pastorName || "Unknown Pastor"}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Members
            </span>
            <span className="font-semibold">{formatNumber(church.members)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Income
            </span>
            <span className="font-semibold">{formatCurrency(church.income)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

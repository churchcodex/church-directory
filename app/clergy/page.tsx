"use client";

import { useEffect, useState } from "react";
import { Pastor } from "@/types/entities";
import PastorCard from "@/components/PastorCard";
import PastorFormDialog from "@/components/PastorFormDialog";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function ClergyPage() {
  const [pastors, setPastors] = useState<Pastor[]>([]);
  const [filteredPastors, setFilteredPastors] = useState<Pastor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPastors();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = pastors.filter(
        (pastor) =>
          pastor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pastor.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pastor.clergy_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPastors(filtered);
    } else {
      setFilteredPastors(pastors);
    }
  }, [searchQuery, pastors]);

  const fetchPastors = async () => {
    try {
      const response = await fetch("/api/pastors");
      const data = await response.json();
      if (data.success) {
        setPastors(data.data);
        setFilteredPastors(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch pastors:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading clergy...</div>
      </div>
    );
  }

  console.log("filtered pastors: ", filteredPastors);

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-12">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-4">Clergy Directory</h1>
            <p className="text-muted-foreground text-lg">Browse our directory of {pastors.length} clergy members</p>
          </div>
          <PastorFormDialog onSuccess={fetchPastors} />
        </div>

        <div className="mb-8 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search by name, position, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {filteredPastors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No clergy members found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {filteredPastors.map((pastor) => (
              <Link
                key={pastor.id}
                href={`/clergy/${pastor.id}`}
                className="group cursor-pointer flex flex-col items-center"
              >
                <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-muted mb-1.5 border-2 border-border hover:border-primary transition-all duration-300 hover:scale-105">
                  {pastor.profile_image ? (
                    <img src={pastor.profile_image} alt={pastor.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-purple-500 to-blue-600">
                      <span className="text-white text-2xl font-bold">{pastor.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-center text-wrap w-24 px-0.5">{pastor.name}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Church as ChurchType, ClergyType, Pastor } from "@/types/entities";
import { Church, Users, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import Link from "next/link";

interface DashboardStats {
  totalChurches: number;
  totalClergy: number;
  totalBishops: number;
  totalMothers: number;
  totalSisters: number;
  totalReverends: number;
  totalGovernors: number;
  totalMembers: number;
  totalIncome: number;
  inactiveClergy: number;
  recentChurches: ChurchType[];
  recentClergy: Pastor[];
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalChurches: 0,
    totalClergy: 0,
    totalBishops: 0,
    totalMothers: 0,
    totalSisters: 0,
    totalReverends: 0,
    totalGovernors: 0,
    totalMembers: 0,
    totalIncome: 0,
    inactiveClergy: 0,
    recentChurches: [],
    recentClergy: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [churchesRes, clergyRes] = await Promise.all([fetch("/api/churches"), fetch("/api/pastors")]);

        const churchesData = await churchesRes.json();
        const clergyData = await clergyRes.json();

        // Extract data from the success response structure
        const churches: ChurchType[] =
          churchesData.success && Array.isArray(churchesData.data) ? churchesData.data : [];
        const clergy: Pastor[] = clergyData.success && Array.isArray(clergyData.data) ? clergyData.data : [];

        const totalMembers = churches.reduce((sum, church) => sum + (church.members || 0), 0);
        const totalIncome = churches.reduce((sum, church) => sum + (church.income || 0), 0);

        // Count clergy by type
        const totalBishops = clergy.filter((p) => {
          const types = Array.isArray(p.clergy_type) ? p.clergy_type : p.clergy_type ? [p.clergy_type] : [];
          return types.includes("Bishop");
        }).length;

        const totalMothers = clergy.filter((p) => {
          const types = Array.isArray(p.clergy_type) ? p.clergy_type : p.clergy_type ? [p.clergy_type] : [];
          return types.includes("Mother");
        }).length;

        const totalSisters = clergy.filter((p) => {
          const types = Array.isArray(p.clergy_type) ? p.clergy_type : p.clergy_type ? [p.clergy_type] : [];
          return types.includes("Sister");
        }).length;

        const totalReverends = clergy.filter((p) => {
          const types = Array.isArray(p.clergy_type) ? p.clergy_type : p.clergy_type ? [p.clergy_type] : [];
          return types.includes("Reverend");
        }).length;

        const totalGovernors = clergy.filter((p) => {
          const types = Array.isArray(p.clergy_type) ? p.clergy_type : p.clergy_type ? [p.clergy_type] : [];
          return types.includes("Governor");
        }).length;

        const totalPastors = clergy.filter((p) => {
          const types = Array.isArray(p.clergy_type) ? p.clergy_type : p.clergy_type ? [p.clergy_type] : [];
          return types.includes("Pastor");
        }).length;

        setStats({
          totalChurches: churches.length,
          totalClergy: totalPastors,
          totalBishops,
          totalMothers,
          totalSisters,
          totalReverends,
          totalGovernors,
          totalMembers,
          totalIncome,
          inactiveClergy: 0,
          recentChurches: churches.slice(-5).reverse(),
          recentClergy: clergy.slice(-5).reverse(),
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Card key={i} className="border-muted">
              <CardHeader className="h-24 bg-muted/20" />
              <CardContent className="h-16 bg-muted/10" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Campuses",
      value: formatNumber(stats.totalChurches),
      icon: Church,
      gradient: "from-purple-500 to-purple-700",
      href: "/churches",
    },
    {
      title: "Total Pastors",
      value: formatNumber(stats.totalClergy),
      icon: Users,
      gradient: "from-blue-500 to-blue-700",
      href: "/clergy?clergyType=Pastor",
    },
    {
      title: "Total Bishops",
      value: formatNumber(stats.totalBishops),
      icon: Users,
      gradient: "from-violet-500 to-violet-700",
      href: "/clergy?clergyType=Bishop",
    },
    {
      title: "Total Mothers",
      value: formatNumber(stats.totalMothers),
      icon: Users,
      gradient: "from-rose-500 to-rose-700",
      href: "/clergy?clergyType=Mother",
    },
    {
      title: "Total Sisters",
      value: formatNumber(stats.totalSisters),
      icon: Users,
      gradient: "from-pink-500 to-pink-700",
      href: "/clergy?clergyType=Sister",
    },
    {
      title: "Total Reverends",
      value: formatNumber(stats.totalReverends),
      icon: Users,
      gradient: "from-indigo-500 to-indigo-700",
      href: "/clergy?clergyType=Reverend",
    },
    {
      title: "Total Governors",
      value: formatNumber(stats.totalGovernors),
      icon: Users,
      gradient: "from-emerald-500 to-emerald-700",
      href: "/clergy?clergyType=Governor",
    },
    {
      title: "Total Members",
      value: formatNumber(stats.totalMembers),
      icon: TrendingUp,
      gradient: "from-cyan-500 to-cyan-700",
    },
    {
      title: "Total Income",
      value: formatCurrency(stats.totalIncome),
      icon: DollarSign,
      gradient: "from-orange-500 to-orange-700",
    },
  ];

  // Format clergy types in the correct order
  const formatClergyTypes = (clergyType?: ClergyType | ClergyType[]) => {
    const types = Array.isArray(clergyType) ? clergyType : clergyType ? [clergyType] : [];

    if (types.length === 0) return "N/A";

    // Define the display order
    const order = ["Bishop", "Mother", "Sister", "Reverend", "Pastor", "Governor"];

    // Sort types according to the defined order
    const sortedTypes = types.sort((a, b) => {
      return order.indexOf(a) - order.indexOf(b);
    });

    return sortedTypes.join(", ");
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const cardContent = (
            <Card className="border-muted hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg bg-linear-to-br ${stat.gradient}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );

          return stat.href ? (
            <Link key={index} href={stat.href}>
              {cardContent}
            </Link>
          ) : (
            <div key={index}>{cardContent}</div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Campuses */}
        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Church className="h-5 w-5 text-purple-500" />
              Recent Campuses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentChurches.map((church) => (
                <Link
                  key={church.id}
                  href={`/churches/${church.id}`}
                  className="block p-3 rounded-lg border border-muted hover:border-primary/50 transition-all duration-300 hover:shadow-md hover:shadow-primary/10"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{church.name}</h3>
                      <p className="text-sm text-muted-foreground">{church.location}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {formatNumber(church.members)} members
                    </Badge>
                  </div>
                </Link>
              ))}
              {stats.recentChurches.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No churches yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Clergy */}
        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Recent Pastors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentClergy.map((pastor) => (
                <Link
                  key={pastor.id}
                  href={`/clergy/${pastor.id}`}
                  className="block p-3 rounded-lg border border-muted hover:border-primary/50 transition-all duration-300 hover:shadow-md hover:shadow-primary/10"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">
                        {pastor.first_name} {pastor.middle_name} {pastor.last_name}
                      </h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatClergyTypes(pastor.clergy_type)}
                    </Badge>
                  </div>
                </Link>
              ))}
              {stats.recentClergy.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No pastors added yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

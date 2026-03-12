"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CalendarDays, CheckCircle2, Loader2, RefreshCcw, ScanLine, Trash2, Users } from "lucide-react";
import AttendanceBulkUpload from "@/components/AttendanceBulkUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePageActions } from "@/contexts/PageActionsContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { getTodayIsoDate, getWeekRange, isDateInWeek, toIsoDateString } from "@/lib/attendance";
import { getErrorMessage } from "@/lib/error";
import { AttendanceWeekSummary } from "@/types/entities";
import { toast } from "sonner";

const initialWeekRange = getWeekRange(getTodayIsoDate());

export default function AttendanceTrackingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRole = session?.user?.role;
  const { setTitle } = usePageTitle();
  const { clearActions } = usePageActions();
  const [summary, setSummary] = useState<AttendanceWeekSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingCode, setSubmittingCode] = useState(false);
  const [backfillingCodes, setBackfillingCodes] = useState(false);
  const [removingRecordId, setRemovingRecordId] = useState<string | null>(null);
  const [weekReferenceDate, setWeekReferenceDate] = useState(getTodayIsoDate());
  const [weekStart, setWeekStart] = useState(toIsoDateString(initialWeekRange.weekStart));
  const [selectedDate, setSelectedDate] = useState(getTodayIsoDate());
  const [codeInput, setCodeInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setTitle("Tithe Tracking");

    return () => {
      clearActions();
    };
  }, [clearActions, setTitle]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && userRole !== "admin") {
      router.push("/");
      toast.error("Admin access required");
    }
  }, [router, status, userRole]);

  const fetchSummary = useCallback(async (nextWeekStart: string) => {
    setLoading(true);

    try {
      const response = await fetch(`/api/attendance?weekStart=${nextWeekStart}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch attendance summary.");
      }

      setSummary(data.data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to fetch attendance summary."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && userRole === "admin") {
      fetchSummary(weekStart);
    }
  }, [fetchSummary, status, userRole, weekStart]);

  const filteredRows = useMemo(() => {
    if (!summary) {
      return [];
    }

    const normalizedSearch = searchQuery.trim().toLowerCase();

    if (!normalizedSearch) {
      return summary.rows;
    }

    return summary.rows.filter((row) => {
      return (
        row.pastorName.toLowerCase().includes(normalizedSearch) ||
        row.pastorCode.toLowerCase().includes(normalizedSearch) ||
        row.council.some((value) => value.toLowerCase().includes(normalizedSearch)) ||
        row.area.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [searchQuery, summary]);

  const missingCodesCount = useMemo(() => {
    return summary?.rows.filter((row) => !row.pastorCode).length || 0;
  }, [summary]);

  const handleWeekReferenceChange = (value: string) => {
    if (!value) {
      return;
    }

    const nextWeekRange = getWeekRange(value);
    const nextWeekStart = toIsoDateString(nextWeekRange.weekStart);

    setWeekReferenceDate(value);
    setWeekStart(nextWeekStart);

    if (!isDateInWeek(selectedDate, nextWeekStart)) {
      setSelectedDate(value);
    }
  };

  const handleSelectedDateChange = (value: string) => {
    if (!value) {
      return;
    }

    setSelectedDate(value);

    const nextWeekRange = getWeekRange(value);
    const nextWeekStart = toIsoDateString(nextWeekRange.weekStart);
    setWeekReferenceDate(value);

    if (nextWeekStart !== weekStart) {
      setWeekStart(nextWeekStart);
    }
  };

  const handleSingleCodeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const code = codeInput.trim().toUpperCase();

    if (!code) {
      toast.error("Enter a pastor code.");
      return;
    }

    if (!selectedDate) {
      toast.error("Select an attendance date.");
      return;
    }

    setSubmittingCode(true);

    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, attendanceDate: selectedDate }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to mark tithe.");
      }

      if (data.duplicate) {
        toast.info(data.message);
      } else {
        toast.success(data.message || "Tithe marked.");
      }

      setCodeInput("");
      fetchSummary(weekStart);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to mark tithe."));
    } finally {
      setSubmittingCode(false);
    }
  };

  const handleBackfillCodes = async () => {
    setBackfillingCodes(true);

    try {
      const response = await fetch("/api/pastors/migrate", { method: "POST" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to backfill pastor codes.");
      }

      toast.success(data.message || "Pastor codes generated.");
      fetchSummary(weekStart);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to backfill pastor codes."));
    } finally {
      setBackfillingCodes(false);
    }
  };

  const handleDeleteAttendance = async (recordId: string) => {
    setRemovingRecordId(recordId);

    try {
      const response = await fetch(`/api/attendance?id=${recordId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to remove tithe mark.");
      }

      toast.success(data.message || "Tithe mark removed.");
      fetchSummary(weekStart);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to remove tithe mark."));
    } finally {
      setRemovingRecordId(null);
    }
  };

  if (status === "loading" || (status === "authenticated" && loading && !summary)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (userRole !== "admin") {
    return null;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Tithe Tracking</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track weekly tithes paid by pastor code, one payment mark per pastor per date.
            </p>
          </div>
          {summary && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                Week {summary.weekStart} to {summary.weekEnd}
              </Badge>
              <Badge variant="outline">{summary.markedPastors} pastors marked</Badge>
              <Badge variant="outline">{summary.totalMarks} total marks</Badge>
              {missingCodesCount > 0 && <Badge variant="destructive">{missingCodesCount} pastors missing codes</Badge>}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => fetchSummary(weekStart)} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleBackfillCodes} disabled={backfillingCodes} className="gap-2">
            {backfillingCodes ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            Generate Missing Codes
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" />
              Week Setup
            </CardTitle>
            <CardDescription>Select a week and the attendance date inside that week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Week Reference Date</label>
              <Input
                type="date"
                value={weekReferenceDate}
                onChange={(event) => handleWeekReferenceChange(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Attendance Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => handleSelectedDateChange(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4" />
              Single Code Entry
            </CardTitle>
            <CardDescription>Enter one pastor code to mark attendance for the selected date.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSingleCodeSubmit} className="space-y-4">
              <Input
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
                placeholder="FLC-A1B2"
              />
              <Button type="submit" className="w-full" disabled={submittingCode || !selectedDate}>
                {submittingCode ? "Marking..." : "Mark Attendance"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Excel Upload
            </CardTitle>
            <CardDescription>Upload a spreadsheet of codes to mark the selected date in bulk.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <AttendanceBulkUpload attendanceDate={selectedDate} onSuccess={() => fetchSummary(weekStart)} />
            <p className="text-xs text-muted-foreground">Only one sheet is required. One code per row.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Weekly Attendance Matrix</CardTitle>
            <CardDescription>Search by pastor name, code, council, or area.</CardDescription>
          </div>
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search pastors or codes"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !summary ? (
            <div className="py-12 text-center text-muted-foreground">No attendance data available.</div>
          ) : filteredRows.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No pastors match the current search.</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[980px] space-y-2">
                <div className="grid grid-cols-[minmax(260px,1.8fr)_repeat(7,minmax(88px,1fr))_minmax(88px,0.5fr)] gap-2 rounded-lg border bg-muted/40 p-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <div>Pastor</div>
                  {summary.days.map((day) => (
                    <div key={day.date} className="text-center">
                      {day.label}
                    </div>
                  ))}
                  <div className="text-center">Total</div>
                </div>

                {filteredRows.map((row) => (
                  <div
                    key={row.pastorId}
                    className="grid grid-cols-[minmax(260px,1.8fr)_repeat(7,minmax(88px,1fr))_minmax(88px,0.5fr)] gap-2 rounded-lg border p-3 items-center"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="font-medium truncate">{row.pastorName}</div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                        <span>{row.pastorCode || "No code"}</span>
                        <span>{row.council.join(", ") || "No council"}</span>
                      </div>
                    </div>

                    {row.dates.map((day) => (
                      <div key={`${row.pastorId}-${day.date}`} className="flex justify-center">
                        {day.marked && day.recordId ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={removingRecordId === day.recordId}
                            onClick={() => handleDeleteAttendance(day.recordId!)}
                            className="h-9 min-w-[76px] gap-1 border-green-600 text-green-700 hover:bg-green-50"
                          >
                            {removingRecordId === day.recordId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Marked
                          </Button>
                        ) : (
                          <div className="h-9 min-w-[76px] rounded-md border border-dashed bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
                            --
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="text-center font-semibold">{row.totalMarks}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

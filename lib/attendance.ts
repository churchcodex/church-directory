const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

export function toUtcDate(dateInput: string | Date) {
  if (dateInput instanceof Date) {
    if (!isValidDate(dateInput)) {
      throw new Error("Invalid date value");
    }

    return new Date(Date.UTC(dateInput.getUTCFullYear(), dateInput.getUTCMonth(), dateInput.getUTCDate()));
  }

  if (!dateInput || typeof dateInput !== "string") {
    throw new Error("Attendance date is required");
  }

  const trimmed = dateInput.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (!match) {
    throw new Error("Attendance date must be in YYYY-MM-DD format");
  }

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  if (!isValidDate(date)) {
    throw new Error("Invalid attendance date");
  }

  return date;
}

export function toIsoDateString(date: Date) {
  if (!isValidDate(date)) {
    throw new Error("Invalid date value");
  }

  return date.toISOString().split("T")[0];
}

export function getWeekRange(dateInput: string | Date) {
  const attendanceDate = toUtcDate(dateInput);
  const dayOfWeek = attendanceDate.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(attendanceDate.getTime() + mondayOffset * MS_PER_DAY);
  const weekEnd = new Date(weekStart.getTime() + 6 * MS_PER_DAY);

  return {
    attendanceDate,
    weekStart,
    weekEnd,
  };
}

export function getWeekDates(weekStartInput: string | Date) {
  const weekStart = toUtcDate(weekStartInput);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(weekStart.getTime() + index * MS_PER_DAY);
    return {
      date: toIsoDateString(current),
      label: current.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
    };
  });
}

export function getTodayIsoDate() {
  return toIsoDateString(toUtcDate(new Date()));
}

export function getWeekRangeFromWeekStart(weekStartInput: string | Date) {
  const weekStart = toUtcDate(weekStartInput);
  const weekEnd = new Date(weekStart.getTime() + 6 * MS_PER_DAY);

  return {
    weekStart,
    weekEnd,
  };
}

export function isDateInWeek(attendanceDateInput: string, weekStartInput: string | Date) {
  const attendanceDate = toUtcDate(attendanceDateInput).getTime();
  const { weekStart, weekEnd } = getWeekRangeFromWeekStart(weekStartInput);

  return attendanceDate >= weekStart.getTime() && attendanceDate <= weekEnd.getTime();
}

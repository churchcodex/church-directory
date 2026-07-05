import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn(),
}));

vi.mock("@/models/User", () => ({
  default: {},
}));

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { requireAdmin } from "./auth";

const mockedGetServerSession = vi.mocked(getServerSession);

describe("requireAdmin", () => {
  beforeEach(() => {
    mockedGetServerSession.mockReset();
  });

  it("returns the session when the user has the admin role", async () => {
    const adminSession = {
      user: { id: "1", email: "admin@example.com", role: "admin" },
      expires: "2099-01-01T00:00:00.000Z",
    };
    mockedGetServerSession.mockResolvedValue(adminSession as any);

    const result = await requireAdmin();

    expect(result).toBe(adminSession);
  });

  it("returns a 403 response when the session exists but the role is not admin", async () => {
    mockedGetServerSession.mockResolvedValue({
      user: { id: "2", email: "user@example.com", role: "user" },
      expires: "2099-01-01T00:00:00.000Z",
    } as any);

    const result = await requireAdmin();

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ success: false, error: "Admin access required" });
  });

  it("returns a 401 response when there is no session", async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const result = await requireAdmin();

    expect(result).toBeInstanceOf(NextResponse);
    const response = result as NextResponse;
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ success: false, error: "Authentication required" });
  });
});

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  _id: string;
  email: string;
  isActive: boolean;
  role: string;
  createdAt: string;
}

interface InviteToken {
  _id: string;
  token: string;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
  createdBy: { email: string };
  usedBy?: { email: string };
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [tokens, setTokens] = useState<InviteToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && (session?.user as any)?.role !== "admin") {
      router.push("/");
      toast.error("Admin access required");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.role === "admin") {
      fetchUsers();
      fetchTokens();
    }
  }, [status, session]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
      }
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTokens = async () => {
    try {
      const response = await fetch("/api/auth/invite");
      const data = await response.json();
      if (response.ok) {
        setTokens(data.tokens);
      }
    } catch (error) {
      toast.error("Failed to fetch invite tokens");
    }
  };

  const generateInviteToken = async () => {
    setGeneratingToken(true);
    try {
      const response = await fetch("/api/auth/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresInDays: 7 }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Invite link generated!");
        navigator.clipboard.writeText(data.signupUrl);
        toast.info("Signup link copied to clipboard");
        fetchTokens();
      } else {
        toast.error(data.error || "Failed to generate invite token");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setGeneratingToken(false);
    }
  };

  const toggleUserAccess = async () => {
    if (!userToToggle) return;

    try {
      const response = await fetch(`/api/users/${userToToggle._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !userToToggle.isActive }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to update user access");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setUserToToggle(null);
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/users/${userToDelete._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setUserToDelete(null);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if ((session?.user as any)?.role !== "admin") {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage users and invite tokens</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/inactive-pastors")}>
            View Inactive Pastors
          </Button>
          <Button variant="outline" onClick={() => router.push("/admin/pastor-fields")}>
            Manage Pastor Fields
          </Button>
          <Button onClick={generateInviteToken} disabled={generatingToken}>
            {generatingToken ? "Generating..." : "Generate Invite Link"}
          </Button>
        </div>
      </div>

      {/* Users Section */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
          <CardDescription>Manage user access and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-gray-500">No users registered yet</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-gray-500">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => setUserToToggle(user)}>
                      {user.isActive ? "Revoke Access" : "Grant Access"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setUserToDelete(user)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Tokens Section */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Tokens</CardTitle>
          <CardDescription>View and manage invite tokens</CardDescription>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <p className="text-gray-500">No invite tokens generated yet</p>
          ) : (
            <div className="space-y-4">
              {tokens.map((token) => (
                <div
                  key={token._id}
                  className="flex flex-col lg:flex-row lg:items-center items-start gap-4 justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-mono text-sm">{token.token}</p>
                    <p className="text-sm text-gray-500">
                      Created {new Date(token.createdAt).toLocaleDateString()} • Expires{" "}
                      {new Date(token.expiresAt).toLocaleDateString()}
                    </p>
                    {token.usedBy && <p className="text-sm text-gray-500">Used by {token.usedBy.email}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        token.isUsed ? "secondary" : new Date() > new Date(token.expiresAt) ? "destructive" : "default"
                      }
                    >
                      {token.isUsed ? "Used" : new Date() > new Date(token.expiresAt) ? "Expired" : "Active"}
                    </Badge>
                    {!token.isUsed && new Date() < new Date(token.expiresAt) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = `${window.location.origin}/signup?token=${token.token}`;
                          navigator.clipboard.writeText(url);
                          toast.success("Signup link copied to clipboard");
                        }}
                      >
                        Copy Link
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toggle Access Confirmation Dialog */}
      <AlertDialog open={!!userToToggle} onOpenChange={() => setUserToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{userToToggle?.isActive ? "Revoke Access" : "Grant Access"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {userToToggle?.isActive ? "revoke access for" : "grant access to"}{" "}
              {userToToggle?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={toggleUserAccess}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.email}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

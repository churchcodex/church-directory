"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import AuthBackground from "@/components/AuthBackground";
import FLGlobalIcon from "@/components/assets/fl-global-icon";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [council, setCouncil] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setError("No invitation token provided. Please use a valid invitation link.");
        setIsLoading(false);
        return;
      }

      // Note: In a real scenario, you'd validate the token on the backend
      // For now, we'll just check if it exists and looks valid
      if (token.length > 0) {
        setTokenValid(true);
      } else {
        setError("Invalid invitation token.");
      }

      setIsLoading(false);
    };

    validateToken();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const token = searchParams.get("token");
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password, token }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to sign up");
        setError(data.error);
        return;
      }

      toast.success("Account created successfully! Please login.");
      router.push("/login");
    } catch (error) {
      toast.error("An error occurred during signup");
      setError("An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <AuthBackground />
        <Card className="w-full max-w-md relative z-10 bg-background/80 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Setting up your account...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid || error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <AuthBackground />
        <Card className="w-full max-w-md relative z-10 bg-background/20 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl text-red-500">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error || "Your invitation link is invalid or has expired."}</AlertDescription>
            </Alert>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please contact your administrator to request a new invitation link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <AuthBackground />
      <Card className="w-full max-w-md relative z-10 bg-background/20 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription className="text-white">Set your password to complete signup</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-4 relative">
          <AuthBackground />
          <Card className="w-full max-w-md relative z-10 bg-background/80 backdrop-blur-md border-white/20">
            <div className="flex justify-center mb-4 pt-6">
              <FLGlobalIcon className="h-8 w-auto" fill="currentColor" />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>Setting up your account...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SearchableSelect from "@/components/ui/searchable-select";
import { toast } from "sonner";
import Image from "next/image";

function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [council, setCouncil] = useState("");
  const [councils, setCouncils] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCouncils = async () => {
      try {
        const response = await fetch("/api/pastor-fields");
        const data = await response.json();
        if (response.ok && data.data?.councils?.options) {
          setCouncils(data.data.councils.options);
        }
      } catch (error) {
        console.error("Failed to fetch councils:", error);
      }
    };

    fetchCouncils();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!council) {
      toast.error("Please select a council");
      return;
    }

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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, council }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to sign up");
        return;
      }

      toast.success("Account created successfully! Please login.");
      router.push("/login");
    } catch (error) {
      toast.error("An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <Image src="/background-image.webp" alt="Background" fill className="object-cover" priority />
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <Card className="w-full max-w-md relative z-10 bg-background/20 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription className="text-white">Sign up to access the church directory</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="council">Council *</Label>
              <SearchableSelect
                value={council}
                onValueChange={setCouncil}
                options={councils.map((c) => ({ value: c, label: c }))}
                placeholder="Select your council"
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign Up"}
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
          <Image src="/background-image.webp" alt="Background" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <Card className="w-full max-w-md relative z-10 bg-background/80 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>Sign up to access the church directory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
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

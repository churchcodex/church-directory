"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Ban, CheckCircle, Loader2 } from "lucide-react";

interface DeactivateButtonProps {
  id: string;
  name: string;
  currentStatus?: string;
  onSuccess?: () => void;
}

export default function DeactivateButton({ id, name, currentStatus, onSuccess }: DeactivateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isActive = currentStatus === "Active";

  const handleToggle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pastors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isActive ? "Inactive" : "Active" }),
      });

      if (response.ok) {
        router.refresh();
        if (onSuccess) onSuccess();
      } else {
        alert("Failed to update status");
      }
    } catch (error) {
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={
            isActive
              ? "border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
              : "border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
          }
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isActive ? (
            <Ban className="mr-2 h-4 w-4" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          {isActive ? "Deactivate" : "Activate"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActive ? "Deactivate" : "Activate"} {name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to {isActive ? "deactivate" : "activate"} this pastor? This will change their status
            to {isActive ? "Inactive" : "Active"}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleToggle}
            disabled={loading}
            className={isActive ? "bg-orange-500 hover:bg-orange-600" : "bg-green-500 hover:bg-green-600"}
          >
            {loading ? "Processing..." : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

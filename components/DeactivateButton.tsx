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
import { UserX, UserCheck, Loader2 } from "lucide-react";

interface DeactivateButtonProps {
  id: string;
  name: string;
  currentStatus?: string;
  onSuccess?: () => void;
}

export default function DeactivateButton({ id, name, currentStatus, onSuccess }: DeactivateButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isInactive = currentStatus === "Inactive";
  const actionText = isInactive ? "Reactivate" : "Deactivate";
  const newStatus = isInactive ? "Active" : "Inactive";

  const handleStatusChange = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pastors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
        if (onSuccess) onSuccess();
      } else {
        alert(`Failed to ${actionText.toLowerCase()} pastor`);
      }
    } catch (error) {
      alert(`Failed to ${actionText.toLowerCase()} pastor`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={isInactive ? "default" : "destructive"} size="sm" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isInactive ? (
            <UserCheck className="mr-2 h-4 w-4" />
          ) : (
            <UserX className="mr-2 h-4 w-4" />
          )}
          {actionText}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{actionText} Pastor</AlertDialogTitle>
          <AlertDialogDescription>
            {isInactive ? (
              <>
                Are you sure you want to reactivate <strong>{name}</strong>? This will set their status to active and
                they will appear in the active pastors list.
              </>
            ) : (
              <>
                Are you sure you want to deactivate <strong>{name}</strong>? This will set their status to inactive. You
                can reactivate them later by editing their profile.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleStatusChange}>{actionText}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

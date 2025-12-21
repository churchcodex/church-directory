"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

function InactivityTracker({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

  const resetTimer = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only set timeout if user is logged in and did not opt into remember me
    if (session && !(session.user as any)?.rememberMe) {
      timeoutRef.current = setTimeout(() => {
        signOut({ callbackUrl: "/login?timeout=true" });
      }, INACTIVITY_TIMEOUT);
    }
  };

  useEffect(() => {
    if (!session) return;

    const rememberMeEnabled = Boolean((session.user as any)?.rememberMe);

    if (rememberMeEnabled) {
      return;
    }

    // Events that indicate user activity
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click", "keydown"];

    // Reset timer on any activity
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    // Start the initial timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [session]);

  return <>{children}</>;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <InactivityTracker>{children}</InactivityTracker>
    </SessionProvider>
  );
}

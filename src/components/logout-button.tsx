"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.dispatchEvent(new Event("riftprogress-profile-updated"));
      router.push("/auth");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <Button variant="secondary" onClick={logout} disabled={isLoggingOut}>
      <LogOut size={17} aria-hidden />
      {isLoggingOut ? "Logging out" : "Log out"}
    </Button>
  );
}

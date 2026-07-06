"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RefreshProfileButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/riot/refresh", { method: "POST" });
    const data = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Refresh failed");
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <Button type="button" variant="secondary" onClick={refresh} disabled={loading}>
        <RefreshCw
          size={17}
          className={loading ? "animate-spin" : undefined}
          aria-hidden
        />
        {loading ? "Refreshing" : "Refresh stats"}
      </Button>
      {error ? <p className="text-xs text-rose-200">{error}</p> : null}
    </div>
  );
}

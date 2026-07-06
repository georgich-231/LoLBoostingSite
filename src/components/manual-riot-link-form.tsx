"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const platforms = [
  "EUW1",
  "EUN1",
  "NA1",
  "KR",
  "BR1",
  "LA1",
  "LA2",
  "OC1",
  "TR1",
  "JP1",
];

export function ManualRiotLinkForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/riot/manual-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        riotId: String(form.get("riotId") ?? ""),
        platform: String(form.get("platform") ?? ""),
      }),
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to link Riot account");
      return;
    }

    window.dispatchEvent(new Event("riftprogress-profile-updated"));
    router.refresh();
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <label className="grid gap-2 text-sm text-zinc-300">
        Riot ID
        <Input name="riotId" placeholder="GameName#TAG" required />
      </label>
      <label className="grid gap-2 text-sm text-zinc-300">
        Platform
        <Select name="platform" defaultValue="EUW1">
          {platforms.map((platform) => (
            <option key={platform}>{platform}</option>
          ))}
        </Select>
      </label>
      {error ? (
        <div className="rounded-md border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
      <Button type="submit" disabled={loading}>
        <Link2 size={17} aria-hidden />
        {loading ? "Linking..." : "Link and sync Riot account"}
      </Button>
    </form>
  );
}

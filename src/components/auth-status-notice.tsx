"use client";

import { useSearchParams } from "next/navigation";

export function AuthStatusNotice() {
  const searchParams = useSearchParams();
  const oauth = searchParams.get("oauth");
  const error = searchParams.get("error");
  const riot = searchParams.get("riot");

  if (!error && !riot) {
    return null;
  }

  const message = error
    ? decodeURIComponent(error)
    : riot === "setup-required"
      ? "Riot OAuth is not configured yet."
      : `Riot linking status: ${riot}`;

  return (
    <div className="mt-5 rounded-md border border-amber-300/25 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
      <span className="font-semibold">
        {oauth ? `${oauth[0]?.toUpperCase()}${oauth.slice(1)} login` : "Account linking"}
      </span>
      : {message}
    </div>
  );
}

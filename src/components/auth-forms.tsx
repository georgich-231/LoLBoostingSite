"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "login" | "register";

export function AuthForms() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("register");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload =
      mode === "register"
        ? {
            name: String(form.get("name") ?? ""),
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
            termsAccepted: form.get("termsAccepted") === "on",
          }
        : {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          };

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as {
      error?: string;
      session?: { user?: { role?: string } };
    };

    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Authentication failed");
      return;
    }

    if (data.session?.user?.role === "ADMIN" || data.session?.user?.role === "SUPERADMIN") {
      router.push("/admin");
    } else if (data.session?.user?.role === "COACH") {
      router.push("/booster");
    } else if (searchParams.get("next") === "riot-link") {
      router.push("/api/riot/link/start");
    } else if (searchParams.get("next") === "admin") {
      router.push("/admin");
    } else if (searchParams.get("next") === "booster") {
      router.push("/booster");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 rounded-md border border-white/10 bg-white/6 p-1">
        {(["register", "login"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={
              mode === item
                ? "rounded-md bg-emerald-300 px-3 py-2 text-sm font-bold text-zinc-950"
                : "rounded-md px-3 py-2 text-sm font-semibold text-zinc-300"
            }
          >
            {item === "register" ? "Register" : "Login"}
          </button>
        ))}
      </div>
      <form className="mt-5 grid gap-3" onSubmit={submit}>
        {mode === "register" ? (
          <Input name="name" placeholder="Display name" autoComplete="name" required />
        ) : null}
        <Input name="email" type="email" placeholder="Email" autoComplete="email" required />
        <Input
          name="password"
          type="password"
          placeholder={mode === "register" ? "Platform password" : "Password"}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          minLength={mode === "register" ? 10 : 1}
          required
        />
        {mode === "register" ? (
          <label className="flex items-start gap-3 rounded-md border border-white/10 bg-white/6 p-3 text-sm leading-6 text-zinc-300">
            <input
              name="termsAccepted"
              type="checkbox"
              required
              className="mt-1 h-4 w-4 shrink-0 accent-emerald-300"
            />
            <span>
              I agree to the{" "}
              <Link
                href="/terms"
                className="font-semibold text-emerald-200 hover:text-emerald-100"
              >
                Terms of Service
              </Link>
              .
            </span>
          </label>
        ) : null}
        {error ? (
          <div className="rounded-md border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
        <button className={buttonVariants({ className: "w-full" })} type="submit" disabled={loading}>
          <Mail size={17} aria-hidden />
          {loading ? "Working..." : mode === "register" ? "Register" : "Login"}
        </button>
      </form>
    </div>
  );
}

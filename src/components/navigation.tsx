"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import logoFav from "@/app/images/logofav.png";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Profile" },
  { href: "/marketplace", label: "Boost Plans" },
  { href: "/orders", label: "Orders" },
  { href: "/terms", label: "Terms" },
];
const boosterNavItems = [
  { href: "/booster", label: "Booster" },
  { href: "/terms", label: "Terms" },
];
const adminNavItems = [
  { href: "/admin", label: "Admin" },
  { href: "/admin/support", label: "Support" },
  { href: "/terms", label: "Terms" },
];

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasLinkedRiot, setHasLinkedRiot] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";
  const isBooster = role === "COACH";
  const visibleNavItems = isAdmin ? adminNavItems : isBooster ? boosterNavItems : navItems;

  useEffect(() => {
    let active = true;

    async function loadProfileState() {
      try {
        const authResponse = await fetch("/api/auth/me", { cache: "no-store" });

        if (!authResponse.ok) {
          if (active) {
            setIsAuthenticated(false);
            setHasLinkedRiot(false);
            setRole(null);
          }
          return;
        }

        const auth = (await authResponse.json()) as {
          user?: { role?: string } | null;
        };
        const nextRole = auth.user?.role ?? null;
        const nextIsAdmin = nextRole === "ADMIN" || nextRole === "SUPERADMIN";
        const nextIsBooster = nextRole === "COACH";

        if (active) {
          setIsAuthenticated(true);
          setRole(nextRole);
        }

        if (nextIsAdmin || nextIsBooster) {
          if (active) {
            setHasLinkedRiot(true);
          }
          return;
        }

        const profileResponse = await fetch("/api/profile", { cache: "no-store" });

        if (active) {
          setHasLinkedRiot(
            profileResponse.ok
              ? Boolean(((await profileResponse.json()) as { profile?: unknown }).profile)
              : false,
          );
        }
      } catch {
        if (active) {
          setIsAuthenticated(false);
          setHasLinkedRiot(false);
          setRole(null);
        }
      }
    }

    void loadProfileState();
    window.addEventListener("riftprogress-profile-updated", loadProfileState);

    return () => {
      active = false;
      window.removeEventListener("riftprogress-profile-updated", loadProfileState);
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/78 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative h-12 w-12 overflow-hidden">
            <Image
              src={logoFav}
              alt=""
              fill
              priority
              sizes="48px"
              className="object-contain"
            />
          </span>
          <span className="text-base font-bold tracking-tight text-white">
            RiftProgress
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/8 hover:text-white",
                (pathname === item.href ||
                  (item.href === "/dashboard" && pathname.startsWith("/dashboard"))) &&
                  "bg-white/10 text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated && !hasLinkedRiot ? (
            <Link
              href="/api/riot/link/start"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              Link Riot
            </Link>
          ) : isAuthenticated === false ? (
            <Link
              href="/auth"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              Sign in
            </Link>
          ) : null}
        </div>

        <button
          type="button"
          className={buttonVariants({ variant: "ghost", size: "icon", className: "md:hidden" })}
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 px-4 pb-4 md:hidden">
          <nav className="grid gap-1 py-3" aria-label="Mobile primary">
          {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-3 text-sm font-medium text-zinc-200",
                  pathname === item.href ||
                    (item.href === "/dashboard" && pathname.startsWith("/dashboard"))
                    ? "bg-white/10"
                    : "hover:bg-white/8",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="grid gap-2">
            {isAuthenticated && !hasLinkedRiot ? (
              <Link
                href="/api/riot/link/start"
                onClick={() => setOpen(false)}
                className={buttonVariants({ variant: "primary" })}
              >
                Link Riot
              </Link>
            ) : isAuthenticated === false ? (
              <Link
                href="/auth"
                onClick={() => setOpen(false)}
                className={buttonVariants({ variant: "secondary" })}
              >
                Sign in
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}

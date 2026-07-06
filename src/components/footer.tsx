import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 text-sm text-zinc-400 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck size={18} className="text-emerald-300" aria-hidden />
            <span className="font-semibold">RiftProgress</span>
          </div>
          <p className="mt-3 max-w-md leading-6">
            Division boosts, net wins, placements, duo boosts, pay-per-game
            orders, configurable pricing, and customer-visible order tracking.
          </p>
        </div>
        <div className="grid gap-2">
          <span className="font-semibold text-white">Product</span>
          <Link href="/dashboard" className="hover:text-white">
            Profile dashboard
          </Link>
          <Link href="/marketplace" className="hover:text-white">
            Service marketplace
          </Link>
          <Link href="/orders" className="hover:text-white">
            Order tracking
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms of Service
          </Link>
        </div>
        <div className="grid gap-2">
          <span className="font-semibold text-white">Trust</span>
          <span>Manual or linked rank context</span>
          <span>Protected order handoff</span>
          <span>Admin-controlled pricing</span>
        </div>
      </div>
    </footer>
  );
}

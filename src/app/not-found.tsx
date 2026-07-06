import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[55svh] w-full max-w-3xl place-items-center px-4 py-16 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-200">
          404
        </p>
        <h1 className="mt-4 text-4xl font-black text-white">Page not found</h1>
        <p className="mt-3 text-zinc-400">
          This route is not part of the RiftProgress MVP surface.
        </p>
        <Link href="/" className={buttonVariants({ className: "mt-6" })}>
          <ArrowLeft size={17} aria-hidden />
          Back home
        </Link>
      </div>
    </main>
  );
}

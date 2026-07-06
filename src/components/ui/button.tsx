import * as React from "react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-emerald-400 text-zinc-950 shadow-[0_0_24px_rgba(52,211,153,0.25)] hover:bg-emerald-300 focus-visible:outline-emerald-300",
        secondary:
          "border border-white/15 bg-white/8 text-white hover:border-cyan-300/50 hover:bg-white/12 focus-visible:outline-cyan-300",
        ghost: "text-zinc-200 hover:bg-white/10 focus-visible:outline-white/40",
        danger:
          "bg-rose-400 text-zinc-950 hover:bg-rose-300 focus-visible:outline-rose-300",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-4",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

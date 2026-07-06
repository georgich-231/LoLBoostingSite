import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-white/12 bg-white/8 px-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/15",
        className,
      )}
      {...props}
    />
  );
}

import type { ReactNode } from "react";

import { cn } from "./cn";

export const InputField = ({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) => (
  <label className={cn("flex flex-col gap-2 text-sm text-muted", className)}>
    <span className="text-xs font-semibold uppercase tracking-wide text-muted">
      {label}
    </span>
    {children}
    {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    {error ? <span className="text-xs text-amber-200">{error}</span> : null}
  </label>
);

import type { ReactNode } from "react";

import { cn } from "./cn";

export const Card = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "rounded-2xl border border-border/70 bg-surface/80 p-5 shadow-card backdrop-blur",
      className,
    )}
  >
    {children}
  </div>
);

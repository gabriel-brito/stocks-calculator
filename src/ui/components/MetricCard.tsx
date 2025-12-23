import type { ReactNode } from "react";

import { cn } from "./cn";
import { Card } from "./Card";

export const MetricCard = ({
  label,
  value,
  subValue,
  badge,
  trend,
}: {
  label: string;
  value: string;
  subValue?: string;
  badge?: ReactNode;
  trend?: "up" | "down" | "neutral";
}) => (
  <Card className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      {badge}
    </div>
    <div
      className={cn(
        "text-2xl font-semibold font-mono tabular-nums",
        trend === "up" && "text-success",
        trend === "down" && "text-muted",
      )}
    >
      {value}
    </div>
    {subValue ? (
      <span className="text-xs text-muted">{subValue}</span>
    ) : null}
  </Card>
);

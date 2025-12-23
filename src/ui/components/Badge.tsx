import { cn } from "./cn";

type BadgeVariant = "success" | "info" | "neutral";

export const Badge = ({
  label,
  variant = "neutral",
}: {
  label: string;
  variant?: BadgeVariant;
}) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide",
      variant === "success" && "bg-success/20 text-success",
      variant === "info" && "bg-primary/20 text-primary",
      variant === "neutral" && "bg-white/10 text-muted",
    )}
  >
    {label}
  </span>
);

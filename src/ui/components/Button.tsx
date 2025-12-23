import type { ButtonHTMLAttributes } from "react";

import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

export const Button = ({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) => (
  <button
    className={cn(
      "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
      variant === "primary" && "bg-primary text-white hover:bg-primary/80",
      variant === "secondary" &&
        "border border-border/70 bg-surface/60 text-text hover:border-primary/60",
      variant === "ghost" && "text-muted hover:text-text",
      props.disabled && "cursor-not-allowed opacity-60",
      className,
    )}
    {...props}
  />
);

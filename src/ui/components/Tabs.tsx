import { cn } from "./cn";

export const Tabs = ({
  tabs,
  value,
  onChange,
}: {
  tabs: Array<{ value: string; label: string; disabled?: boolean }>;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex items-center gap-2 rounded-full bg-surface/60 p-1">
    {tabs.map((tab) => (
      <button
        key={tab.value}
        type="button"
        disabled={tab.disabled}
        onClick={() => onChange(tab.value)}
        className={cn(
          "rounded-full px-4 py-2 text-sm font-semibold transition",
          value === tab.value
            ? "bg-primary text-white"
            : "text-muted hover:text-text",
          tab.disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

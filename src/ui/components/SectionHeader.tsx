import type { ReactNode } from "react";

export const SectionHeader = ({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      {description ? (
        <p className="text-sm text-muted">{description}</p>
      ) : null}
    </div>
    {actions ? <div>{actions}</div> : null}
  </div>
);

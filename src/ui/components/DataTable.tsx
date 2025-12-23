import type { ReactNode } from "react";

export const DataTable = ({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) => (
  <div className="overflow-auto rounded-2xl border border-border/70">
    <table className="min-w-full border-collapse text-sm">
      <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-muted">
        <tr>
          {headers.map((header) => (
            <th className="px-4 py-3" key={header}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={`row-${rowIndex}`} className="border-t border-border/50">
            {row.map((cell, cellIndex) => (
              <td className="px-4 py-3 text-text" key={`cell-${rowIndex}-${cellIndex}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

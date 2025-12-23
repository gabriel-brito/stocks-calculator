"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/section-header";
import type { CapTableBase, DilutionEvent } from "@/domain/types";
import { computeFD } from "@/domain/calculations";
import { isValidYMD } from "@/domain/date";

interface CapTableSectionProps {
  capTable: CapTableBase;
  asOfDate: string;
  dilutionEvents: DilutionEvent[];
  onChange: (capTable: CapTableBase) => void;
}

export function CapTableSection({
  capTable,
  asOfDate,
  dilutionEvents,
  onChange,
}: CapTableSectionProps) {
  const fd = isValidYMD(asOfDate)
    ? computeFD(capTable, dilutionEvents, asOfDate)
    : 0;

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          title="Cap Table (FD)"
          subtitle="Estrutura de capital da empresa"
          tooltip="FD (Fully Diluted) = soma de todas as acoes, incluindo reservas de opcoes."
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="commonOutstanding">Common Outstanding</Label>
          <Input
            id="commonOutstanding"
            type="number"
            placeholder="ex: 1000000"
            value={capTable.commonOutstanding || ""}
            onChange={(e) =>
              onChange({ ...capTable, commonOutstanding: Number(e.target.value) || 0 })
            }
          />
          <p className="text-xs text-muted-foreground">Acoes ordinarias emitidas</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="optionPoolReserved">Option Pool Reserved</Label>
          <Input
            id="optionPoolReserved"
            type="number"
            placeholder="ex: 100000"
            value={capTable.optionPoolReserved || ""}
            onChange={(e) =>
              onChange({ ...capTable, optionPoolReserved: Number(e.target.value) || 0 })
            }
          />
          <p className="text-xs text-muted-foreground">Acoes reservadas para opcoes</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otherDilutive">Other Dilutive Shares</Label>
          <Input
            id="otherDilutive"
            type="number"
            placeholder="ex: 50000"
            value={capTable.otherDilutiveShares || ""}
            onChange={(e) =>
              onChange({ ...capTable, otherDilutiveShares: Number(e.target.value) || 0 })
            }
          />
          <p className="text-xs text-muted-foreground">Outras acoes dilutivas</p>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="font-semibold">FD Atual:</span>
            <span className="text-xl font-bold tabular-nums text-primary">
              {fd.toLocaleString("pt-BR")} shares
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

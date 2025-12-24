"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionHeader } from "@/components/section-header";
import { DatePicker } from "@/components/date-picker";
import type {
  CapTableBase,
  ConvertibleInstrument,
  DilutionEvent,
  ExitScenario,
  FinancingRound,
} from "@/domain/types";
import { computeConvertibleConversion, computeFD, computeFinancingRounds } from "@/domain/calculations";
import { getExitEquityValue } from "@/domain/exit";

type ConvertiblesSectionProps = {
  convertibles: ConvertibleInstrument[];
  financingRounds: FinancingRound[];
  capTableBase: CapTableBase;
  dilutionEvents: DilutionEvent[];
  exitScenario?: ExitScenario;
  onAdd: () => void;
  onUpdate: (index: number, updates: Partial<ConvertibleInstrument>) => void;
  onRemove: (index: number) => void;
};

export function ConvertiblesSection({
  convertibles,
  financingRounds,
  capTableBase,
  dilutionEvents,
  exitScenario,
  onAdd,
  onUpdate,
  onRemove,
}: ConvertiblesSectionProps) {
  const roundResults = computeFinancingRounds(financingRounds, capTableBase, dilutionEvents);
  const nextRound = roundResults[0];

  const exitFD =
    exitScenario?.date ? computeFD(capTableBase, dilutionEvents, exitScenario.date) : 0;
  const exitSharePrice =
    exitScenario && exitFD > 0 ? getExitEquityValue(exitScenario) / exitFD : 0;

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          title="Convertibles"
          subtitle="SAFE / Note com cap e desconto."
          tooltip="Convertiveis podem converter na proxima rodada ou no exit."
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {convertibles.map((conv, index) => {
          const roundPreview =
            nextRound && (conv.convertsOn === "NEXT_EQUITY_ROUND" || conv.convertsOn === "BOTH")
              ? computeConvertibleConversion(conv, nextRound.pricePerShare, nextRound.preRoundFD, nextRound.round.date)
              : null;
          const exitPreview =
            exitScenario && (conv.convertsOn === "EXIT" || conv.convertsOn === "BOTH") && exitSharePrice > 0
              ? computeConvertibleConversion(conv, exitSharePrice, exitFD, exitScenario.date)
              : null;

          return (
            <Card key={conv.id} className="border-border/60">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="text-sm font-semibold">{conv.id}</div>
                  <Button variant="ghost" size="sm" onClick={() => onRemove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={conv.type}
                      onValueChange={(value) =>
                        onUpdate(index, { type: value as ConvertibleInstrument["type"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAFE">SAFE</SelectItem>
                        <SelectItem value="NOTE">NOTE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Converte em</Label>
                    <Select
                      value={conv.convertsOn}
                      onValueChange={(value) =>
                        onUpdate(index, { convertsOn: value as ConvertibleInstrument["convertsOn"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEXT_EQUITY_ROUND">Next Equity Round</SelectItem>
                        <SelectItem value="EXIT">Exit</SelectItem>
                        <SelectItem value="BOTH">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de emissao</Label>
                    <DatePicker
                      value={conv.dateIssued}
                      onChange={(date) => onUpdate(index, { dateIssued: date as ConvertibleInstrument["dateIssued"] })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={conv.amount}
                      onChange={(event) => onUpdate(index, { amount: Number(event.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cap (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={conv.cap ?? ""}
                      onChange={(event) =>
                        onUpdate(index, { cap: event.target.value === "" ? undefined : Number(event.target.value) })
                      }
                      placeholder="opcional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount (0-1)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={conv.discount ?? ""}
                      onChange={(event) =>
                        onUpdate(index, { discount: event.target.value === "" ? undefined : Number(event.target.value) })
                      }
                      placeholder="ex: 0.2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Interest Rate (NOTE)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={conv.interestRate ?? ""}
                      onChange={(event) =>
                        onUpdate(index, {
                          interestRate: event.target.value === "" ? undefined : Number(event.target.value),
                        })
                      }
                      placeholder="ex: 0.1"
                      disabled={conv.type !== "NOTE"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Maturity Date (NOTE)</Label>
                    <DatePicker
                      value={conv.maturityDate ?? ""}
                      onChange={(date) => onUpdate(index, { maturityDate: date as ConvertibleInstrument["maturityDate"] })}
                    />
                  </div>
                </div>

                {(roundPreview || exitPreview) && (
                  <div className="pt-4 border-t space-y-2 text-sm">
                    {roundPreview && nextRound && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Next round price (R$ {nextRound.pricePerShare.toFixed(4)}):
                        </span>
                        <span className="font-semibold tabular-nums">
                          {roundPreview.sharesIssued.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} shares
                        </span>
                      </div>
                    )}
                    {exitPreview && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Exit price (R$ {exitSharePrice.toFixed(4)}):
                        </span>
                        <span className="font-semibold tabular-nums">
                          {exitPreview.sharesIssued.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} shares
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Button onClick={onAdd} variant="outline" className="w-full bg-transparent">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Convertible
        </Button>
      </CardContent>
    </Card>
  );
}

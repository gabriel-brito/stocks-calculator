"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/section-header";
import { DatePicker } from "@/components/date-picker";
import type { CapTableBase, DilutionEvent, FinancingRound } from "@/domain/types";
import { computeFinancingRounds } from "@/domain/calculations";

type FinancingRoundsSectionProps = {
  rounds: FinancingRound[];
  capTableBase: CapTableBase;
  dilutionEvents: DilutionEvent[];
  onAdd: () => void;
  onUpdate: (index: number, updates: Partial<FinancingRound>) => void;
  onRemove: (index: number) => void;
  onApply: () => void;
};

export function FinancingRoundsSection({
  rounds,
  capTableBase,
  dilutionEvents,
  onAdd,
  onUpdate,
  onRemove,
  onApply,
}: FinancingRoundsSectionProps) {
  const results = computeFinancingRounds(rounds, capTableBase, dilutionEvents);

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          title="Financing Rounds"
          subtitle="Modele rodadas com pre-money, investimento e pool top-up."
          tooltip="Calculo automatico de price/share, novas shares e aumento do pool."
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {rounds.map((round, index) => {
          const result = results[index];
          return (
            <Card key={`${round.seriesName}-${index}`} className="border-border/60">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="text-sm font-semibold">{round.seriesName}</div>
                  <Button variant="ghost" size="sm" onClick={() => onRemove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data da rodada</Label>
                    <DatePicker
                      value={round.date}
                      onChange={(date) => onUpdate(index, { date: date as FinancingRound["date"] })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome da serie</Label>
                    <Input
                      value={round.seriesName}
                      onChange={(event) => onUpdate(index, { seriesName: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pre-money (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={round.preMoney}
                      onChange={(event) =>
                        onUpdate(index, { preMoney: Number(event.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Investment Amount (R$)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={round.investmentAmount}
                      onChange={(event) =>
                        onUpdate(index, { investmentAmount: Number(event.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Option Pool Post % (opcional)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={round.targetOptionPoolPostPercent ?? ""}
                      onChange={(event) =>
                        onUpdate(index, {
                          targetOptionPoolPostPercent:
                            event.target.value === "" ? undefined : Number(event.target.value),
                        })
                      }
                      placeholder="ex: 0.15"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Share Class ID (opcional)</Label>
                    <Input
                      value={round.createsShareClassId ?? ""}
                      onChange={(event) =>
                        onUpdate(index, {
                          createsShareClassId:
                            event.target.value === "" ? undefined : event.target.value,
                        })
                      }
                      placeholder="ex: series-a"
                    />
                  </div>
                </div>

                {result ? (
                  <div className="pt-4 border-t space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price per share:</span>
                      <span className="font-semibold tabular-nums">
                        R$ {result.pricePerShare.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">New shares:</span>
                      <span className="font-semibold tabular-nums">
                        {result.newShares.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pool top-up:</span>
                      <span className="font-semibold tabular-nums">
                        {result.poolIncrease.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Post-round FD:</span>
                      <span className="font-semibold tabular-nums">
                        {result.postRoundFD.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}

        <div className="flex flex-col gap-2">
          <Button onClick={onAdd} variant="outline" className="w-full bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Rodada
          </Button>
          <Button onClick={onApply} variant="default" className="w-full">
            Gerar automaticamente shares
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/section-header";
import { DatePicker } from "@/components/date-picker";
import type {
  AccelerationType,
  CapTableBase,
  DilutionEvent,
  OptionGrant,
  ValuationPoint,
  VestingFrequency,
} from "@/domain/types";
import { computeFD, computeOptionsSnapshot } from "@/domain/calculations";
import { addMonthsKeepDayClamped, isValidYMD, parseYMD } from "@/domain/date";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StockOptionsSectionProps {
  grants: OptionGrant[];
  currentValuation: ValuationPoint;
  capTable: CapTableBase;
  dilutionEvents: DilutionEvent[];
  onChange: (grants: OptionGrant[]) => void;
}

const MIN_DATE = new Date("2015-01-01");
const MAX_DATE = new Date();

export function StockOptionsSection({
  grants,
  currentValuation,
  capTable,
  dilutionEvents,
  onChange,
}: StockOptionsSectionProps) {
  const addGrant = () => {
    const newGrant: OptionGrant = {
      quantityGranted: 0,
      strikePrice: 0,
      grantDate: currentValuation.date,
      vestingSchedule: {
        startDate: currentValuation.date,
        cliffMonths: 12,
        totalMonths: 36,
        frequency: "MONTHLY",
      },
      acceleration: {
        type: "NONE",
        percent: 0,
      },
    };
    onChange([...grants, newGrant]);
  };

  const updateGrant = (index: number, updates: Partial<OptionGrant>) => {
    onChange(grants.map((grant, idx) => (idx === index ? { ...grant, ...updates } : grant)));
  };

  const removeGrant = (index: number) => {
    onChange(grants.filter((_, idx) => idx !== index));
  };

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          title="Stock Options"
          subtitle="Opcoes de acoes com vesting configuravel"
          tooltip="Defina cliff, duracao total e frequencia para calcular o vesting."
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {grants.map((grant, index) => {
          const canComputeSnapshot =
            isValidYMD(currentValuation.date) &&
            currentValuation.equityValue > 0 &&
            isValidYMD(grant.grantDate);
          const fdAsOf = canComputeSnapshot
            ? computeFD(capTable, dilutionEvents, currentValuation.date)
            : 0;
          const snapshot =
            fdAsOf > 0
              ? computeOptionsSnapshot(
                  grant,
                  currentValuation,
                  capTable,
                  dilutionEvents,
                  currentValuation.date,
                )
              : null;
          const vestingProgress =
            grant.quantityGranted > 0
              ? ((snapshot?.vestedQty ?? 0) / grant.quantityGranted) * 100
              : 0;
          const schedule = grant.vestingSchedule;
          const endDate =
            isValidYMD(schedule.startDate) &&
            schedule.totalMonths > 0
              ? addMonthsKeepDayClamped(
                  schedule.startDate,
                  schedule.totalMonths,
                  parseYMD(schedule.startDate).d,
                )
              : "—";

          return (
            <Card key={`grant-${index}`} className="border-muted">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Grant</Badge>
                    {vestingProgress > 0 ? (
                      <Badge variant={vestingProgress >= 100 ? "success" : "default"}>
                        {vestingProgress.toFixed(0)}% vested
                      </Badge>
                    ) : null}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeGrant(index)} type="button">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data do Grant</Label>
                    <DatePicker
                      value={grant.grantDate}
                      onChange={(date) =>
                        updateGrant(index, {
                          grantDate: date as OptionGrant["grantDate"],
                        })
                      }
                      placeholder="Selecione a data"
                      minDate={MIN_DATE}
                      maxDate={MAX_DATE}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade Granted</Label>
                    <Input
                      type="number"
                      placeholder="ex: 10000"
                      value={grant.quantityGranted || ""}
                      onChange={(e) =>
                        updateGrant(index, { quantityGranted: Number(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Strike Price (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="ex: 1.50"
                      value={grant.strikePrice || ""}
                      onChange={(e) =>
                        updateGrant(index, { strikePrice: Number(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Expiration Date (Opcional)</Label>
                    <DatePicker
                      value={grant.expirationDate || ""}
                      onChange={(date) =>
                        updateGrant(index, {
                          expirationDate: date as OptionGrant["expirationDate"],
                        })
                      }
                      placeholder="Selecione a data"
                      minDate={MIN_DATE}
                      maxDate={new Date("2050-12-31")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Termination Date (Opcional)</Label>
                    <DatePicker
                      value={grant.terminationDate || ""}
                      onChange={(date) =>
                        updateGrant(index, {
                          terminationDate: date as OptionGrant["terminationDate"],
                        })
                      }
                      placeholder="Selecione a data"
                      minDate={MIN_DATE}
                      maxDate={MAX_DATE}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Exercise Window (dias)</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="ex: 90"
                      value={grant.postTerminationExerciseWindowDays ?? ""}
                      onChange={(e) =>
                        updateGrant(index, {
                          postTerminationExerciseWindowDays:
                            e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/60 pt-4">
                  <div className="space-y-2">
                    <Label>Inicio do Vesting</Label>
                    <DatePicker
                      value={schedule.startDate}
                      onChange={(date) =>
                        updateGrant(index, {
                          vestingSchedule: {
                            ...schedule,
                            startDate: date as OptionGrant["vestingSchedule"]["startDate"],
                          },
                        })
                      }
                      placeholder="Selecione a data"
                      minDate={MIN_DATE}
                      maxDate={MAX_DATE}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cliff (meses)</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="ex: 12"
                      value={schedule.cliffMonths || ""}
                      onChange={(e) =>
                        updateGrant(index, {
                          vestingSchedule: {
                            ...schedule,
                            cliffMonths: Number(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total (meses)</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="ex: 36"
                      value={schedule.totalMonths || ""}
                      onChange={(e) =>
                        updateGrant(index, {
                          vestingSchedule: {
                            ...schedule,
                            totalMonths: Number(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequencia</Label>
                    <Select
                      value={schedule.frequency}
                      onValueChange={(value) =>
                        updateGrant(index, {
                          vestingSchedule: {
                            ...schedule,
                            frequency: value as VestingFrequency,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Acceleration</Label>
                    <Select
                      value={grant.acceleration?.type ?? "NONE"}
                      onValueChange={(value) =>
                        updateGrant(index, {
                          acceleration: {
                            type: value as AccelerationType,
                            percent: grant.acceleration?.percent ?? 0,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">None</SelectItem>
                        <SelectItem value="SINGLE_TRIGGER">Single Trigger</SelectItem>
                        <SelectItem value="DOUBLE_TRIGGER">Double Trigger</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Acceleration %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      step="0.01"
                      placeholder="ex: 1"
                      value={grant.acceleration?.percent ?? ""}
                      onChange={(e) =>
                        updateGrant(index, {
                          acceleration: {
                            type: grant.acceleration?.type ?? "NONE",
                            percent: Number(e.target.value) || 0,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Fim do vesting:</span>
                  <span className="tabular-nums">{endDate}</span>
                </div>

                {grant.grantDate && grant.quantityGranted > 0 && snapshot ? (
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vested Today:</span>
                      <span className="font-semibold tabular-nums">
                        {snapshot.vestedQty.toLocaleString("pt-BR")} shares
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Exercisable:</span>
                      <span className="font-semibold tabular-nums">
                        {snapshot.exercisableQty.toLocaleString("pt-BR")} shares
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Intrinsic Value:</span>
                      <span className="font-semibold tabular-nums text-success">
                        R$ {snapshot.intrinsicValueVested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                    <p>Preencha os dados abaixo para calcular o grant:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {!isValidYMD(currentValuation.date) ? (
                        <li>Data de Current Valuation</li>
                      ) : null}
                      {currentValuation.equityValue <= 0 ? (
                        <li>Equity Value (Current) &gt; 0</li>
                      ) : null}
                      {!isValidYMD(grant.grantDate) ? (
                        <li>Data do Grant</li>
                      ) : null}
                      {fdAsOf <= 0 ? (
                        <li>Cap Table (FD) &gt; 0</li>
                      ) : null}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Button onClick={addGrant} variant="outline" className="w-full bg-transparent" type="button">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Grant
        </Button>
      </CardContent>
    </Card>
  );
}

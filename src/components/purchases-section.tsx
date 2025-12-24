"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionHeader } from "@/components/section-header";
import { DatePicker } from "@/components/date-picker";
import type { ContributionChange, PurchasePlan, PurchasePriceMode, ValuationPoint } from "@/domain/types";
import {
  computePurchasePlanSnapshot,
  generateMonthlyPurchaseDates,
  getMonthlyAmountEffective,
  getPurchaseSharePrice,
} from "@/domain/calculations";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { computeFD } from "@/domain/calculations";
import type { CapTableBase, DilutionEvent } from "@/domain/types";
import { isValidYMD } from "@/domain/date";

interface PurchasesSectionProps {
  plans: PurchasePlan[];
  entryValuation: ValuationPoint;
  currentValuation: ValuationPoint;
  capTable: CapTableBase;
  dilutionEvents: DilutionEvent[];
  onChange: (plans: PurchasePlan[]) => void;
}

const MIN_DATE = new Date("2015-01-01");
const MAX_DATE = new Date();

export function PurchasesSection({
  plans,
  entryValuation,
  currentValuation,
  capTable,
  dilutionEvents,
  onChange,
}: PurchasesSectionProps) {
  const entryFD = isValidYMD(entryValuation.date)
    ? computeFD(capTable, dilutionEvents, entryValuation.date)
    : 0;

  const addPlan = () => {
    const newPlan: PurchasePlan = {
      startDate: entryValuation.date,
      purchaseDayOfMonth: 1,
      purchasePriceMode: "ENTRY_VALUATION_ANCHORED",
      purchaseSharePriceFixed: undefined,
      monthlyAmount: 0,
      contributionChanges: [],
    };
    onChange([...plans, newPlan]);
  };

  const updatePlan = (index: number, updates: Partial<PurchasePlan>) => {
    onChange(plans.map((plan, idx) => (idx === index ? { ...plan, ...updates } : plan)));
  };

  const removePlan = (index: number) => {
    onChange(plans.filter((_, idx) => idx !== index));
  };

  const addContributionChange = (index: number) => {
    const plan = plans[index];
    if (!plan || (plan.contributionChanges?.length ?? 0) >= 5) return;

    const newChange: ContributionChange = {
      effectiveDate: currentValuation.date,
      monthlyAmount: 0,
    };

    updatePlan(index, {
      contributionChanges: [...(plan.contributionChanges ?? []), newChange],
    });
  };

  const updateContributionChange = (
    planIndex: number,
    changeIndex: number,
    updates: Partial<ContributionChange>,
  ) => {
    const plan = plans[planIndex];
    if (!plan) return;
    const updated = [...(plan.contributionChanges ?? [])];
    updated[changeIndex] = { ...updated[changeIndex], ...updates };
    updatePlan(planIndex, { contributionChanges: updated });
  };

  const removeContributionChange = (planIndex: number, changeIndex: number) => {
    const plan = plans[planIndex];
    if (!plan) return;
    updatePlan(planIndex, {
      contributionChanges: (plan.contributionChanges ?? []).filter((_, idx) => idx !== changeIndex),
    });
  };

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          title="Compras Recorrentes (DCA)"
          subtitle="Planos de aporte mensal com preco fixo"
          tooltip="DCA = Dollar Cost Averaging. Compra mensal com preco fixo ou ancorado no Entry."
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {plans.map((plan, index) => {
          const canComputeEntry =
            entryFD > 0 &&
            entryValuation.equityValue > 0 &&
            isValidYMD(entryValuation.date);
          const purchasePrice =
            plan.purchasePriceMode === "FIXED_SHARE_PRICE"
              ? plan.purchaseSharePriceFixed ?? 0
              : canComputeEntry
                ? getPurchaseSharePrice(plan, entryValuation, entryFD)
                : 0;
          const canComputeSnapshot =
            canComputeEntry &&
            purchasePrice > 0 &&
            isValidYMD(plan.startDate) &&
            isValidYMD(currentValuation.date);
          const snapshot = canComputeSnapshot
            ? computePurchasePlanSnapshot(
                plan,
                entryValuation,
                currentValuation,
                capTable,
                dilutionEvents,
                currentValuation.date,
              )
            : null;
          const currentEffectiveAmount = canComputeSnapshot
            ? getMonthlyAmountEffective(plan, currentValuation.date)
            : plan.monthlyAmount;
          const isPaused = currentEffectiveAmount === 0;
          const totalMonths = canComputeSnapshot
            ? generateMonthlyPurchaseDates(
                plan.startDate,
                currentValuation.date,
                plan.purchaseDayOfMonth,
              ).length
            : 0;

          return (
            <Card key={`plan-${index}`} className="border-muted">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Plano DCA</Badge>
                    {isPaused ? <Badge variant="secondary">Pausado</Badge> : null}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removePlan(index)} type="button">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Inicio</Label>
                    <DatePicker
                      value={plan.startDate}
                      onChange={(date) =>
                        updatePlan(index, {
                          startDate: date as PurchasePlan["startDate"],
                        })
                      }
                      placeholder="Selecione a data"
                      minDate={MIN_DATE}
                      maxDate={MAX_DATE}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Dia do Mes para Compra</Label>
                    <Select
                      value={plan.purchaseDayOfMonth.toString()}
                      onValueChange={(value) =>
                        updatePlan(index, { purchaseDayOfMonth: Number(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            Dia {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Modo de Preco</Label>
                    <Select
                      value={plan.purchasePriceMode}
                      onValueChange={(value) =>
                        updatePlan(index, { purchasePriceMode: value as PurchasePriceMode })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENTRY_VALUATION_ANCHORED">
                          Ancorado no Entry Valuation
                        </SelectItem>
                        <SelectItem value="FIXED_SHARE_PRICE">
                          Preco Fixo por Share
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {plan.purchasePriceMode === "ENTRY_VALUATION_ANCHORED"
                        ? "purchasePrice = entryEquityValue / FD(entry)"
                        : "Preco fixo por share definido por voce"}
                    </p>
                  </div>

                  {plan.purchasePriceMode === "FIXED_SHARE_PRICE" ? (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Preco Fixo por Share (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="ex: 2.50"
                        value={plan.purchaseSharePriceFixed || ""}
                        onChange={(e) =>
                          updatePlan(index, {
                            purchaseSharePriceFixed: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  ) : null}

                  <div className="space-y-2 md:col-span-2">
                    <Label>Aporte Mensal Baseline (R$)</Label>
                    <Input
                      type="number"
                      placeholder="ex: 1000"
                      value={plan.monthlyAmount || ""}
                      onChange={(e) =>
                        updatePlan(index, { monthlyAmount: Number(e.target.value) || 0 })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Valor mensal padrao ate uma mudanca de contribuicao
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium">Mudancas de Contribuicao (max 5)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addContributionChange(index)}
                      disabled={(plan.contributionChanges?.length ?? 0) >= 5}
                      type="button"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  {(plan.contributionChanges ?? []).map((change, changeIndex) => (
                    <Card key={`change-${changeIndex}`} className="border-muted/50">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <Badge variant="secondary">Mudanca {changeIndex + 1}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeContributionChange(index, changeIndex)}
                            type="button"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Data Efetiva</Label>
                            <DatePicker
                              value={change.effectiveDate}
                              onChange={(date) =>
                                updateContributionChange(index, changeIndex, {
                                  effectiveDate: date as ContributionChange["effectiveDate"],
                                })
                              }
                              placeholder="Selecione a data"
                              minDate={MIN_DATE}
                              maxDate={MAX_DATE}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Novo Valor Mensal (R$)</Label>
                            <Input
                              type="number"
                              placeholder="0 = pausar"
                              value={change.monthlyAmount || ""}
                              onChange={(e) =>
                                updateContributionChange(index, changeIndex, {
                                  monthlyAmount: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {snapshot ? (
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Meses Avaliados:</span>
                      <span className="font-semibold tabular-nums">{totalMonths}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Aportes Executados:</span>
                      <span className="font-semibold tabular-nums">
                        {snapshot.numPurchasesExecuted}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Investido:</span>
                      <span className="font-semibold tabular-nums text-primary">
                        R$ {snapshot.investedTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shares Acumuladas:</span>
                      <span className="font-semibold tabular-nums text-success">
                        {snapshot.sharesTotal.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} shares
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Preco de compra:</span>
                      <span>R$ {purchasePrice.toFixed(4)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                    <p>Preencha os dados abaixo para calcular o plano:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {!isValidYMD(plan.startDate) ? <li>Data de inicio</li> : null}
                      {!isValidYMD(entryValuation.date) ? (
                        <li>Data de Entry Valuation</li>
                      ) : null}
                      {entryValuation.equityValue <= 0 ? (
                        <li>Equity Value (Entry) &gt; 0</li>
                      ) : null}
                      {entryFD <= 0 ? <li>Cap Table (FD) &gt; 0</li> : null}
                      {plan.purchasePriceMode === "FIXED_SHARE_PRICE" &&
                      (plan.purchaseSharePriceFixed ?? 0) <= 0 ? (
                        <li>Preco fixo por share &gt; 0</li>
                      ) : null}
                      {!isValidYMD(currentValuation.date) ? (
                        <li>Data de Current Valuation</li>
                      ) : null}
                      {purchasePrice <= 0 ? <li>Preco de compra valido</li> : null}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        <Button onClick={addPlan} variant="outline" className="w-full bg-transparent" type="button">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Plano DCA
        </Button>
      </CardContent>
    </Card>
  );
}

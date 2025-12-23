"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/section-header";
import { DatePicker } from "@/components/date-picker";
import { Switch } from "@/components/ui/switch";
import type { CapTableBase, DilutionEvent, ExitScenario, ValuationPoint } from "@/domain/types";
import { computeFD, computeSharePrice } from "@/domain/calculations";
import { isValidYMD } from "@/domain/date";

interface ValuationsSectionProps {
  entryValuation: ValuationPoint;
  currentValuation: ValuationPoint;
  exitValuation: ExitScenario | undefined;
  exitEnabled: boolean;
  capTable: CapTableBase;
  dilutionEvents: DilutionEvent[];
  onEntryChange: (val: ValuationPoint) => void;
  onCurrentChange: (val: ValuationPoint) => void;
  onExitChange: (val: ExitScenario | undefined) => void;
  onExitEnabledChange: (enabled: boolean) => void;
}

const MIN_DATE = new Date("2015-01-01");
const MAX_DATE = new Date();

export function ValuationsSection({
  entryValuation,
  currentValuation,
  exitValuation,
  exitEnabled,
  capTable,
  dilutionEvents,
  onEntryChange,
  onCurrentChange,
  onExitChange,
  onExitEnabledChange,
}: ValuationsSectionProps) {
  const entryFD = isValidYMD(entryValuation.date)
    ? computeFD(capTable, dilutionEvents, entryValuation.date)
    : 0;
  const currentFD = isValidYMD(currentValuation.date)
    ? computeFD(capTable, dilutionEvents, currentValuation.date)
    : 0;
  const exitFD =
    exitEnabled && exitValuation && isValidYMD(exitValuation.date)
      ? computeFD(capTable, dilutionEvents, exitValuation.date)
      : 0;

  const entrySharePrice =
    entryValuation.equityValue > 0 && entryFD > 0
      ? computeSharePrice(entryValuation.equityValue, entryFD)
      : 0;
  const currentSharePrice =
    currentValuation.equityValue > 0 && currentFD > 0
      ? computeSharePrice(currentValuation.equityValue, currentFD)
      : 0;
  const exitSharePrice =
    exitEnabled && exitValuation && exitValuation.exitEquityValue > 0 && exitFD > 0
      ? computeSharePrice(exitValuation.exitEquityValue, exitFD)
      : 0;

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          title="Valuations"
          subtitle="Valuacoes em diferentes momentos"
          tooltip="Entry = quando comecou a investir. Current = valuation atual. Exit = simulacao de venda."
        />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 pb-4 border-b">
          <h4 className="font-medium text-sm">Entry Valuation</h4>
          <div className="space-y-2">
            <Label>Data de Entry</Label>
            <DatePicker
              value={entryValuation.date}
              onChange={(date) =>
                onEntryChange({
                  ...entryValuation,
                  date: date as ValuationPoint["date"],
                })
              }
              placeholder="Selecione a data"
              minDate={MIN_DATE}
              maxDate={MAX_DATE}
            />
          </div>
          <div className="space-y-2">
            <Label>Equity Value (R$)</Label>
            <Input
              type="number"
              placeholder="ex: 10000000"
              value={entryValuation.equityValue || ""}
              onChange={(e) =>
                onEntryChange({
                  ...entryValuation,
                  equityValue: Number(e.target.value) || 0,
                })
              }
            />
          </div>
          {entryValuation.equityValue > 0 && entryFD > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Share Price (Entry):</span>
              <span className="font-semibold tabular-nums">
                R$ {entrySharePrice.toFixed(4)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 pb-4 border-b">
          <h4 className="font-medium text-sm">Current Valuation</h4>
          <div className="space-y-2">
            <Label>Data Atual</Label>
            <DatePicker
              value={currentValuation.date}
              onChange={(date) =>
                onCurrentChange({
                  ...currentValuation,
                  date: date as ValuationPoint["date"],
                })
              }
              placeholder="Selecione a data"
              minDate={MIN_DATE}
              maxDate={MAX_DATE}
            />
          </div>
          <div className="space-y-2">
            <Label>Equity Value (R$)</Label>
            <Input
              type="number"
              placeholder="ex: 15000000"
              value={currentValuation.equityValue || ""}
              onChange={(e) =>
                onCurrentChange({
                  ...currentValuation,
                  equityValue: Number(e.target.value) || 0,
                })
              }
            />
          </div>
          {currentValuation.equityValue > 0 && currentFD > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Share Price (Current):</span>
              <span className="font-semibold tabular-nums">
                R$ {currentSharePrice.toFixed(4)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Exit Valuation (Opcional)</h4>
            <div className="flex items-center gap-2">
              <Label htmlFor="exit-toggle" className="text-sm">
                Simular venda
              </Label>
              <Switch
                id="exit-toggle"
                checked={exitEnabled}
                onCheckedChange={onExitEnabledChange}
              />
            </div>
          </div>

          {exitEnabled ? (
            <>
              <div className="space-y-2">
                <Label>Data de Exit</Label>
                <DatePicker
                  value={exitValuation?.date || ""}
                  onChange={(date) =>
                    onExitChange(
                      exitValuation
                        ? { ...exitValuation, date: date as ExitScenario["date"] }
                        : { date: date as ExitScenario["date"], exitEquityValue: 0 },
                    )
                  }
                  placeholder="Selecione a data futura"
                  minDate={MIN_DATE}
                  maxDate={new Date("2050-12-31")}
                />
              </div>
              <div className="space-y-2">
                <Label>Equity Value (R$)</Label>
                <Input
                  type="number"
                  placeholder="ex: 50000000"
                  value={exitValuation?.exitEquityValue || ""}
                  onChange={(e) =>
                    onExitChange(
                      exitValuation
                        ? {
                            ...exitValuation,
                            exitEquityValue: Number(e.target.value) || 0,
                          }
                        : {
                            date: currentValuation.date as ExitScenario["date"],
                            exitEquityValue: Number(e.target.value) || 0,
                          },
                    )
                  }
                />
              </div>
              {exitValuation && exitValuation.exitEquityValue > 0 && exitFD > 0 ? (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Share Price (Exit):</span>
                  <span className="font-semibold tabular-nums">
                    R$ {exitSharePrice.toFixed(4)}
                  </span>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

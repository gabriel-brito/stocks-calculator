"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/section-header";
import { DatePicker } from "@/components/date-picker";
import type { CapTableBase, DilutionEvent, OptionGrant, ValuationPoint } from "@/domain/types";
import { computeOptionsSnapshot } from "@/domain/calculations";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      vesting: "25_25_50",
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
          subtitle="Opcoes de acoes com vesting"
          tooltip="Grants com vesting 25/25/50 em 12, 24 e 36 meses completos."
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {grants.map((grant, index) => {
          const snapshot = computeOptionsSnapshot(
            grant,
            currentValuation,
            capTable,
            dilutionEvents,
            currentValuation.date,
          );
          const vestingProgress =
            grant.quantityGranted > 0
              ? (snapshot.vestedQty / grant.quantityGranted) * 100
              : 0;

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
                </div>

                {grant.grantDate && grant.quantityGranted > 0 ? (
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vested Today:</span>
                      <span className="font-semibold tabular-nums">
                        {snapshot.vestedQty.toLocaleString("pt-BR")} shares
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Intrinsic Value:</span>
                      <span className="font-semibold tabular-nums text-success">
                        R$ {snapshot.intrinsicValueVested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ) : null}
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

"use client";

import { Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionHeader } from "@/components/section-header";
import type { ShareClass } from "@/domain/types";

type ShareClassesSectionProps = {
  shareClasses: ShareClass[];
  onAdd: () => void;
  onUpdate: (index: number, updates: Partial<ShareClass>) => void;
  onRemove: (index: number) => void;
};

export function ShareClassesSection({
  shareClasses,
  onAdd,
  onUpdate,
  onRemove,
}: ShareClassesSectionProps) {
  const commonCount = shareClasses.filter((item) => item.type === "COMMON").length;

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          title="Share Classes"
          subtitle="Defina classes Common e Preferred para o waterfall."
          tooltip="Preferred recebe 1x de preferência antes de converter. Common participa apenas do residual."
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {shareClasses.map((shareClass, index) => {
          const isOnlyCommon = shareClass.type === "COMMON" && commonCount === 1;
          const canRemove = shareClasses.length > 1;

          return (
            <Card key={shareClass.id} className="border-border/60">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">{shareClass.id}</div>
                    <p className="text-xs text-muted-foreground">
                      ID imutavel usado nas holdings.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                    disabled={!canRemove}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Classe</Label>
                    <Input
                      value={shareClass.name}
                      onChange={(event) =>
                        onUpdate(index, { name: event.target.value })
                      }
                      placeholder="ex: Series A"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={shareClass.type}
                      onValueChange={(value) => {
                        if (value === "PREFERRED" && isOnlyCommon) {
                          window.alert("Mantenha pelo menos uma classe COMMON.");
                          return;
                        }
                        onUpdate(index, { type: value as ShareClass["type"] });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COMMON">Common</SelectItem>
                        <SelectItem value="PREFERRED">Preferred</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {shareClass.type === "PREFERRED" && (
                    <>
                      <div className="space-y-2">
                        <Label>Seniority (1 = mais senior)</Label>
                        <Input
                          type="number"
                          min={1}
                          value={shareClass.seniority}
                          onChange={(event) =>
                            onUpdate(index, {
                              seniority: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preference Multiple (1x)</Label>
                        <Input
                          type="number"
                          min={1}
                          step="0.1"
                          value={shareClass.preferenceMultiple}
                          onChange={(event) =>
                            onUpdate(index, {
                              preferenceMultiple: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Participation</Label>
                        <Select
                          value={shareClass.participation}
                          onValueChange={(value) =>
                            onUpdate(index, {
                              participation: value as ShareClass["participation"],
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">None</SelectItem>
                            <SelectItem value="FULL">Full</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Participation Cap (opcional)</Label>
                        <Input
                          type="number"
                          min={1}
                          step="0.1"
                          value={shareClass.participationCapMultiple ?? ""}
                          onChange={(event) =>
                            onUpdate(index, {
                              participationCapMultiple:
                                event.target.value === ""
                                  ? undefined
                                  : Number(event.target.value) || 0,
                            })
                          }
                          placeholder="ex: 3 (3x)"
                          disabled={shareClass.participation !== "FULL"}
                        />
                        <p className="text-xs text-muted-foreground">
                          Limita o total recebido ao multiplo informado quando houver participation.
                        </p>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Invested Amount (R$)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="1000"
                          value={shareClass.investedAmount}
                          onChange={(event) =>
                            onUpdate(index, {
                              investedAmount: Number(event.target.value) || 0,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Valor total investido na serie, usado para calcular a preferencia.
                        </p>
                      </div>
                    </>
                  )}

                  {shareClass.type === "COMMON" && (
                    <div className="md:col-span-2 rounded-md border border-border/50 p-3 text-xs text-muted-foreground">
                      Common nao recebe preferencia. O payout vem apenas do residual.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Button
          variant="outline"
          className="w-full bg-transparent"
          type="button"
          onClick={onAdd}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Classe
        </Button>
      </CardContent>
    </Card>
  );
}

"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionHeader } from "@/components/section-header";
import type { Holding, ShareClass } from "@/domain/types";

type HoldingsSectionProps = {
  holdings: Holding[];
  shareClasses: ShareClass[];
  onAdd: () => void;
  onUpdate: (index: number, updates: Partial<Holding>) => void;
  onRemove: (index: number) => void;
};

export function HoldingsSection({
  holdings,
  shareClasses,
  onAdd,
  onUpdate,
  onRemove,
}: HoldingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <SectionHeader
          title="Holdings"
          subtitle="Distribua shares por holder e classe."
          tooltip="Holdings definem quem possui quantas shares em cada classe."
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {holdings.map((holding, index) => (
          <Card key={`${holding.holderId}-${index}`} className="border-border/60">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="text-sm font-semibold">Holding #{index + 1}</div>
                <Button variant="ghost" size="sm" onClick={() => onRemove(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Holder</Label>
                  <Input
                    value={holding.holderId}
                    onChange={(event) =>
                      onUpdate(index, { holderId: event.target.value })
                    }
                    placeholder="ex: You"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Classe</Label>
                  <Select
                    value={holding.classId}
                    onValueChange={(value) => onUpdate(index, { classId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {shareClasses.map((shareClass) => (
                        <SelectItem key={shareClass.id} value={shareClass.id}>
                          {shareClass.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Shares</Label>
                  <Input
                    type="number"
                    min={0}
                    value={holding.shares}
                    onChange={(event) =>
                      onUpdate(index, { shares: Number(event.target.value) || 0 })
                    }
                    placeholder="ex: 100000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          className="w-full bg-transparent"
          type="button"
          onClick={onAdd}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Holding
        </Button>
      </CardContent>
    </Card>
  );
}

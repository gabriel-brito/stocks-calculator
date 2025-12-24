"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Scenario } from "@/fixtures/scenarios";

type ScenarioLibraryProps = {
  scenarios: Scenario[];
  selectedId?: string;
  onLoad: (scenarioId: string) => void;
};

const inferTags = (scenario: Scenario) => {
  if (scenario.tags && scenario.tags.length > 0) {
    return scenario.tags;
  }
  const tags = new Set<string>();
  const id = scenario.id;
  if (id.includes("waterfall")) tags.add("waterfall");
  if (id.includes("rounds")) tags.add("rounds");
  if (id.includes("convertible")) tags.add("convertibles");
  if (id.includes("options")) tags.add("options");
  if (id.includes("vesting")) tags.add("vesting");
  if (id.includes("dca") || id.includes("purchase")) tags.add("dca");
  if (tags.size === 0) tags.add("core");
  return Array.from(tags);
};

export function ScenarioLibrary({ scenarios, selectedId, onLoad }: ScenarioLibraryProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <Card className="mb-6 print-hidden">
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">Scenario Library</div>
          <div className="text-xs text-muted-foreground">
            {scenarios.length} cenarios disponiveis
          </div>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={() => setOpen(true)}>
          Ver cenarios
        </Button>
      </CardContent>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-5xl rounded-lg border border-border bg-card p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <div className="text-lg font-semibold">Scenario Library</div>
              <div className="text-sm text-muted-foreground">
                Selecione um exemplo para carregar no estado atual.
              </div>
            </div>
            <div className="mt-4 max-h-[70vh] overflow-auto pr-1">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {scenarios.map((scenario) => {
                  const tags = inferTags(scenario);
                  const isSelected = scenario.id === selectedId;

                  return (
                    <div
                      key={scenario.id}
                      className="flex flex-col justify-between rounded-lg border border-border/60 bg-card/60 p-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-sm">{scenario.name}</div>
                          {isSelected ? <Badge variant="success">Selecionado</Badge> : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{scenario.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          onLoad(scenario.id);
                          setOpen(false);
                        }}
                        type="button"
                      >
                        Carregar
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

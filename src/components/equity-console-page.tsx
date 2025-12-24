"use client";

import * as React from "react";
import { Download, RotateCcw, Save, Upload, Printer } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CapTableSection } from "@/components/cap-table-section";
import { ValuationsSection } from "@/components/valuations-section";
import { StockOptionsSection } from "@/components/stock-options-section";
import { PurchasesSection } from "@/components/purchases-section";
import { ShareClassesSection } from "@/components/share-classes-section";
import { HoldingsSection } from "@/components/holdings-section";
import { FinancingRoundsSection } from "@/components/financing-rounds-section";
import { ConvertiblesSection } from "@/components/convertibles-section";
import { ScenarioLibrary } from "@/components/scenario-library";
import { Dashboard } from "@/components/dashboard";
import { scenarios } from "@/fixtures/scenarios";
import { createDocument, parseDocument } from "@/domain/document";
import { applyFinancingRounds } from "@/domain/calculations";
import type { AppState, ExitScenario, ValuationPoint } from "@/domain/types";
import { clearAppState } from "@/ui/persistence/localStorage";
import { AppStateProvider, useAppDispatch, useAppState } from "@/ui/state/AppStateProvider";

const useAppActions = () => {
  const { state } = useAppState();
  const dispatch = useAppDispatch();

  const replaceState = (next: AppState) =>
    dispatch({ type: "state/replace", state: next });

  const setCapTable = (capTableBase: AppState["capTableBase"]) => {
    if (capTableBase.commonOutstanding !== state.capTableBase.commonOutstanding) {
      dispatch({
        type: "capTable/update",
        field: "commonOutstanding",
        value: capTableBase.commonOutstanding,
      });
    }
    if (capTableBase.optionPoolReserved !== state.capTableBase.optionPoolReserved) {
      dispatch({
        type: "capTable/update",
        field: "optionPoolReserved",
        value: capTableBase.optionPoolReserved,
      });
    }
    if (capTableBase.otherDilutiveShares !== state.capTableBase.otherDilutiveShares) {
      dispatch({
        type: "capTable/update",
        field: "otherDilutiveShares",
        value: capTableBase.otherDilutiveShares,
      });
    }
  };

  const setEntryValuation = (entry: ValuationPoint) => {
    if (entry.date !== state.valuations.entry.date) {
      dispatch({ type: "valuation/update", point: "entry", field: "date", value: entry.date });
    }
    if (entry.equityValue !== state.valuations.entry.equityValue) {
      dispatch({
        type: "valuation/update",
        point: "entry",
        field: "equityValue",
        value: entry.equityValue,
      });
    }
  };

  const setCurrentValuation = (current: ValuationPoint) => {
    if (current.date !== state.valuations.current.date) {
      dispatch({
        type: "valuation/update",
        point: "current",
        field: "date",
        value: current.date,
      });
    }
    if (current.equityValue !== state.valuations.current.equityValue) {
      dispatch({
        type: "valuation/update",
        point: "current",
        field: "equityValue",
        value: current.equityValue,
      });
    }
  };

  const setExitScenario = (exitScenario: ExitScenario | undefined) =>
    dispatch({ type: "exit/replace", value: exitScenario });

  const setOptionGrants = (optionGrants: AppState["optionGrants"]) =>
    dispatch({ type: "option/replace", value: optionGrants });

  const setPurchasePlans = (purchasePlans: AppState["purchasePlans"]) =>
    dispatch({ type: "purchase/replace", value: purchasePlans });

  const setShareClasses = (shareClasses: AppState["shareClasses"]) =>
    dispatch({ type: "share-class/replace", value: shareClasses });

  const setHoldings = (holdings: AppState["holdings"]) =>
    dispatch({ type: "holding/replace", value: holdings });

  return {
    state,
    dispatch,
    setCapTable,
    setEntryValuation,
    setCurrentValuation,
    setExitScenario,
    setOptionGrants,
    setPurchasePlans,
    setShareClasses,
    setHoldings,
  };
};

function EquityConsolePage() {
  const {
    state,
    dispatch,
    setCapTable,
    setEntryValuation,
    setCurrentValuation,
    setExitScenario,
    setOptionGrants,
    setPurchasePlans,
    setShareClasses,
    setHoldings,
  } = useAppActions();
  const [tab, setTab] = React.useState("dados");
  const [selectedScenario, setSelectedScenario] = React.useState("");

  const handleExport = () => {
    const appDocument = createDocument(state);
    const dataStr = JSON.stringify(appDocument, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `equity-console-${state.schemaVersion}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const parsed = parseDocument(text);
      if (parsed.ok) {
        dispatch({ type: "state/replace", state: parsed.value.state });
      } else {
        window.alert(parsed.errors.join("\n"));
      }
    };
    input.click();
  };

  const handleReset = () => {
    if (window.confirm("Tem certeza que deseja resetar todos os dados?")) {
      dispatch({ type: "state/reset" });
      clearAppState();
      setSelectedScenario("");
    }
  };

  const handleScenarioLoad = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    const scenario = scenarios.find((item) => item.id === scenarioId);
    if (!scenario) return;
    if (!window.confirm(`Carregar o exemplo "${scenario.name}"?`)) {
      return;
    }
    dispatch({ type: "state/replace", state: scenario.state });
  };

  const selectedScenarioInfo = selectedScenario
    ? scenarios.find((scenario) => scenario.id === selectedScenario)
    : undefined;

  const handleApplyRounds = () => {
    if (
      !window.confirm(
        "Aplicar rodadas vai gerar holdings e dilution events automaticamente. Continuar?",
      )
    ) {
      return;
    }
    const nextState = applyFinancingRounds(state);
    dispatch({ type: "state/replace", state: nextState });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold text-balance">Equity Console</h1>

            <div className="flex flex-wrap items-center gap-4 print-hidden">
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-save"
                  checked={state.settings.persistenceOptIn}
                  onCheckedChange={(checked) =>
                    dispatch({
                      type: "settings/update",
                      field: "persistenceOptIn",
                      value: checked,
                    })
                  }
                />
                <Label htmlFor="auto-save" className="text-sm flex items-center gap-1.5">
                  <Save className="h-4 w-4" />
                  Salvar neste dispositivo
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Load example</Label>
                <Select value={selectedScenario} onValueChange={handleScenarioLoad}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Escolha um exemplo" />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map((scenario) => (
                      <SelectItem key={scenario.id} value={scenario.id}>
                        {scenario.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  type="button"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Report
                </Button>
                <Button variant="outline" size="sm" onClick={handleImport} type="button">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport} type="button">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset} type="button">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ScenarioLibrary
          scenarios={scenarios}
          selectedId={selectedScenario}
          onLoad={handleScenarioLoad}
        />
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <CapTableSection
                  capTable={state.capTableBase}
                  asOfDate={state.valuations.current.date}
                  dilutionEvents={state.dilutionEvents}
                  onChange={setCapTable}
                />

                <ValuationsSection
                  entryValuation={state.valuations.entry}
                  currentValuation={state.valuations.current}
                  exitValuation={state.exitScenario}
                  exitEnabled={state.exitScenario !== undefined}
                  capTable={state.capTableBase}
                  dilutionEvents={state.dilutionEvents}
                  onEntryChange={setEntryValuation}
                  onCurrentChange={setCurrentValuation}
                  onExitChange={setExitScenario}
                  onExitEnabledChange={(enabled) =>
                    dispatch({ type: "exit/set-enabled", enabled })
                  }
                />
              </div>

              <div className="space-y-6">
                <StockOptionsSection
                  grants={state.optionGrants}
                  currentValuation={state.valuations.current}
                  capTable={state.capTableBase}
                  dilutionEvents={state.dilutionEvents}
                  onChange={setOptionGrants}
                />

                <PurchasesSection
                  plans={state.purchasePlans}
                  entryValuation={state.valuations.entry}
                  currentValuation={state.valuations.current}
                  capTable={state.capTableBase}
                  dilutionEvents={state.dilutionEvents}
                  onChange={setPurchasePlans}
                />

                <FinancingRoundsSection
                  rounds={state.financingRounds}
                  capTableBase={state.capTableBase}
                  dilutionEvents={state.dilutionEvents}
                  onAdd={() => dispatch({ type: "round/add" })}
                  onUpdate={(index, updates) =>
                    Object.entries(updates).forEach(([field, value]) =>
                      dispatch({
                        type: "round/update",
                        index,
                        field: field as keyof AppState["financingRounds"][number],
                        value: value as AppState["financingRounds"][number][keyof AppState["financingRounds"][number]],
                      }),
                    )
                  }
                  onRemove={(index) => dispatch({ type: "round/remove", index })}
                  onApply={handleApplyRounds}
                />

                <ConvertiblesSection
                  convertibles={state.convertibles}
                  financingRounds={state.financingRounds}
                  capTableBase={state.capTableBase}
                  dilutionEvents={state.dilutionEvents}
                  exitScenario={state.exitScenario}
                  onAdd={() => dispatch({ type: "convertible/add" })}
                  onUpdate={(index, updates) =>
                    Object.entries(updates).forEach(([field, value]) =>
                      dispatch({
                        type: "convertible/update",
                        index,
                        field: field as keyof AppState["convertibles"][number],
                        value: value as AppState["convertibles"][number][keyof AppState["convertibles"][number]],
                      }),
                    )
                  }
                  onRemove={(index) => dispatch({ type: "convertible/remove", index })}
                />

                <ShareClassesSection
                  shareClasses={state.shareClasses}
                  onAdd={() => dispatch({ type: "share-class/add" })}
                  onUpdate={(index, updates) =>
                    Object.entries(updates).forEach(([field, value]) =>
                      dispatch({
                        type: "share-class/update",
                        index,
                        field: field as keyof AppState["shareClasses"][number],
                        value: value as AppState["shareClasses"][number][keyof AppState["shareClasses"][number]],
                      }),
                    )
                  }
                  onRemove={(index) => dispatch({ type: "share-class/remove", index })}
                />

                <HoldingsSection
                  holdings={state.holdings}
                  shareClasses={state.shareClasses}
                  onAdd={() => dispatch({ type: "holding/add" })}
                  onUpdate={(index, updates) =>
                    Object.entries(updates).forEach(([field, value]) =>
                      dispatch({
                        type: "holding/update",
                        index,
                        field: field as keyof AppState["holdings"][number],
                        value: value as AppState["holdings"][number][keyof AppState["holdings"][number]],
                      }),
                    )
                  }
                  onRemove={(index) => dispatch({ type: "holding/remove", index })}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dashboard">
            {selectedScenarioInfo ? (
              <div className="mb-6 rounded-lg border border-border/60 bg-card/70 p-4">
                <div className="text-sm text-muted-foreground">Scenario ativo</div>
                <div className="text-lg font-semibold">{selectedScenarioInfo.name}</div>
                <p className="text-sm text-muted-foreground">
                  {selectedScenarioInfo.description}
                </p>
              </div>
            ) : null}
            <Dashboard state={state} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export function EquityConsolePageShell() {
  return (
    <AppStateProvider>
      <EquityConsolePage />
    </AppStateProvider>
  );
}

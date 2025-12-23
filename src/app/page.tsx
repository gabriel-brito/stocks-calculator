"use client";

import * as React from "react";
import { Download, RotateCcw, Save, Upload } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CapTableSection } from "@/components/cap-table-section";
import { ValuationsSection } from "@/components/valuations-section";
import { StockOptionsSection } from "@/components/stock-options-section";
import { PurchasesSection } from "@/components/purchases-section";
import { Dashboard } from "@/components/dashboard";
import { MathFooter } from "@/components/math-footer";
import { createDocument, parseDocument } from "@/domain/document";
import type { AppState, ExitScenario, ValuationPoint } from "@/domain/types";
import { clearAppState } from "@/ui/persistence/localStorage";
import { AppStateProvider, useAppDispatch, useAppState } from "@/ui/state/AppStateProvider";

const useAppActions = () => {
  const { state } = useAppState();
  const dispatch = useAppDispatch();

  const replaceState = (next: AppState) =>
    dispatch({ type: "state/replace", state: next });

  const setCapTable = (capTableBase: AppState["capTableBase"]) =>
    replaceState({ ...state, capTableBase });

  const setEntryValuation = (entry: ValuationPoint) =>
    replaceState({ ...state, valuations: { ...state.valuations, entry } });

  const setCurrentValuation = (current: ValuationPoint) =>
    replaceState({ ...state, valuations: { ...state.valuations, current } });

  const setExitScenario = (exitScenario: ExitScenario | undefined) =>
    replaceState({ ...state, exitScenario });

  const setOptionGrants = (optionGrants: AppState["optionGrants"]) =>
    replaceState({ ...state, optionGrants });

  const setPurchasePlans = (purchasePlans: AppState["purchasePlans"]) =>
    replaceState({ ...state, purchasePlans });

  return {
    state,
    dispatch,
    setCapTable,
    setEntryValuation,
    setCurrentValuation,
    setExitScenario,
    setOptionGrants,
    setPurchasePlans,
  };
};

function EquityConsolePage() {
  const { state, dispatch, setCapTable, setEntryValuation, setCurrentValuation, setExitScenario, setOptionGrants, setPurchasePlans } =
    useAppActions();
  const [tab, setTab] = React.useState("dados");

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
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-balance">Equity Console</h1>

            <div className="flex flex-wrap items-center gap-4">
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

              <div className="flex gap-2">
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dashboard">
            <Dashboard state={state} />
          </TabsContent>
        </Tabs>

        <MathFooter />
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <AppStateProvider>
      <EquityConsolePage />
    </AppStateProvider>
  );
}

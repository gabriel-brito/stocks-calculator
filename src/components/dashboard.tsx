"use client";

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Share2,
  Target,
  Award,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AppState } from "@/domain/types";
import {
  computeFD,
  computeOptionsSnapshot,
  computePurchasePlanSnapshot,
  computeSharePrice,
  computeExitSnapshots,
  generateMonthlyPurchaseDates,
  getMonthlyAmountEffective,
  getPurchaseSharePrice,
  computeWaterfallExitDistribution,
  computeConvertibleConversion,
} from "@/domain/calculations";
import { compareYMD, isValidYMD, parseYMD } from "@/domain/date";
import { getExitEquityValue } from "@/domain/exit";

interface DashboardProps {
  state: AppState;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

const formatShortDate = (value: string) => {
  if (!isValidYMD(value)) return value;
  const { y, m } = parseYMD(value);
  return `${String(m).padStart(2, "0")}/${String(y).slice(-2)}`;
};

const formatTooltipCurrency = (value: number | string | undefined) =>
  `R$ ${formatCurrency(Number(value ?? 0))}`;

export function Dashboard({ state }: DashboardProps) {
  const fd =
    isValidYMD(state.valuations.current.date)
      ? computeFD(
          state.capTableBase,
          state.dilutionEvents,
          state.valuations.current.date,
        )
      : 0;
  const hasCapTable = fd > 0;
  const hasCurrentValuation =
    state.valuations.current.equityValue > 0 &&
    isValidYMD(state.valuations.current.date);
  const hasInstruments =
    state.optionGrants.length > 0 ||
    state.purchasePlans.length > 0 ||
    state.convertibles.length > 0 ||
    state.financingRounds.length > 0;
  const hasExitScenario = state.exitScenario !== undefined;
  const hasDashboardInputs = hasInstruments || hasExitScenario;

  if (!hasCapTable || !hasCurrentValuation || !hasDashboardInputs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Para visualizar o dashboard, voce precisa preencher:
            </p>
            <ul className="space-y-2 text-sm">
              {!hasCapTable ? (
                <li className="flex items-center gap-2 text-destructive">
                  ✗ Cap Table (FD)
                </li>
              ) : null}
              {!hasCurrentValuation ? (
                <li className="flex items-center gap-2 text-destructive">
                  ✗ Current Valuation
                </li>
              ) : null}
              {!hasDashboardInputs ? (
                <li className="flex items-center gap-2 text-destructive">
                  ✗ Pelo menos 1 Stock Grant, Plano DCA ou Exit Scenario
                </li>
              ) : null}
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  const entryFD =
    isValidYMD(state.valuations.entry.date)
      ? computeFD(
          state.capTableBase,
          state.dilutionEvents,
          state.valuations.entry.date,
        )
      : 0;
  const currentSharePrice =
    state.valuations.current.equityValue > 0 && fd > 0
      ? computeSharePrice(state.valuations.current.equityValue, fd)
      : 0;
  const exitFD =
    state.exitScenario && isValidYMD(state.exitScenario.date)
      ? computeFD(state.capTableBase, state.dilutionEvents, state.exitScenario.date)
      : 0;
  const exitSharePrice =
    state.exitScenario && exitFD > 0
      ? computeSharePrice(getExitEquityValue(state.exitScenario), exitFD)
      : 0;

  const purchaseSnapshots = state.purchasePlans.map((plan) => {
    const canComputePurchases =
      entryFD > 0 &&
      isValidYMD(plan.startDate) &&
      isValidYMD(state.valuations.current.date);
    if (!canComputePurchases) {
      return null;
    }
    return computePurchasePlanSnapshot(
      plan,
      state.valuations.entry,
      state.valuations.current,
      state.capTableBase,
      state.dilutionEvents,
      state.valuations.current.date,
    );
  });

  const totalInvested = purchaseSnapshots.reduce(
    (sum, snap) => sum + (snap?.investedTotal ?? 0),
    0,
  );
  const totalShares = purchaseSnapshots.reduce(
    (sum, snap) => sum + (snap?.sharesTotal ?? 0),
    0,
  );
  const totalCurrentValue = totalShares * currentSharePrice;
  const totalGain = totalCurrentValue - totalInvested;
  const multiple = totalInvested > 0 ? totalCurrentValue / totalInvested : 0;

  const optionsSnapshots = state.optionGrants.map((grant) => {
    const canComputeOptions =
      fd > 0 &&
      isValidYMD(state.valuations.current.date) &&
      isValidYMD(grant.grantDate);
    if (!canComputeOptions) {
      return null;
    }
    return computeOptionsSnapshot(
      grant,
      state.valuations.current,
      state.capTableBase,
      state.dilutionEvents,
      state.valuations.current.date,
    );
  });

  const totalIntrinsic = optionsSnapshots.reduce(
    (sum, snap) => sum + (snap?.intrinsicValueVested ?? 0),
    0,
  );
  const exitSnapshots =
    state.exitScenario &&
    exitFD > 0 &&
    entryFD > 0 &&
    isValidYMD(state.exitScenario.date)
      ? computeExitSnapshots({
          exitScenario: state.exitScenario,
          optionGrants: state.optionGrants,
          purchasePlans: state.purchasePlans,
          capTableBase: state.capTableBase,
          dilutionEvents: state.dilutionEvents,
          entryValuation: state.valuations.entry,
        })
      : null;

  const totalPayout = exitSnapshots
    ? exitSnapshots.options.reduce((sum, entry) => sum + entry.payout, 0)
    : 0;

  const exitHoldings = () => {
    if (!state.exitScenario || exitSharePrice <= 0 || exitFD <= 0) {
      return { shareClasses: state.shareClasses, holdings: state.holdings };
    }

    const commonClass =
      state.shareClasses.find((item) => item.type === "COMMON") ??
      state.shareClasses[0];
    if (!commonClass) {
      return { shareClasses: state.shareClasses, holdings: state.holdings };
    }

    const holderPrefix = "Convertible Investors - ";
    const existingConvertibleHoldings = new Set(
      state.holdings
        .filter((holding) => holding.holderId.startsWith(holderPrefix))
        .map((holding) => holding.holderId),
    );

    const nextHoldings = [...state.holdings];
    state.convertibles.forEach((convertible) => {
      if (
        convertible.convertsOn !== "EXIT" &&
        convertible.convertsOn !== "BOTH"
      ) {
        return;
      }
      const holderId = `${holderPrefix}${convertible.id}`;
      if (existingConvertibleHoldings.has(holderId)) {
        return;
      }
      const conversion = computeConvertibleConversion(
        convertible,
        exitSharePrice,
        exitFD,
        state.exitScenario!.date,
      );
      if (!conversion) return;
      nextHoldings.push({
        holderId,
        classId: commonClass.id,
        shares: conversion.sharesIssued,
      });
    });

    return { shareClasses: state.shareClasses, holdings: nextHoldings };
  };

  const exitState = exitHoldings();
  const exitEquityValue = state.exitScenario
    ? getExitEquityValue(state.exitScenario)
    : 0;

  const waterfall =
    state.exitScenario && exitEquityValue > 0
      ? computeWaterfallExitDistribution(
          exitState.shareClasses,
          exitState.holdings,
          exitEquityValue,
        )
      : null;

  const chartData = () => {
    const entries: Record<string, { invested: number; shares: number }> = {};

    state.purchasePlans.forEach((plan) => {
      if (!isValidYMD(plan.startDate) || !isValidYMD(state.valuations.current.date)) {
        return;
      }
      if (
        state.valuations.entry.equityValue <= 0 ||
        !isValidYMD(state.valuations.entry.date)
      ) {
        return;
      }
      const entryFD = computeFD(
        state.capTableBase,
        state.dilutionEvents,
        state.valuations.entry.date,
      );
      if (entryFD <= 0) return;
      const purchasePrice = getPurchaseSharePrice(plan, state.valuations.entry, entryFD);
      if (purchasePrice <= 0) return;

      const dates = generateMonthlyPurchaseDates(
        plan.startDate,
        state.valuations.current.date,
        plan.purchaseDayOfMonth,
      );
      dates.forEach((date) => {
        const amount = getMonthlyAmountEffective(plan, date);
        const shares = amount > 0 ? amount / purchasePrice : 0;
        if (!entries[date]) {
          entries[date] = { invested: 0, shares: 0 };
        }
        entries[date].invested += amount;
        entries[date].shares += shares;
      });
    });

    const ordered = Object.keys(entries).sort(compareYMD);
    let investedCumulative = 0;
    let sharesCumulative = 0;

    return ordered.map((date) => {
      investedCumulative += entries[date].invested;
      sharesCumulative += entries[date].shares;

      return {
        date,
        invested: investedCumulative,
        current: sharesCumulative * currentSharePrice,
        exit: state.exitScenario ? sharesCumulative * exitSharePrice : undefined,
        shares: sharesCumulative,
      };
    });
  };

  const data = chartData();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">FD Atual</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{fd.toLocaleString("pt-BR")}</div>
            <p className="text-xs text-muted-foreground mt-1">shares</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Share Price (Current)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              R$ {currentSharePrice.toFixed(4)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">por share</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Investido</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              R$ {formatCurrency(totalInvested)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">compras recorrentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Atual (Compras)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-primary">
              R$ {formatCurrency(totalCurrentValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">valor de mercado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ganho Total (Compras)</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold tabular-nums ${
                totalGain >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              R$ {formatCurrency(totalGain)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">lucro / prejuizo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Multiplo (Compras)</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{multiple.toFixed(2)}x</div>
            <p className="text-xs text-muted-foreground mt-1">retorno sobre investido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Options Intrinsic (Vested)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-success">
              R$ {formatCurrency(totalIntrinsic)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">valor intrinseco atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Options Payout (Exit)</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {state.exitScenario ? `R$ ${formatCurrency(totalPayout)}` : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">payout no exit</p>
          </CardContent>
        </Card>
      </div>

      {data.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Evolucao de Investimento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => formatShortDate(value)}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => formatTooltipCurrency(value as number | string)}
                  labelFormatter={(label) => formatShortDate(label)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="invested"
                  stroke="hsl(var(--chart-3))"
                  name="Investido"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="hsl(var(--chart-1))"
                  name="Valor Atual"
                  strokeWidth={2}
                />
                {state.exitScenario ? (
                  <Line
                    type="monotone"
                    dataKey="exit"
                    stroke="hsl(var(--chart-2))"
                    name="Valor Exit"
                    strokeWidth={2}
                  />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : null}

      {data.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Shares Acumuladas (Step Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => formatShortDate(value)}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value) =>
                    Number(value ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })
                  }
                  labelFormatter={(label) => formatShortDate(label)}
                />
                <Line
                  type="stepAfter"
                  dataKey="shares"
                  stroke="hsl(var(--chart-2))"
                  name="Shares"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : null}

      {state.optionGrants.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Stock Options</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grant Date</TableHead>
                  <TableHead className="text-right">Granted</TableHead>
                  <TableHead className="text-right">Vested</TableHead>
                  <TableHead className="text-right">Exercisable</TableHead>
                  <TableHead className="text-right">Strike Price</TableHead>
                  <TableHead className="text-right">Intrinsic Value</TableHead>
                  {state.exitScenario ? (
                    <TableHead className="text-right">Payout (Exit)</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.optionGrants.map((grant, index) => {
                  const snapshot = optionsSnapshots[index];
                  const payout = exitSnapshots?.options[index]?.payout ?? 0;

                  return (
                    <TableRow key={`grant-${index}`}>
                      <TableCell>{grant.grantDate}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {grant.quantityGranted.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {snapshot ? snapshot.vestedQty.toLocaleString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {snapshot ? snapshot.exercisableQty.toLocaleString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        R$ {grant.strikePrice.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-success">
                        {snapshot ? `R$ ${formatCurrency(snapshot.intrinsicValueVested)}` : "—"}
                      </TableCell>
                      {state.exitScenario ? (
                        <TableCell className="text-right tabular-nums">
                          {snapshot ? `R$ ${formatCurrency(payout)}` : "—"}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {waterfall ? (
        <Card>
          <CardHeader>
            <CardTitle>Waterfall Distribution (1x non-participating)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Classe</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Participation</TableHead>
                  <TableHead className="text-right">Cap</TableHead>
                  <TableHead className="text-right">Seniority</TableHead>
                  <TableHead className="text-right">Pref (R$)</TableHead>
                  <TableHead className="text-right">Conversao (R$)</TableHead>
                  <TableHead className="text-right">Decisao</TableHead>
                  <TableHead className="text-right">Payout (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waterfall.classResults.map((result) => (
                  <TableRow key={result.classId}>
                    <TableCell>{result.name}</TableCell>
                    <TableCell>{result.type}</TableCell>
                    <TableCell>
                      {result.type === "PREFERRED"
                        ? state.shareClasses.find((item) => item.id === result.classId)
                            ?.participation ?? "—"
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {result.type === "PREFERRED"
                        ? state.shareClasses.find((item) => item.id === result.classId)
                            ?.participationCapMultiple ?? "—"
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {result.seniority}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(result.preferenceAmount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(result.conversionValue)}
                    </TableCell>
                    <TableCell className="text-right">{result.decision}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(result.payout)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {waterfall.holdingResults.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Holder</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Payout (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waterfall.holdingResults.map((result, index) => (
                    <TableRow key={`${result.holderId}-${index}`}>
                      <TableCell>{result.holderId}</TableCell>
                      <TableCell>{result.className}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {result.shares.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(result.payout)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

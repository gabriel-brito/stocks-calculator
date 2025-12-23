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
} from "@/domain/calculations";
import { compareYMD, isValidYMD, parseYMD } from "@/domain/date";

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
    state.optionGrants.length > 0 || state.purchasePlans.length > 0;

  if (!hasCapTable || !hasCurrentValuation || !hasInstruments) {
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
              {!hasInstruments ? (
                <li className="flex items-center gap-2 text-destructive">
                  ✗ Pelo menos 1 Stock Grant ou Plano DCA
                </li>
              ) : null}
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentSharePrice =
    state.valuations.current.equityValue > 0 && fd > 0
      ? computeSharePrice(state.valuations.current.equityValue, fd)
      : 0;
  const exitFD =
    state.exitScenario && isValidYMD(state.exitScenario.date)
      ? computeFD(state.capTableBase, state.dilutionEvents, state.exitScenario.date)
      : 0;
  const exitSharePrice =
    state.exitScenario && state.exitScenario.exitEquityValue > 0 && exitFD > 0
      ? computeSharePrice(state.exitScenario.exitEquityValue, exitFD)
      : 0;

  const purchaseSnapshots = state.purchasePlans.map((plan) =>
    computePurchasePlanSnapshot(
      plan,
      state.valuations.entry,
      state.valuations.current,
      state.capTableBase,
      state.dilutionEvents,
      state.valuations.current.date,
    ),
  );

  const totalInvested = purchaseSnapshots.reduce(
    (sum, snap) => sum + snap.investedTotal,
    0,
  );
  const totalShares = purchaseSnapshots.reduce(
    (sum, snap) => sum + snap.sharesTotal,
    0,
  );
  const totalCurrentValue = totalShares * currentSharePrice;
  const totalGain = totalCurrentValue - totalInvested;
  const multiple = totalInvested > 0 ? totalCurrentValue / totalInvested : 0;

  const optionsSnapshots = state.optionGrants.map((grant) =>
    computeOptionsSnapshot(
      grant,
      state.valuations.current,
      state.capTableBase,
      state.dilutionEvents,
      state.valuations.current.date,
    ),
  );

  const totalIntrinsic = optionsSnapshots.reduce(
    (sum, snap) => sum + snap.intrinsicValueVested,
    0,
  );
  const exitSnapshots = state.exitScenario
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
                        {snapshot.vestedQty.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        R$ {grant.strikePrice.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-success">
                        R$ {formatCurrency(snapshot.intrinsicValueVested)}
                      </TableCell>
                      {state.exitScenario ? (
                        <TableCell className="text-right tabular-nums">
                          R$ {formatCurrency(payout)}
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
    </div>
  );
}

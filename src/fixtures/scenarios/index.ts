import type { AppState } from "@/domain/types";

export type Scenario = {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  state: AppState;
};

const baseState: Omit<AppState, "schemaVersion"> = {
  capTableBase: {
    commonOutstanding: 1_000_000,
    optionPoolReserved: 100_000,
    otherDilutiveShares: 0,
  },
  dilutionEvents: [],
  valuations: {
    entry: {
      date: "2024-01-01",
      equityValue: 10_000_000,
    },
    current: {
      date: "2025-01-01",
      equityValue: 20_000_000,
    },
  },
  optionGrants: [],
  purchasePlans: [],
  shareClasses: [
    {
      id: "common",
      name: "Common",
      type: "COMMON",
      seniority: 0,
      preferenceMultiple: 0,
      investedAmount: 0,
      participation: "NONE",
    },
  ],
  holdings: [
    {
      holderId: "You",
      classId: "common",
      shares: 1_000_000,
    },
  ],
  financingRounds: [],
  convertibles: [],
  settings: {
    persistenceOptIn: false,
    currency: "BRL",
  },
};

export const scenarios: Scenario[] = [
  {
    id: "starter-dca",
    name: "Starter DCA",
    description: "Cap table simples + um plano DCA fixo.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      purchasePlans: [
        {
          startDate: "2024-02-01",
          purchaseDayOfMonth: 5,
          monthlyAmount: 3000,
          purchasePriceMode: "ENTRY_VALUATION_ANCHORED",
          contributionChanges: [],
        },
      ],
    },
  },
  {
    id: "options-monthly-36",
    name: "Options 3 anos (cliff 12)",
    description: "Grant com vesting mensal de 36 meses.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      optionGrants: [
        {
          quantityGranted: 5000,
          strikePrice: 1.5,
          grantDate: "2024-02-01",
          vestingSchedule: {
            startDate: "2024-02-01",
            cliffMonths: 12,
            totalMonths: 36,
            frequency: "MONTHLY",
          },
        },
      ],
    },
  },
  {
    id: "mixed-contribution-changes",
    name: "DCA variavel + options",
    description: "Plano com mudancas de aporte e um grant.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      optionGrants: [
        {
          quantityGranted: 2000,
          strikePrice: 2,
          grantDate: "2024-01-10",
          vestingSchedule: {
            startDate: "2024-01-10",
            cliffMonths: 6,
            totalMonths: 36,
            frequency: "MONTHLY",
          },
        },
      ],
      purchasePlans: [
        {
          startDate: "2024-03-01",
          purchaseDayOfMonth: 10,
          monthlyAmount: 2500,
          purchasePriceMode: "FIXED_SHARE_PRICE",
          purchaseSharePriceFixed: 2.5,
          contributionChanges: [
            { effectiveDate: "2024-08-01", monthlyAmount: 3500 },
            { effectiveDate: "2024-11-01", monthlyAmount: 0 },
          ],
        },
      ],
    },
  },
  {
    id: "vesting-4y-cliff12",
    name: "Vesting 4 anos (cliff 12)",
    description: "Schedule 48 meses, cliff 12, monthly.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      optionGrants: [
        {
          quantityGranted: 12000,
          strikePrice: 1,
          grantDate: "2023-01-01",
          vestingSchedule: {
            startDate: "2023-01-01",
            cliffMonths: 12,
            totalMonths: 48,
            frequency: "MONTHLY",
          },
        },
      ],
    },
  },
  {
    id: "vesting-3y-cliff6",
    name: "Vesting 3 anos (cliff 6)",
    description: "Schedule 36 meses, cliff 6, monthly.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      optionGrants: [
        {
          quantityGranted: 8000,
          strikePrice: 0.8,
          grantDate: "2024-04-01",
          vestingSchedule: {
            startDate: "2024-04-01",
            cliffMonths: 6,
            totalMonths: 36,
            frequency: "MONTHLY",
          },
        },
      ],
    },
  },
  {
    id: "vesting-1y-no-cliff",
    name: "Vesting 1 ano (sem cliff)",
    description: "Schedule 12 meses, cliff 0, monthly.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      optionGrants: [
        {
          quantityGranted: 3000,
          strikePrice: 1.2,
          grantDate: "2024-06-01",
          vestingSchedule: {
            startDate: "2024-06-01",
            cliffMonths: 0,
            totalMonths: 12,
            frequency: "MONTHLY",
          },
        },
      ],
    },
  },
  {
    id: "waterfall-low-exit",
    name: "Waterfall: exit baixo",
    description: "Exit abaixo da preferencia. Common recebe 0.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      exitScenario: {
        date: "2025-06-30",
        exitEquityValue: 4_000_000,
      },
      shareClasses: [
        baseState.shareClasses[0],
        {
          id: "series-a",
          name: "Series A",
          type: "PREFERRED",
          seniority: 1,
          preferenceMultiple: 1,
          investedAmount: 5_000_000,
          participation: "NONE",
        },
      ],
      holdings: [
        {
          holderId: "Founders",
          classId: "common",
          shares: 1_000_000,
        },
        {
          holderId: "Investors A",
          classId: "series-a",
          shares: 200_000,
        },
      ],
    },
  },
  {
    id: "waterfall-medium-exit",
    name: "Waterfall: preferencia vence",
    description: "Exit medio. Series A leva 1x.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      exitScenario: {
        date: "2025-06-30",
        exitEquityValue: 7_000_000,
      },
      shareClasses: [
        baseState.shareClasses[0],
        {
          id: "series-a",
          name: "Series A",
          type: "PREFERRED",
          seniority: 1,
          preferenceMultiple: 1,
          investedAmount: 5_000_000,
          participation: "NONE",
        },
      ],
      holdings: [
        {
          holderId: "Founders",
          classId: "common",
          shares: 1_000_000,
        },
        {
          holderId: "Investors A",
          classId: "series-a",
          shares: 200_000,
        },
      ],
    },
  },
  {
    id: "waterfall-high-exit",
    name: "Waterfall: conversao vence",
    description: "Exit alto. Series A converte.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      exitScenario: {
        date: "2025-06-30",
        exitEquityValue: 40_000_000,
      },
      shareClasses: [
        baseState.shareClasses[0],
        {
          id: "series-a",
          name: "Series A",
          type: "PREFERRED",
          seniority: 1,
          preferenceMultiple: 1,
          investedAmount: 5_000_000,
          participation: "NONE",
        },
      ],
      holdings: [
        {
          holderId: "Founders",
          classId: "common",
          shares: 1_000_000,
        },
        {
          holderId: "Investors A",
          classId: "series-a",
          shares: 200_000,
        },
      ],
    },
  },
  {
    id: "waterfall-multi-series",
    name: "Waterfall: Series A senior a B",
    description: "Duas series com seniority diferente.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      exitScenario: {
        date: "2025-06-30",
        exitEquityValue: 12_000_000,
      },
      shareClasses: [
        baseState.shareClasses[0],
        {
          id: "series-a",
          name: "Series A",
          type: "PREFERRED",
          seniority: 1,
          preferenceMultiple: 1,
          investedAmount: 6_000_000,
          participation: "NONE",
        },
        {
          id: "series-b",
          name: "Series B",
          type: "PREFERRED",
          seniority: 2,
          preferenceMultiple: 1,
          investedAmount: 4_000_000,
          participation: "NONE",
        },
      ],
      holdings: [
        {
          holderId: "Founders",
          classId: "common",
          shares: 1_000_000,
        },
        {
          holderId: "Investors A",
          classId: "series-a",
          shares: 200_000,
        },
        {
          holderId: "Investors B",
          classId: "series-b",
          shares: 150_000,
        },
      ],
    },
  },
  {
    id: "waterfall-holdings-audit",
    name: "Waterfall: holdings auditavel",
    description: "Distribuicao por holder com duas classes.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      exitScenario: {
        date: "2025-06-30",
        exitEquityValue: 9_000_000,
      },
      shareClasses: [
        baseState.shareClasses[0],
        {
          id: "series-a",
          name: "Series A",
          type: "PREFERRED",
          seniority: 1,
          preferenceMultiple: 1,
          investedAmount: 5_000_000,
          participation: "NONE",
        },
      ],
      holdings: [
        {
          holderId: "You",
          classId: "common",
          shares: 500_000,
        },
        {
          holderId: "Team",
          classId: "common",
          shares: 500_000,
        },
        {
          holderId: "Investors A",
          classId: "series-a",
          shares: 200_000,
        },
      ],
    },
  },
  {
    id: "waterfall-participating-full",
    name: "Waterfall: participating full (sem cap)",
    description: "Preferred participa do residual sem cap.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      exitScenario: {
        date: "2025-06-30",
        exitEquityValue: 10_000_000,
      },
      shareClasses: [
        baseState.shareClasses[0],
        {
          id: "series-a",
          name: "Series A",
          type: "PREFERRED",
          seniority: 1,
          preferenceMultiple: 1,
          investedAmount: 5_000_000,
          participation: "FULL",
        },
      ],
      holdings: [
        {
          holderId: "Founders",
          classId: "common",
          shares: 1_000_000,
        },
        {
          holderId: "Investors A",
          classId: "series-a",
          shares: 200_000,
        },
      ],
    },
  },
  {
    id: "waterfall-participating-cap-2x",
    name: "Waterfall: participating cap 2x",
    description: "Cap limita o total recebido pelo preferred.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      exitScenario: {
        date: "2025-06-30",
        exitEquityValue: 60_000_000,
      },
      shareClasses: [
        baseState.shareClasses[0],
        {
          id: "series-a",
          name: "Series A",
          type: "PREFERRED",
          seniority: 1,
          preferenceMultiple: 1,
          investedAmount: 5_000_000,
          participation: "FULL",
          participationCapMultiple: 2,
        },
      ],
      holdings: [
        {
          holderId: "Founders",
          classId: "common",
          shares: 1_000_000,
        },
        {
          holderId: "Investors A",
          classId: "series-a",
          shares: 200_000,
        },
      ],
    },
  },
  {
    id: "waterfall-participating-cap-3x",
    name: "Waterfall: participating cap 3x",
    description: "Cap 3x com exit alto.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      exitScenario: {
        date: "2025-06-30",
        exitEquityValue: 80_000_000,
      },
      shareClasses: [
        baseState.shareClasses[0],
        {
          id: "series-a",
          name: "Series A",
          type: "PREFERRED",
          seniority: 1,
          preferenceMultiple: 1,
          investedAmount: 5_000_000,
          participation: "FULL",
          participationCapMultiple: 3,
        },
      ],
      holdings: [
        {
          holderId: "Founders",
          classId: "common",
          shares: 1_000_000,
        },
        {
          holderId: "Investors A",
          classId: "series-a",
          shares: 200_000,
        },
      ],
    },
  },
  {
    id: "waterfall-participating-multi-series",
    name: "Waterfall: participation + serie B",
    description: "Series A participating, Series B non-participating.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      exitScenario: {
        date: "2025-06-30",
        exitEquityValue: 15_000_000,
      },
      shareClasses: [
        baseState.shareClasses[0],
        {
          id: "series-a",
          name: "Series A",
          type: "PREFERRED",
          seniority: 1,
          preferenceMultiple: 1,
          investedAmount: 4_000_000,
          participation: "FULL",
        },
        {
          id: "series-b",
          name: "Series B",
          type: "PREFERRED",
          seniority: 2,
          preferenceMultiple: 1,
          investedAmount: 3_000_000,
          participation: "NONE",
        },
      ],
      holdings: [
        {
          holderId: "Founders",
          classId: "common",
          shares: 1_000_000,
        },
        {
          holderId: "Investors A",
          classId: "series-a",
          shares: 200_000,
        },
        {
          holderId: "Investors B",
          classId: "series-b",
          shares: 150_000,
        },
      ],
    },
  },
  {
    id: "waterfall-participating-cap-multi",
    name: "Waterfall: cap + duas series",
    description: "Series A cap 2x e Series B participa.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      exitScenario: {
        date: "2025-06-30",
        exitEquityValue: 50_000_000,
      },
      shareClasses: [
        baseState.shareClasses[0],
        {
          id: "series-a",
          name: "Series A",
          type: "PREFERRED",
          seniority: 1,
          preferenceMultiple: 1,
          investedAmount: 5_000_000,
          participation: "FULL",
          participationCapMultiple: 2,
        },
        {
          id: "series-b",
          name: "Series B",
          type: "PREFERRED",
          seniority: 2,
          preferenceMultiple: 1,
          investedAmount: 4_000_000,
          participation: "FULL",
        },
      ],
      holdings: [
        {
          holderId: "Founders",
          classId: "common",
          shares: 1_000_000,
        },
        {
          holderId: "Investors A",
          classId: "series-a",
          shares: 200_000,
        },
        {
          holderId: "Investors B",
          classId: "series-b",
          shares: 150_000,
        },
      ],
    },
  },
  {
    id: "rounds-series-a-no-topup",
    name: "Rounds: Series A sem top-up",
    description: "Rodada unica sem pool top-up.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      financingRounds: [
        {
          date: "2024-06-01",
          preMoney: 11_000_000,
          investmentAmount: 2_200_000,
          seriesName: "Series A",
        },
      ],
    },
  },
  {
    id: "rounds-series-a-topup-15",
    name: "Rounds: Series A com top-up 15%",
    description: "Rodada unica com pool top-up para 15%.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      financingRounds: [
        {
          date: "2024-06-01",
          preMoney: 11_000_000,
          investmentAmount: 2_200_000,
          targetOptionPoolPostPercent: 0.15,
          seriesName: "Series A",
        },
      ],
    },
  },
  {
    id: "rounds-two-series",
    name: "Rounds: Series A + B",
    description: "Duas rodadas sem pool top-up.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      financingRounds: [
        {
          date: "2024-06-01",
          preMoney: 11_000_000,
          investmentAmount: 2_200_000,
          seriesName: "Series A",
        },
        {
          date: "2025-06-01",
          preMoney: 20_000_000,
          investmentAmount: 4_000_000,
          seriesName: "Series B",
        },
      ],
    },
  },
  {
    id: "rounds-two-series-topup",
    name: "Rounds: A com top-up + B com top-up",
    description: "Rodadas com top-up sequencial.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      financingRounds: [
        {
          date: "2024-06-01",
          preMoney: 11_000_000,
          investmentAmount: 2_200_000,
          targetOptionPoolPostPercent: 0.15,
          seriesName: "Series A",
        },
        {
          date: "2025-06-01",
          preMoney: 20_000_000,
          investmentAmount: 4_000_000,
          targetOptionPoolPostPercent: 0.2,
          seriesName: "Series B",
        },
      ],
    },
  },
  {
    id: "rounds-topup-20",
    name: "Rounds: top-up 20%",
    description: "Rodada unica com top-up 20% e pre-money menor.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      financingRounds: [
        {
          date: "2024-04-01",
          preMoney: 8_000_000,
          investmentAmount: 1_600_000,
          targetOptionPoolPostPercent: 0.2,
          seriesName: "Seed",
        },
      ],
    },
  },
  {
    id: "convertible-cap-only",
    name: "Convertible: SAFE cap only",
    description: "SAFE com cap, converte na rodada.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      financingRounds: [
        {
          date: "2024-06-01",
          preMoney: 10_000_000,
          investmentAmount: 2_000_000,
          seriesName: "Series A",
        },
      ],
      convertibles: [
        {
          id: "safe-cap",
          type: "SAFE",
          dateIssued: "2024-01-01",
          amount: 1_000_000,
          cap: 6_000_000,
          convertsOn: "NEXT_EQUITY_ROUND",
        },
      ],
    },
  },
  {
    id: "convertible-discount-only",
    name: "Convertible: SAFE discount only",
    description: "SAFE com desconto 20%.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      financingRounds: [
        {
          date: "2024-06-01",
          preMoney: 10_000_000,
          investmentAmount: 2_000_000,
          seriesName: "Series A",
        },
      ],
      convertibles: [
        {
          id: "safe-discount",
          type: "SAFE",
          dateIssued: "2024-01-01",
          amount: 1_000_000,
          discount: 0.2,
          convertsOn: "NEXT_EQUITY_ROUND",
        },
      ],
    },
  },
  {
    id: "convertible-cap-discount",
    name: "Convertible: cap + discount",
    description: "SAFE com cap e desconto, usa o melhor.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      financingRounds: [
        {
          date: "2024-06-01",
          preMoney: 10_000_000,
          investmentAmount: 2_000_000,
          seriesName: "Series A",
        },
      ],
      convertibles: [
        {
          id: "safe-cap-discount",
          type: "SAFE",
          dateIssued: "2024-01-01",
          amount: 1_000_000,
          cap: 8_000_000,
          discount: 0.1,
          convertsOn: "NEXT_EQUITY_ROUND",
        },
      ],
    },
  },
  {
    id: "convertible-exit-only",
    name: "Convertible: converte no exit",
    description: "SAFE converte no exit usando desconto.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      exitScenario: {
        date: "2025-06-30",
        exitEquityValue: 12_000_000,
      },
      convertibles: [
        {
          id: "safe-exit",
          type: "SAFE",
          dateIssued: "2024-01-01",
          amount: 1_000_000,
          discount: 0.2,
          convertsOn: "EXIT",
        },
      ],
    },
  },
  {
    id: "convertible-note-interest",
    name: "Convertible: NOTE com juros",
    description: "NOTE 10% a.a. com desconto.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      financingRounds: [
        {
          date: "2025-01-01",
          preMoney: 10_000_000,
          investmentAmount: 2_000_000,
          seriesName: "Series A",
        },
      ],
      convertibles: [
        {
          id: "note-10",
          type: "NOTE",
          dateIssued: "2024-01-01",
          amount: 1_000_000,
          discount: 0.2,
          interestRate: 0.1,
          maturityDate: "2026-01-01",
          convertsOn: "NEXT_EQUITY_ROUND",
        },
      ],
    },
  },
  {
    id: "options-termination-window",
    name: "Options: janela expirada",
    description: "Grant encerrado fora da janela de exercicio.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      optionGrants: [
        {
          quantityGranted: 1000,
          strikePrice: 1,
          grantDate: "2020-01-01",
          terminationDate: "2024-01-01",
          postTerminationExerciseWindowDays: 30,
          vestingSchedule: {
            startDate: "2020-01-01",
            cliffMonths: 12,
            totalMonths: 36,
            frequency: "MONTHLY",
          },
          acceleration: {
            type: "NONE",
            percent: 0,
          },
        },
      ],
    },
  },
  {
    id: "options-expired",
    name: "Options: expiradas",
    description: "Grant expirado antes da data atual.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      optionGrants: [
        {
          quantityGranted: 500,
          strikePrice: 2,
          grantDate: "2020-01-01",
          expirationDate: "2023-01-01",
          vestingSchedule: {
            startDate: "2020-01-01",
            cliffMonths: 12,
            totalMonths: 36,
            frequency: "MONTHLY",
          },
          acceleration: {
            type: "NONE",
            percent: 0,
          },
        },
      ],
    },
  },
  {
    id: "options-acceleration-exit",
    name: "Options: aceleracao no exit",
    description: "Grant com aceleracao 100% no exit.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      exitScenario: {
        date: "2024-06-01",
        exitEquityValue: 12_000_000,
      },
      optionGrants: [
        {
          quantityGranted: 1000,
          strikePrice: 1,
          grantDate: "2024-01-01",
          vestingSchedule: {
            startDate: "2024-01-01",
            cliffMonths: 12,
            totalMonths: 48,
            frequency: "MONTHLY",
          },
          acceleration: {
            type: "SINGLE_TRIGGER",
            percent: 1,
          },
        },
      ],
    },
  },
  {
    id: "exit-ev-basic",
    name: "Exit EV: com net debt + fees",
    description: "Exit por EV com ajustes.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      exitScenario: {
        date: "2025-06-30",
        enterpriseValue: 20_000_000,
        netDebt: 3_000_000,
        fees: 1_000_000,
      },
    },
  },
  {
    id: "exit-ev-no-debt",
    name: "Exit EV: sem ajustes",
    description: "Exit por EV sem net debt ou fees.",
    state: {
      schemaVersion: "v2",
      ...baseState,
      exitScenario: {
        date: "2025-06-30",
        enterpriseValue: 15_000_000,
        netDebt: 0,
        fees: 0,
      },
    },
  },
];

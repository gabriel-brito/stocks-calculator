import type { DateYMD } from "@/domain/date";
import type {
  AppState,
  CapTableBase,
  ConvertibleInstrument,
  FinancingRound,
  Holding,
  OptionGrant,
  PurchasePlan,
  ShareClass,
  Settings,
} from "@/domain/types";

export type AppAction =
  | {
      type: "state/replace";
      state: AppState;
    }
  | {
      type: "state/reset";
    }
  | {
      type: "capTable/update";
      field: keyof CapTableBase;
      value: number;
    }
  | {
      type: "valuation/update";
      point: "entry" | "current";
      field: "date" | "equityValue";
      value: string | number;
    }
  | {
      type: "exit/set-enabled";
      enabled: boolean;
    }
  | {
      type: "exit/replace";
      value: AppState["exitScenario"];
    }
  | {
      type: "exit/update";
      field: "date" | "exitEquityValue" | "enterpriseValue" | "netDebt" | "fees";
      value: string | number;
    }
  | {
      type: "option/add";
    }
  | {
      type: "option/update";
      index: number;
      field: keyof OptionGrant;
      value: string | number | undefined;
    }
  | {
      type: "option/replace";
      value: OptionGrant[];
    }
  | {
      type: "option/remove";
      index: number;
    }
  | {
      type: "purchase/add";
    }
  | {
      type: "purchase/update";
      index: number;
      field: keyof PurchasePlan;
      value: PurchasePlan[keyof PurchasePlan];
    }
  | {
      type: "purchase/replace";
      value: PurchasePlan[];
    }
  | {
      type: "purchase/remove";
      index: number;
    }
  | {
      type: "share-class/add";
    }
  | {
      type: "share-class/update";
      index: number;
      field: keyof ShareClass;
      value: ShareClass[keyof ShareClass];
    }
  | {
      type: "share-class/replace";
      value: ShareClass[];
    }
  | {
      type: "share-class/remove";
      index: number;
    }
  | {
      type: "holding/add";
    }
  | {
      type: "holding/update";
      index: number;
      field: keyof Holding;
      value: Holding[keyof Holding];
    }
  | {
      type: "holding/replace";
      value: Holding[];
    }
  | {
      type: "holding/remove";
      index: number;
    }
  | {
      type: "round/add";
    }
  | {
      type: "round/update";
      index: number;
      field: keyof FinancingRound;
      value: FinancingRound[keyof FinancingRound];
    }
  | {
      type: "round/remove";
      index: number;
    }
  | {
      type: "convertible/add";
    }
  | {
      type: "convertible/update";
      index: number;
      field: keyof ConvertibleInstrument;
      value: ConvertibleInstrument[keyof ConvertibleInstrument];
    }
  | {
      type: "convertible/remove";
      index: number;
    }
  | {
      type: "settings/update";
      field: keyof Settings;
      value: Settings[keyof Settings];
    };

const DEFAULT_DATE: DateYMD = "2024-01-01";

export const createOptionGrant = (): OptionGrant => ({
  quantityGranted: 0,
  strikePrice: 0,
  grantDate: DEFAULT_DATE,
  vestingSchedule: {
    startDate: DEFAULT_DATE,
    cliffMonths: 12,
    totalMonths: 36,
    frequency: "MONTHLY",
  },
  acceleration: {
    type: "NONE",
    percent: 0,
  },
});

export const createPurchasePlan = (): PurchasePlan => ({
  startDate: DEFAULT_DATE,
  purchaseDayOfMonth: 1,
  monthlyAmount: 0,
  contributionChanges: [],
  purchasePriceMode: "ENTRY_VALUATION_ANCHORED",
});

export const createShareClass = (index: number): ShareClass => ({
  id: `class-${Date.now()}-${index}`,
  name: "New Class",
  type: "PREFERRED",
  seniority: 1,
  preferenceMultiple: 1,
  investedAmount: 0,
  participation: "NONE",
});

export const createHolding = (classId: string): Holding => ({
  holderId: "Holder",
  classId,
  shares: 0,
});

export const createFinancingRound = (): FinancingRound => ({
  date: DEFAULT_DATE,
  preMoney: 0,
  investmentAmount: 0,
  seriesName: "Series A",
});

export const createConvertible = (): ConvertibleInstrument => ({
  id: `conv-${Date.now()}`,
  type: "SAFE",
  dateIssued: DEFAULT_DATE,
  amount: 0,
  convertsOn: "NEXT_EQUITY_ROUND",
});

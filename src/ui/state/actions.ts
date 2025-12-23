import type { DateYMD } from "@/domain/date";
import type {
  AppState,
  CapTableBase,
  OptionGrant,
  PurchasePlan,
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
      type: "exit/update";
      field: "date" | "exitEquityValue";
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
      type: "purchase/remove";
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
  vesting: "25_25_50",
});

export const createPurchasePlan = (): PurchasePlan => ({
  startDate: DEFAULT_DATE,
  purchaseDayOfMonth: 1,
  monthlyAmount: 0,
  contributionChanges: [],
  purchasePriceMode: "ENTRY_VALUATION_ANCHORED",
});

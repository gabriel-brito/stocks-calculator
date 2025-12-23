import type { DateYMD } from "./date";

export type SchemaVersion = "v1";

export type CapTableBase = {
  commonOutstanding: number;
  optionPoolReserved: number;
  otherDilutiveShares: number;
};

export type ValuationPoint = {
  date: DateYMD;
  equityValue: number;
};

export type DilutionEvent = {
  date: DateYMD;
  sharesIssued: number;
  description?: string;
};

export type ExitScenario = {
  date: DateYMD;
  exitEquityValue: number;
};

export type Vesting = "25_25_50";

export type OptionGrant = {
  quantityGranted: number;
  strikePrice: number;
  grantDate: DateYMD;
  expirationDate?: DateYMD;
  vesting: Vesting;
};

export const PurchasePriceMode = {
  FIXED_SHARE_PRICE: "FIXED_SHARE_PRICE",
  ENTRY_VALUATION_ANCHORED: "ENTRY_VALUATION_ANCHORED",
} as const;

export type PurchasePriceMode =
  (typeof PurchasePriceMode)[keyof typeof PurchasePriceMode];

export type PurchasePlan = {
  startDate: DateYMD;
  purchaseDayOfMonth: number;
  monthlyAmount: number;
  contributionChanges?: ContributionChange[];
  purchasePriceMode: PurchasePriceMode;
  purchaseSharePriceFixed?: number;
};

export type ContributionChange = {
  effectiveDate: DateYMD;
  monthlyAmount: number;
};

export type Settings = {
  persistenceOptIn: boolean;
  currency: "BRL";
};

export type CompanyState = {
  capTableBase: CapTableBase;
  dilutionEvents: DilutionEvent[];
  valuations: {
    entry: ValuationPoint;
    current: ValuationPoint;
  };
  exitScenario?: ExitScenario;
  optionGrants: OptionGrant[];
  purchasePlans: PurchasePlan[];
  settings: Settings;
};

export type AppState = CompanyState & {
  schemaVersion: SchemaVersion;
};

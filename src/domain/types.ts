import type { DateYMD } from "./date";

export type SchemaVersion = "v1" | "v2";

export type Money = number;

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
  exitEquityValue?: number;
  enterpriseValue?: number;
  netDebt?: number;
  fees?: number;
};

export type VestingFrequency = "MONTHLY" | "QUARTERLY";

export type VestingSchedule = {
  startDate: DateYMD;
  cliffMonths: number;
  totalMonths: number;
  frequency: VestingFrequency;
};

export type AccelerationType = "NONE" | "SINGLE_TRIGGER" | "DOUBLE_TRIGGER";

export type Acceleration = {
  type: AccelerationType;
  percent: number;
};

export type OptionGrant = {
  quantityGranted: number;
  strikePrice: number;
  grantDate: DateYMD;
  expirationDate?: DateYMD;
  vestingSchedule: VestingSchedule;
  terminationDate?: DateYMD;
  postTerminationExerciseWindowDays?: number;
  acceleration?: Acceleration;
};

export type ShareClassType = "COMMON" | "PREFERRED";
export type ParticipationType = "NONE" | "FULL";

export type ShareClass = {
  id: string;
  name: string;
  type: ShareClassType;
  seniority: number;
  preferenceMultiple: number;
  investedAmount: Money;
  participation: ParticipationType;
  participationCapMultiple?: number;
};

export type Holding = {
  holderId: string;
  classId: string;
  shares: number;
};

export type FinancingRound = {
  date: DateYMD;
  preMoney: number;
  investmentAmount: number;
  targetOptionPoolPostPercent?: number;
  seriesName: string;
  createsShareClassId?: string;
};

export type ConvertibleType = "SAFE" | "NOTE";
export type ConvertibleConvertsOn = "NEXT_EQUITY_ROUND" | "EXIT" | "BOTH";

export type ConvertibleInstrument = {
  id: string;
  type: ConvertibleType;
  dateIssued: DateYMD;
  amount: number;
  cap?: number;
  discount?: number;
  interestRate?: number;
  maturityDate?: DateYMD;
  convertsOn: ConvertibleConvertsOn;
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
  shareClasses: ShareClass[];
  holdings: Holding[];
  financingRounds: FinancingRound[];
  convertibles: ConvertibleInstrument[];
  settings: Settings;
};

export type AppState = CompanyState & {
  schemaVersion: SchemaVersion;
};

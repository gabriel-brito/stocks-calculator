import type { z } from "zod";

import type { AppState } from "../types";
import type { DateYMD } from "../date";
import { AppStateSchemaV1 } from "../schema.v1";

export type AppStateV1 = z.infer<typeof AppStateSchemaV1>;

const asDate = (value: string): DateYMD => value as DateYMD;

export const migrateV1ToV2 = (state: AppStateV1): AppState => ({
  schemaVersion: "v2",
  capTableBase: state.capTableBase,
  dilutionEvents: state.dilutionEvents.map((event) => ({
    ...event,
    date: asDate(event.date),
  })),
  valuations: {
    entry: {
      ...state.valuations.entry,
      date: asDate(state.valuations.entry.date),
    },
    current: {
      ...state.valuations.current,
      date: asDate(state.valuations.current.date),
    },
  },
  exitScenario: state.exitScenario
    ? {
        ...state.exitScenario,
        date: asDate(state.exitScenario.date),
      }
    : undefined,
  optionGrants: state.optionGrants.map((grant) => ({
    quantityGranted: grant.quantityGranted,
    strikePrice: grant.strikePrice,
    grantDate: asDate(grant.grantDate),
    expirationDate: grant.expirationDate
      ? asDate(grant.expirationDate)
      : undefined,
    vestingSchedule: {
      startDate: asDate(grant.grantDate),
      cliffMonths: 12,
      totalMonths: 36,
      frequency: "MONTHLY",
    },
    acceleration: {
      type: "NONE",
      percent: 0,
    },
  })),
  purchasePlans: state.purchasePlans.map((plan) => ({
    ...plan,
    startDate: asDate(plan.startDate),
    contributionChanges: plan.contributionChanges?.map((change) => ({
      ...change,
      effectiveDate: asDate(change.effectiveDate),
    })),
  })),
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
      holderId: "common-holders",
      classId: "common",
      shares:
        state.capTableBase.commonOutstanding +
        state.capTableBase.optionPoolReserved +
        state.capTableBase.otherDilutiveShares,
    },
  ],
  financingRounds: [],
  convertibles: [],
  settings: state.settings,
});

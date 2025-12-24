import { monthsBetweenFloor } from "../date";
import type { OptionGrant, VestingFrequency } from "../types";

export type VestingSnapshot = {
  vestedPercent: number;
  vestedQty: number;
};

const getPeriodSize = (frequency: VestingFrequency) =>
  frequency === "QUARTERLY" ? 3 : 1;

export const computeVestingFromSchedule = (
  grant: OptionGrant,
  asOfDate: string,
): VestingSnapshot => {
  const schedule = grant.vestingSchedule;
  const monthsElapsed = monthsBetweenFloor(schedule.startDate, asOfDate);
  if (monthsElapsed < schedule.cliffMonths) {
    return { vestedPercent: 0, vestedQty: 0 };
  }

  const periodSize = getPeriodSize(schedule.frequency);
  const periodsTotal = Math.max(1, Math.ceil(schedule.totalMonths / periodSize));
  const periodsElapsed =
    Math.floor((monthsElapsed - schedule.cliffMonths) / periodSize) + 1;
  const vestedPercent = Math.min(1, periodsElapsed / periodsTotal);

  return {
    vestedPercent,
    vestedQty: Math.floor(grant.quantityGranted * vestedPercent),
  };
};

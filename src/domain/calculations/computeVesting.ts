import { monthsBetweenFloor } from "../date";

export type VestingSnapshot = {
  vestedPercent: number;
  vestedQty: number;
};

export const computeVesting = (
  grantDate: string,
  quantityGranted: number,
  asOfDate: string,
): VestingSnapshot => {
  const months = monthsBetweenFloor(grantDate, asOfDate);
  let vestedPercent = 0;

  if (months >= 36) {
    vestedPercent = 1;
  } else if (months >= 24) {
    vestedPercent = 0.5;
  } else if (months >= 12) {
    vestedPercent = 0.25;
  }

  return {
    vestedPercent,
    vestedQty: Math.floor(quantityGranted * vestedPercent),
  };
};

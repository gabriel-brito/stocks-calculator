import type { CapTableBase, DilutionEvent } from "../types";
import { compareYMD } from "../date";

export const computeFD = (
  base: CapTableBase,
  events: DilutionEvent[],
  asOfDate: string,
) => {
  const baseTotal =
    base.commonOutstanding + base.optionPoolReserved + base.otherDilutiveShares;
  const dilutionTotal = events
    .filter((event) => compareYMD(event.date, asOfDate) <= 0)
    .reduce((sum, event) => sum + event.sharesIssued, 0);

  return baseTotal + dilutionTotal;
};

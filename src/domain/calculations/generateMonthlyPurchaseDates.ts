import { addMonthsKeepDayClamped, compareYMD, parseYMD } from "../date";

export const generateMonthlyPurchaseDates = (
  startDate: string,
  asOfDate: string,
  purchaseDayOfMonth: number,
) => {
  const start = parseYMD(startDate);
  let cursor =
    start.d > purchaseDayOfMonth
      ? addMonthsKeepDayClamped(startDate, 1, purchaseDayOfMonth)
      : addMonthsKeepDayClamped(startDate, 0, purchaseDayOfMonth);

  const dates: string[] = [];
  while (compareYMD(cursor, asOfDate) <= 0) {
    dates.push(cursor);
    cursor = addMonthsKeepDayClamped(cursor, 1, purchaseDayOfMonth);
  }

  return dates;
};

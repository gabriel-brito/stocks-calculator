export type DateYMD = `${number}-${number}-${number}`;

const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;

const isLeapYear = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const daysInMonth = (year: number, month: number) => {
  switch (month) {
    case 2:
      return isLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
};

export const isValidYMD = (value: string) => {
  if (!ymdRegex.test(value)) {
    return false;
  }

  const [y, m, d] = value.split("-").map((part) => Number(part));
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return false;
  }
  if (m < 1 || m > 12) {
    return false;
  }
  if (d < 1 || d > daysInMonth(y, m)) {
    return false;
  }

  return true;
};

export const parseYMD = (value: string) => {
  if (!isValidYMD(value)) {
    throw new Error(`Invalid YYYY-MM-DD date: ${value}`);
  }
  const [y, m, d] = value.split("-").map((part) => Number(part));
  return { y, m, d };
};

export const formatYMD = (y: number, m: number, d: number): DateYMD => {
  const yy = String(y).padStart(4, "0");
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${yy}-${mm}-${dd}` as DateYMD;
};

export const compareYMD = (a: string, b: string) => {
  const aParts = parseYMD(a);
  const bParts = parseYMD(b);
  if (aParts.y !== bParts.y) {
    return aParts.y < bParts.y ? -1 : 1;
  }
  if (aParts.m !== bParts.m) {
    return aParts.m < bParts.m ? -1 : 1;
  }
  if (aParts.d !== bParts.d) {
    return aParts.d < bParts.d ? -1 : 1;
  }
  return 0;
};

export const addMonthsKeepDayClamped = (
  ymd: string,
  months: number,
  dayOfMonth: number,
): DateYMD => {
  const { y, m } = parseYMD(ymd);
  const totalMonths = y * 12 + (m - 1) + months;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonth = (totalMonths % 12) + 1;
  return formatYMD(nextYear, nextMonth, dayOfMonth);
};

export const monthsBetweenFloor = (fromYMD: string, toYMD: string) => {
  if (compareYMD(toYMD, fromYMD) < 0) {
    return 0;
  }
  const from = parseYMD(fromYMD);
  const to = parseYMD(toYMD);
  let months = (to.y - from.y) * 12 + (to.m - from.m);
  if (to.d < from.d) {
    months -= 1;
  }
  return Math.max(0, months);
};

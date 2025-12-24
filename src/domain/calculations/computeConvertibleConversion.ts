import type { ConvertibleInstrument } from "../types";
import { compareYMD, monthsBetweenFloor } from "../date";

export type ConvertibleConversion = {
  conversionPrice: number;
  sharesIssued: number;
  amountConverted: number;
};

export const computeConvertibleAmount = (
  convertible: ConvertibleInstrument,
  asOfDate: string,
) => {
  if (convertible.type !== "NOTE" || !convertible.interestRate) {
    return convertible.amount;
  }

  const monthsElapsed =
    compareYMD(convertible.dateIssued, asOfDate) <= 0
      ? monthsBetweenFloor(convertible.dateIssued, asOfDate)
      : 0;
  const years = monthsElapsed / 12;
  return convertible.amount * (1 + convertible.interestRate * years);
};

export const computeConvertibleConversion = (
  convertible: ConvertibleInstrument,
  basePrice: number,
  preRoundFD: number,
  asOfDate: string,
): ConvertibleConversion | null => {
  if (basePrice <= 0 || preRoundFD <= 0) return null;

  const amountConverted = computeConvertibleAmount(convertible, asOfDate);
  const priceCandidates: number[] = [basePrice];

  if (convertible.discount !== undefined) {
    priceCandidates.push(basePrice * (1 - convertible.discount));
  }
  if (convertible.cap !== undefined) {
    priceCandidates.push(convertible.cap / preRoundFD);
  }

  const conversionPrice = Math.min(...priceCandidates.filter((value) => value > 0));
  if (conversionPrice <= 0) return null;

  return {
    conversionPrice,
    sharesIssued: amountConverted / conversionPrice,
    amountConverted,
  };
};

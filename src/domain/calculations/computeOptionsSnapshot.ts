import type {
  CapTableBase,
  DilutionEvent,
  OptionGrant,
  ValuationPoint,
} from "../types";
import { computeFD } from "./computeFD";
import { computeSharePrice } from "./computeSharePrice";
import { computeVesting } from "./computeVesting";
import { compareYMD } from "../date";

export type OptionsSnapshot = {
  fdAsOf: number;
  sharePriceAsOf: number;
  fdAtGrant: number;
  equityPercentFDAtGrant: number;
  vestedPercent: number;
  vestedQty: number;
  intrinsicPerOption: number;
  intrinsicValueVested: number;
  expired: boolean;
};

export const computeOptionsSnapshot = (
  grant: OptionGrant,
  valuationPoint: ValuationPoint,
  capTableBase: CapTableBase,
  dilutionEvents: DilutionEvent[],
  asOfDate: string,
): OptionsSnapshot => {
  const fdAsOf = computeFD(capTableBase, dilutionEvents, asOfDate);
  const sharePriceAsOf = computeSharePrice(valuationPoint.equityValue, fdAsOf);
  const fdAtGrant = computeFD(capTableBase, dilutionEvents, grant.grantDate);
  const equityPercentFDAtGrant =
    fdAtGrant > 0 ? grant.quantityGranted / fdAtGrant : 0;
  const { vestedPercent, vestedQty } = computeVesting(
    grant.grantDate,
    grant.quantityGranted,
    asOfDate,
  );

  const intrinsicPerOption = Math.max(sharePriceAsOf - grant.strikePrice, 0);
  const expired =
    grant.expirationDate !== undefined &&
    compareYMD(grant.expirationDate, asOfDate) < 0;
  const intrinsicValueVested = expired
    ? 0
    : intrinsicPerOption * vestedQty;

  return {
    fdAsOf,
    sharePriceAsOf,
    fdAtGrant,
    equityPercentFDAtGrant,
    vestedPercent,
    vestedQty,
    intrinsicPerOption,
    intrinsicValueVested,
    expired,
  };
};

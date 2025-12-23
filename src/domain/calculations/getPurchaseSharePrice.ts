import type { PurchasePlan, ValuationPoint } from "../types";
import { computeSharePrice } from "./computeSharePrice";

export const getPurchaseSharePrice = (
  plan: PurchasePlan,
  entryValuation: ValuationPoint,
  entryFD: number,
) => {
  if (plan.purchasePriceMode === "FIXED_SHARE_PRICE") {
    if (plan.purchaseSharePriceFixed === undefined) {
      throw new Error("purchaseSharePriceFixed is required for fixed pricing");
    }
    return plan.purchaseSharePriceFixed;
  }

  return computeSharePrice(entryValuation.equityValue, entryFD);
};

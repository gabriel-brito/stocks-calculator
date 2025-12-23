import { z } from "zod";

import type { DateYMD } from "./date";
import { isValidYMD } from "./date";

const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;
const ymdDate = z
  .string()
  .regex(ymdRegex)
  .refine((value) => isValidYMD(value), {
    message: "Invalid YYYY-MM-DD date",
  })
  .transform((value) => value as DateYMD);

const nonNegativeNumber = z.number().min(0);
const positiveNumber = z.number().gt(0);

const capTableBaseSchema = z.object({
  commonOutstanding: nonNegativeNumber,
  optionPoolReserved: nonNegativeNumber,
  otherDilutiveShares: nonNegativeNumber,
});

const valuationPointSchema = z.object({
  date: ymdDate,
  equityValue: nonNegativeNumber,
});

const dilutionEventSchema = z.object({
  date: ymdDate,
  sharesIssued: nonNegativeNumber,
  description: z.string().min(1).optional(),
});

const exitScenarioSchema = z.object({
  date: ymdDate,
  exitEquityValue: nonNegativeNumber,
});

const vestingSchema = z.enum(["25_25_50"]);

const optionGrantSchema = z.object({
  quantityGranted: positiveNumber,
  strikePrice: nonNegativeNumber,
  grantDate: ymdDate,
  expirationDate: ymdDate.optional(),
  vesting: vestingSchema,
});

const purchasePriceModeSchema = z.enum([
  "FIXED_SHARE_PRICE",
  "ENTRY_VALUATION_ANCHORED",
]);

const purchasePlanSchema = z
  .object({
    startDate: ymdDate,
    purchaseDayOfMonth: z.number().int().min(1).max(28),
    monthlyAmount: positiveNumber,
    contributionChanges: z
      .array(
        z.object({
          effectiveDate: ymdDate,
          monthlyAmount: nonNegativeNumber,
        }),
      )
      .max(5)
      .optional(),
    purchasePriceMode: purchasePriceModeSchema,
    purchaseSharePriceFixed: nonNegativeNumber.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.contributionChanges) {
      const dates = value.contributionChanges.map((change) => change.effectiveDate);
      const uniqueDates = new Set(dates);
      if (uniqueDates.size !== dates.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "contributionChanges effectiveDate must be unique",
          path: ["contributionChanges"],
        });
      }
    }
    if (
      value.purchasePriceMode === "FIXED_SHARE_PRICE" &&
      (value.purchaseSharePriceFixed === undefined ||
        value.purchaseSharePriceFixed <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "purchaseSharePriceFixed is required and must be > 0",
        path: ["purchaseSharePriceFixed"],
      });
    }
  });

const settingsSchema = z.object({
  persistenceOptIn: z.boolean(),
  currency: z.literal("BRL"),
});

export const AppStateSchema = z.object({
  schemaVersion: z.literal("v1"),
  capTableBase: capTableBaseSchema,
  dilutionEvents: z.array(dilutionEventSchema),
  valuations: z.object({
    entry: valuationPointSchema,
    current: valuationPointSchema,
  }),
  exitScenario: exitScenarioSchema.optional(),
  optionGrants: z.array(optionGrantSchema),
  purchasePlans: z.array(purchasePlanSchema),
  settings: settingsSchema,
});

export const parseAppState = (json: unknown) => {
  const result = AppStateSchema.safeParse(json);
  if (result.success) {
    return { ok: true, value: result.data } as const;
  }

  return {
    ok: false,
    errors: result.error.issues.map((issue) => {
      const path =
        issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    }),
  } as const;
};

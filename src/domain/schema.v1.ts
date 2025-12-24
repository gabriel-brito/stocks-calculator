import { z } from "zod";

import { isValidYMD } from "./date";

const ymdRegex = /^\d{4}-\d{2}-\d{2}$/;
const ymdDate = z
  .string()
  .regex(ymdRegex)
  .refine((value) => isValidYMD(value), {
    message: "Invalid YYYY-MM-DD date",
  });

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

const optionGrantSchema = z.object({
  quantityGranted: positiveNumber,
  strikePrice: nonNegativeNumber,
  grantDate: ymdDate,
  expirationDate: ymdDate.optional(),
  vesting: z.literal("25_25_50"),
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
    if (value.purchasePriceMode === "FIXED_SHARE_PRICE") {
      if (
        value.purchaseSharePriceFixed === undefined ||
        value.purchaseSharePriceFixed <= 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "purchaseSharePriceFixed is required and must be > 0",
          path: ["purchaseSharePriceFixed"],
        });
      }
    }
  });

const settingsSchema = z.object({
  persistenceOptIn: z.boolean(),
  currency: z.literal("BRL"),
});

export const AppStateSchemaV1 = z.object({
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

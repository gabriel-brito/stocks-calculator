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

const exitScenarioSchema = z
  .object({
    date: ymdDate,
    exitEquityValue: nonNegativeNumber.optional(),
    enterpriseValue: nonNegativeNumber.optional(),
    netDebt: nonNegativeNumber.optional(),
    fees: nonNegativeNumber.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.exitEquityValue === undefined && value.enterpriseValue === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "exitEquityValue or enterpriseValue is required",
        path: ["exitEquityValue"],
      });
    }
  });

const vestingFrequencySchema = z.enum(["MONTHLY", "QUARTERLY"]);

const vestingScheduleSchema = z
  .object({
    startDate: ymdDate,
    cliffMonths: z.number().int().min(0),
    totalMonths: z.number().int().gt(0),
    frequency: vestingFrequencySchema,
  })
  .superRefine((value, ctx) => {
    if (value.cliffMonths > value.totalMonths) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "cliffMonths must be <= totalMonths",
        path: ["cliffMonths"],
      });
    }
  });

const optionGrantSchema = z.object({
  quantityGranted: positiveNumber,
  strikePrice: nonNegativeNumber,
  grantDate: ymdDate,
  expirationDate: ymdDate.optional(),
  vestingSchedule: vestingScheduleSchema,
  terminationDate: ymdDate.optional(),
  postTerminationExerciseWindowDays: z.number().int().min(0).optional(),
  acceleration: z
    .object({
      type: z.enum(["NONE", "SINGLE_TRIGGER", "DOUBLE_TRIGGER"]),
      percent: z.number().min(0).max(1),
    })
    .optional(),
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

const shareClassSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(["COMMON", "PREFERRED"]),
    seniority: z.number().int().min(0),
    preferenceMultiple: nonNegativeNumber,
    investedAmount: nonNegativeNumber,
    participation: z.enum(["NONE", "FULL"]),
    participationCapMultiple: nonNegativeNumber.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "PREFERRED" && value.preferenceMultiple <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "preferenceMultiple must be > 0 for preferred classes",
        path: ["preferenceMultiple"],
      });
    }
    if (
      value.participationCapMultiple !== undefined &&
      value.participationCapMultiple <= 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "participationCapMultiple must be > 0 when provided",
        path: ["participationCapMultiple"],
      });
    }
    if (value.type === "COMMON" && value.participation !== "NONE") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "common classes must use participation NONE",
        path: ["participation"],
      });
    }
  });

const holdingSchema = z.object({
  holderId: z.string().min(1),
  classId: z.string().min(1),
  shares: nonNegativeNumber,
});

const financingRoundSchema = z.object({
  date: ymdDate,
  preMoney: positiveNumber,
  investmentAmount: positiveNumber,
  targetOptionPoolPostPercent: z.number().min(0).max(0.99).optional(),
  seriesName: z.string().min(1),
  createsShareClassId: z.string().min(1).optional(),
});

const convertibleSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["SAFE", "NOTE"]),
    dateIssued: ymdDate,
    amount: positiveNumber,
    cap: positiveNumber.optional(),
    discount: z.number().min(0).max(0.99).optional(),
    interestRate: z.number().min(0).max(1).optional(),
    maturityDate: ymdDate.optional(),
    convertsOn: z.enum(["NEXT_EQUITY_ROUND", "EXIT", "BOTH"]),
  })
  .superRefine((value, ctx) => {
    if (value.type === "NOTE") {
      if (value.interestRate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "interestRate is required for NOTE",
          path: ["interestRate"],
        });
      }
      if (!value.maturityDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "maturityDate is required for NOTE",
          path: ["maturityDate"],
        });
      }
    }
  });

export const AppStateSchema = z
  .object({
    schemaVersion: z.literal("v2"),
    capTableBase: capTableBaseSchema,
    dilutionEvents: z.array(dilutionEventSchema),
    valuations: z.object({
      entry: valuationPointSchema,
      current: valuationPointSchema,
    }),
    exitScenario: exitScenarioSchema.optional(),
    optionGrants: z.array(optionGrantSchema),
    purchasePlans: z.array(purchasePlanSchema),
    shareClasses: z.array(shareClassSchema),
    holdings: z.array(holdingSchema),
    financingRounds: z.array(financingRoundSchema).default([]),
    convertibles: z.array(convertibleSchema).default([]),
    settings: settingsSchema,
  })
  .superRefine((value, ctx) => {
    const ids = value.shareClasses.map((item) => item.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "shareClasses id must be unique",
        path: ["shareClasses"],
      });
    }

    const hasCommon = value.shareClasses.some((item) => item.type === "COMMON");
    if (!hasCommon) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "shareClasses must include at least one COMMON class",
        path: ["shareClasses"],
      });
    }

    const classIds = new Set(value.shareClasses.map((item) => item.id));
    value.holdings.forEach((holding, index) => {
      if (!classIds.has(holding.classId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "holding classId must reference a share class",
          path: ["holdings", index, "classId"],
        });
      }
    });
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

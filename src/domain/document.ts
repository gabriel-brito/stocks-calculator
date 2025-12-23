import { z } from "zod";

import { AppStateSchema } from "./schema";
import type { AppState } from "./types";

export const SCHEMA_VERSION = "v1" as const;

export type AppDocument = {
  schemaVersion: typeof SCHEMA_VERSION;
  state: AppState;
};

const appDocumentSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  state: AppStateSchema,
});

export const createDocument = (state: AppState): AppDocument => ({
  schemaVersion: SCHEMA_VERSION,
  state,
});

export const parseDocument = (jsonStringOrObject: unknown) => {
  let raw: unknown = jsonStringOrObject;

  if (typeof jsonStringOrObject === "string") {
    try {
      raw = JSON.parse(jsonStringOrObject) as unknown;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid JSON string";
      return {
        ok: false,
        errors: [`Invalid JSON: ${message}`],
      } as const;
    }
  }

  const result = appDocumentSchema.safeParse(raw);
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

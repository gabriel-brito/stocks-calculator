import { z } from "zod";

import { AppStateSchema } from "./schema";
import { AppStateSchemaV1 } from "./schema.v1";
import type { AppState } from "./types";
import { migrateV1ToV2 } from "./migrations";

export const SCHEMA_VERSION = "v2" as const;

export type AppDocument = {
  schemaVersion: typeof SCHEMA_VERSION;
  state: AppState;
};

const appDocumentSchemaV2 = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  state: AppStateSchema,
});

const appDocumentSchemaV1 = z.object({
  schemaVersion: z.literal("v1"),
  state: AppStateSchemaV1,
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

  const v2Result = appDocumentSchemaV2.safeParse(raw);
  if (v2Result.success) {
    return { ok: true, value: v2Result.data } as const;
  }

  const v1Result = appDocumentSchemaV1.safeParse(raw);
  if (v1Result.success) {
    const migratedState = migrateV1ToV2(v1Result.data.state);
    const migratedResult = AppStateSchema.safeParse(migratedState);
    if (migratedResult.success) {
      return {
        ok: true,
        value: { schemaVersion: SCHEMA_VERSION, state: migratedResult.data },
      } as const;
    }
    return {
      ok: false,
      errors: migratedResult.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
        return `${path}${issue.message}`;
      }),
    } as const;
  }

  return {
    ok: false,
    errors: v2Result.error.issues.map((issue) => {
      const path =
        issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    }),
  } as const;
};

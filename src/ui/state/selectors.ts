import type { AppState } from "@/domain/types";

export const isExitEnabled = (state: AppState) => state.exitScenario !== undefined;

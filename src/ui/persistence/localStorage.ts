import { createDocument, parseDocument } from "@/domain/document";
import type { AppState } from "@/domain/types";

const STORAGE_KEY = "stocks-calculator:app-document";

export const loadAppState = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  const parsed = parseDocument(raw);
  if (!parsed.ok) {
    return null;
  }

  return parsed.value.state;
};

export const saveAppState = (state: AppState) => {
  if (typeof window === "undefined") {
    return;
  }

  const document = createDocument(state);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
};

export const clearAppState = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};

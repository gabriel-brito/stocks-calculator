"use client";

import type { ReactNode } from "react";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";

import type { DateYMD } from "@/domain/date";
import type { AppState } from "@/domain/types";
import { normalizePurchasePlan } from "@/domain/normalize";

import {
  createHolding,
  createFinancingRound,
  createConvertible,
  createOptionGrant,
  createPurchasePlan,
  createShareClass,
  type AppAction,
} from "./actions";
import { clearAppState, loadAppState, saveAppState } from "../persistence/localStorage";

type AppStateContextValue = {
  state: AppState;
};

type AppDispatchContextValue = {
  dispatch: React.Dispatch<AppAction>;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(
  undefined,
);
const AppDispatchContext = createContext<AppDispatchContextValue | undefined>(
  undefined,
);

const DEFAULT_DATE: DateYMD = "2024-01-01";

const getDefaultState = (): AppState => ({
  schemaVersion: "v2",
  capTableBase: {
    commonOutstanding: 0,
    optionPoolReserved: 0,
    otherDilutiveShares: 0,
  },
  dilutionEvents: [],
  valuations: {
    entry: {
      date: DEFAULT_DATE,
      equityValue: 0,
    },
    current: {
      date: DEFAULT_DATE,
      equityValue: 0,
    },
  },
  optionGrants: [],
  purchasePlans: [],
  shareClasses: [
    {
      id: "common",
      name: "Common",
      type: "COMMON",
      seniority: 0,
      preferenceMultiple: 0,
      investedAmount: 0,
      participation: "NONE",
    },
  ],
  holdings: [
    {
      holderId: "You",
      classId: "common",
      shares: 0,
    },
  ],
  financingRounds: [],
  convertibles: [],
  settings: {
    persistenceOptIn: false,
    currency: "BRL",
  },
});

const normalizePurchasePlans = (plans: AppState["purchasePlans"]) =>
  plans.map((plan) => normalizePurchasePlan(plan));

const appStateReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case "state/replace":
      return {
        ...action.state,
        purchasePlans: normalizePurchasePlans(action.state.purchasePlans),
      };
    case "state/reset":
      return getDefaultState();
    case "capTable/update":
      return {
        ...state,
        capTableBase: {
          ...state.capTableBase,
          [action.field]: action.value,
        },
      };
    case "valuation/update":
      return {
        ...state,
        valuations: {
          ...state.valuations,
          [action.point]: {
            ...state.valuations[action.point],
            [action.field]: action.value,
          },
        },
      };
    case "exit/set-enabled":
      return {
        ...state,
        exitScenario: action.enabled
          ? state.exitScenario ?? { date: DEFAULT_DATE, exitEquityValue: 0 }
          : undefined,
      };
    case "exit/replace":
      return {
        ...state,
        exitScenario: action.value,
      };
    case "exit/update":
      if (!state.exitScenario) {
        return state;
      }
      return {
        ...state,
        exitScenario: {
          ...state.exitScenario,
          [action.field]: action.value,
        },
      };
    case "option/add":
      return {
        ...state,
        optionGrants: [...state.optionGrants, createOptionGrant()],
      };
    case "option/replace":
      return {
        ...state,
        optionGrants: action.value,
      };
    case "option/update":
      return {
        ...state,
        optionGrants: state.optionGrants.map((grant, index) =>
          index === action.index ? { ...grant, [action.field]: action.value } : grant,
        ),
      };
    case "option/remove":
      return {
        ...state,
        optionGrants: state.optionGrants.filter((_, index) => index !== action.index),
      };
    case "purchase/add":
      return {
        ...state,
        purchasePlans: normalizePurchasePlans([
          ...state.purchasePlans,
          createPurchasePlan(),
        ]),
      };
    case "purchase/replace":
      return {
        ...state,
        purchasePlans: normalizePurchasePlans(action.value),
      };
    case "purchase/update":
      return {
        ...state,
        purchasePlans: normalizePurchasePlans(
          state.purchasePlans.map((plan, index) =>
            index === action.index ? { ...plan, [action.field]: action.value } : plan,
          ),
        ),
      };
    case "purchase/remove":
      return {
        ...state,
        purchasePlans: state.purchasePlans.filter((_, index) => index !== action.index),
      };
    case "share-class/add": {
      const next = createShareClass(state.shareClasses.length);
      return {
        ...state,
        shareClasses: [...state.shareClasses, next],
      };
    }
    case "share-class/replace":
      return {
        ...state,
        shareClasses: action.value,
      };
    case "share-class/update":
      return {
        ...state,
        shareClasses: state.shareClasses.map((shareClass, index) =>
          index === action.index
            ? { ...shareClass, [action.field]: action.value }
            : shareClass,
        ),
      };
    case "share-class/remove": {
      const nextClasses = state.shareClasses.filter(
        (_, index) => index !== action.index,
      );
      const nextClassIds = new Set(nextClasses.map((item) => item.id));
      return {
        ...state,
        shareClasses: nextClasses,
        holdings: state.holdings.filter((holding) =>
          nextClassIds.has(holding.classId),
        ),
      };
    }
    case "holding/add": {
      const firstClass = state.shareClasses[0]?.id ?? "common";
      return {
        ...state,
        holdings: [...state.holdings, createHolding(firstClass)],
      };
    }
    case "holding/replace":
      return {
        ...state,
        holdings: action.value,
      };
    case "holding/update":
      return {
        ...state,
        holdings: state.holdings.map((holding, index) =>
          index === action.index ? { ...holding, [action.field]: action.value } : holding,
        ),
      };
    case "holding/remove":
      return {
        ...state,
        holdings: state.holdings.filter((_, index) => index !== action.index),
      };
    case "round/add":
      return {
        ...state,
        financingRounds: [...state.financingRounds, createFinancingRound()],
      };
    case "round/update":
      return {
        ...state,
        financingRounds: state.financingRounds.map((round, index) =>
          index === action.index ? { ...round, [action.field]: action.value } : round,
        ),
      };
    case "round/remove":
      return {
        ...state,
        financingRounds: state.financingRounds.filter((_, index) => index !== action.index),
      };
    case "convertible/add":
      return {
        ...state,
        convertibles: [...state.convertibles, createConvertible()],
      };
    case "convertible/update":
      return {
        ...state,
        convertibles: state.convertibles.map((item, index) =>
          index === action.index ? { ...item, [action.field]: action.value } : item,
        ),
      };
    case "convertible/remove":
      return {
        ...state,
        convertibles: state.convertibles.filter((_, index) => index !== action.index),
      };
    case "settings/update":
      return {
        ...state,
        settings: {
          ...state.settings,
          [action.field]: action.value,
        },
      };
    default:
      return state;
  }
};

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(
    appStateReducer,
    undefined,
    () => loadAppState() ?? getDefaultState(),
  );
  const debounceRef = useRef<number | undefined>(undefined);
  const stateValue = useMemo(() => ({ state }), [state]);
  const dispatchValue = useMemo(() => ({ dispatch }), [dispatch]);

  useEffect(() => {
    if (!state.settings.persistenceOptIn) {
      clearAppState();
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      saveAppState(state);
    }, 500);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [state]);

  return (
    <AppStateContext.Provider value={stateValue}>
      <AppDispatchContext.Provider value={dispatchValue}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
};

export const useAppDispatch = () => {
  const context = useContext(AppDispatchContext);
  if (!context) {
    throw new Error("useAppDispatch must be used within AppStateProvider");
  }
  return context.dispatch;
};

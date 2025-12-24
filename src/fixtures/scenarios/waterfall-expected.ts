export type WaterfallExpected = {
  id: string;
  classPayouts: Record<string, number>;
  holderPayouts: Record<string, number>;
};

export const waterfallExpectations: WaterfallExpected[] = [
  {
    id: "waterfall-low-exit",
    classPayouts: {
      common: 0,
      "series-a": 4_000_000,
    },
    holderPayouts: {
      Founders: 0,
      "Investors A": 4_000_000,
    },
  },
  {
    id: "waterfall-medium-exit",
    classPayouts: {
      common: 2_000_000,
      "series-a": 5_000_000,
    },
    holderPayouts: {
      Founders: 2_000_000,
      "Investors A": 5_000_000,
    },
  },
  {
    id: "waterfall-high-exit",
    classPayouts: {
      common: 33_333_333.3333,
      "series-a": 6_666_666.6667,
    },
    holderPayouts: {
      Founders: 33_333_333.3333,
      "Investors A": 6_666_666.6667,
    },
  },
  {
    id: "waterfall-multi-series",
    classPayouts: {
      common: 2_000_000,
      "series-a": 6_000_000,
      "series-b": 4_000_000,
    },
    holderPayouts: {
      Founders: 2_000_000,
      "Investors A": 6_000_000,
      "Investors B": 4_000_000,
    },
  },
  {
    id: "waterfall-holdings-audit",
    classPayouts: {
      common: 4_000_000,
      "series-a": 5_000_000,
    },
    holderPayouts: {
      You: 2_000_000,
      Team: 2_000_000,
      "Investors A": 5_000_000,
    },
  },
  {
    id: "waterfall-participating-full",
    classPayouts: {
      common: 4_166_666.6667,
      "series-a": 5_833_333.3333,
    },
    holderPayouts: {
      Founders: 4_166_666.6667,
      "Investors A": 5_833_333.3333,
    },
  },
  {
    id: "waterfall-participating-cap-2x",
    classPayouts: {
      common: 50_000_000,
      "series-a": 10_000_000,
    },
    holderPayouts: {
      Founders: 50_000_000,
      "Investors A": 10_000_000,
    },
  },
  {
    id: "waterfall-participating-cap-3x",
    classPayouts: {
      common: 65_000_000,
      "series-a": 15_000_000,
    },
    holderPayouts: {
      Founders: 65_000_000,
      "Investors A": 15_000_000,
    },
  },
  {
    id: "waterfall-participating-multi-series",
    classPayouts: {
      common: 6_666_666.6667,
      "series-a": 5_333_333.3333,
      "series-b": 3_000_000,
    },
    holderPayouts: {
      Founders: 6_666_666.6667,
      "Investors A": 5_333_333.3333,
      "Investors B": 3_000_000,
    },
  },
  {
    id: "waterfall-participating-cap-multi",
    classPayouts: {
      common: 31_304_347.8261,
      "series-a": 10_000_000,
      "series-b": 8_695_652.1739,
    },
    holderPayouts: {
      Founders: 31_304_347.8261,
      "Investors A": 10_000_000,
      "Investors B": 8_695_652.1739,
    },
  },
];

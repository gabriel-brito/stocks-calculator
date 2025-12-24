export type FinancingRoundExpected = {
  id: string;
  rounds: Array<{
    pricePerShare: number;
    newShares: number;
    poolIncrease: number;
    postRoundFD: number;
  }>;
};

export const financingRoundExpectations: FinancingRoundExpected[] = [
  {
    id: "rounds-series-a-no-topup",
    rounds: [
      {
        pricePerShare: 10,
        newShares: 220_000,
        poolIncrease: 0,
        postRoundFD: 1_320_000,
      },
    ],
  },
  {
    id: "rounds-series-a-topup-15",
    rounds: [
      {
        pricePerShare: 10,
        newShares: 220_000,
        poolIncrease: 115_294.1176,
        postRoundFD: 1_435_294.1176,
      },
    ],
  },
  {
    id: "rounds-two-series",
    rounds: [
      {
        pricePerShare: 10,
        newShares: 220_000,
        poolIncrease: 0,
        postRoundFD: 1_320_000,
      },
      {
        pricePerShare: 15.1515,
        newShares: 264_000,
        poolIncrease: 0,
        postRoundFD: 1_584_000,
      },
    ],
  },
  {
    id: "rounds-two-series-topup",
    rounds: [
      {
        pricePerShare: 10,
        newShares: 220_000,
        poolIncrease: 115_294.1176,
        postRoundFD: 1_435_294.1176,
      },
      {
        pricePerShare: 13.9344,
        newShares: 287_058.8235,
        poolIncrease: 161_470.5882,
        postRoundFD: 1_883_823.5294,
      },
    ],
  },
  {
    id: "rounds-topup-20",
    rounds: [
      {
        pricePerShare: 7.2727,
        newShares: 220_000,
        poolIncrease: 205_000,
        postRoundFD: 1_525_000,
      },
    ],
  },
];

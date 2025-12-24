export type ConvertibleExpected = {
  id: string;
  conversionPrice: number;
  sharesIssued: number;
};

export const convertibleExpectations: ConvertibleExpected[] = [
  {
    id: "convertible-cap-only",
    conversionPrice: 5.4545,
    sharesIssued: 183_333.3333,
  },
  {
    id: "convertible-discount-only",
    conversionPrice: 7.2727,
    sharesIssued: 137_500,
  },
  {
    id: "convertible-cap-discount",
    conversionPrice: 7.2727,
    sharesIssued: 137_500,
  },
  {
    id: "convertible-exit-only",
    conversionPrice: 8.7272,
    sharesIssued: 114_583.3333,
  },
  {
    id: "convertible-note-interest",
    conversionPrice: 7.2727,
    sharesIssued: 151_250,
  },
];

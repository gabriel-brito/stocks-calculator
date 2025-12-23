export const computeSharePrice = (equityValue: number, fd: number) => {
  if (fd <= 0) {
    throw new Error("FD must be greater than zero");
  }

  return equityValue / fd;
};

export const prefixItWithZero = (val: string): string => {
  return val.length === 1 ? `0${val}` : val;
};

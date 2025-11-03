export const formatIndianCurrency = (num: number): string => {
  if (isNaN(num)) {
    num = 0;
  }
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatIndianNumber = (num: number): string => {
    if (isNaN(num)) {
      num = 0;
    }
    return num.toLocaleString('en-IN');
};

const TRADE_REQUIRED_KEYS = [
  'quantity',
  'currencyCode',
  'date1',
  'secCode',
  'price1',
  'side',
  'tsCommission',
  'bankCommission',
];

export const validateTrade = (trade: any): boolean => {
  if (!trade) {
    return false;
  }

  return TRADE_REQUIRED_KEYS.every(key => {
    return Object.keys(trade).includes(key);
  });
};

export const batchValidateTrades = (trades: any[]): boolean => {
  if (!Array.isArray(trades)) {
    return false;
  }

  return trades.every(validateTrade);
};

import { Commission, Trade } from '@prisma/client';

export interface IMarketDataResponse {
  BOARDID: string;
  TRADEDATE: string;
  SHORTNAME: string;
  SECID: string;
  NUMTRADES: number;
  VALUE: number;
  OPEN: number;
  LOW: number;
  HIGH: number;
  LEGALCLOSEPRICE: number;
  WAPRICE: number;
  CLOSE: number;
  VOLUME: number;
  MARKETPRICE2: number;
  MARKETPRICE3: number;
  ADMITTEDQUOTE: number;
  MP2VALTRD: number;
  MARKETPRICE3TRADESVALUE: number;
  ADMITTEDVALUE: number;
  WAVAL: number;
  TRADINGSESSION: 0 | 1 | 2 | 3;
}

export interface IAsset {
  avgBuyPrice: number;
  closePrice?: number;
  quantity: number;
}

export interface IPortfolio {
  [k: string]: IAsset;
}

export interface IPortfolioInfo {
  [k: string]: IMarketDataResponse;
}

export interface ITickerChange {
  ticker: string;
  closePrice: number;
  change: number;
}

export type TradeWithCommission = Trade & { commission: Commission };

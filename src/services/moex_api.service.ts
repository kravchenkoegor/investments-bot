import axios, { AxiosInstance } from 'axios';
import {
  BOARD,
  ENGINE,
  MARKET,
} from '../constants';
import {
  IMarketDataResponse,
  IPortfolioInfo,
} from '../interfaces';

interface IMoexApi {
  axiosInstance: AxiosInstance;
  tickers: string[];
  getLastAvailableDate: () => Promise<{ from: string; till: string; } | undefined>;
  getMarketData: (
    { ticker, date }: { ticker: string; date: string; }
  ) => Promise<IMarketDataResponse | undefined>;
  getPortfolioInfo: (date: string) => Promise<IPortfolioInfo>;
}

export class MoexApiService implements IMoexApi {
  axiosInstance;
  tickers;

  constructor(tickers: string[]) {
    if (!this.axiosInstance) {
      this.axiosInstance = axios.create({
        baseURL: `${process.env.STOCK_MARKET_API_URL}`,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    this.tickers = tickers;
  }

  async init() {
    const dates = await this.getLastAvailableDate();
    if (dates) {
      await this.getPortfolioInfo(dates.till);
    }
  }

  getUrl(ticker: string) {
    return `/history/engines/${ENGINE}/markets/${MARKET}/boards/${BOARD}/securities/${ticker}.json`;
  }

  async getLastAvailableDate() {
    try {
      const { data } = await this.axiosInstance.get(
        `/history/engines/${ENGINE}/markets/${MARKET}/boards/${BOARD}/dates.json`,
        {
          params: {
            tradingsession: 1,
          },
        },
      );

      const { columns }: { columns: string[] } = data.dates;
      const [values]: [string[]] = data.dates.data;

      if (columns.length !== values.length) {
        return;
      }

      return Object.fromEntries(
        columns.map((_: string, i: number) => [columns[i], values[i]]),
      ) as { from: string; till: string; };
    } catch (error) {
      console.log('[getLastAvailableDate error]:', error);
    }
  }

  async getMarketData({ ticker, date }: { ticker: string; date: string; }) {
    try {
      const { data } = await this.axiosInstance.get(
        this.getUrl(ticker),
        {
          params: {
            from: date,
            till: date,
            tradingsession: 1,
          },
        },
      );

      const { columns }: { columns: (keyof IMarketDataResponse)[] } = data.history;
      const [values]: [(string | number)[]] = data.history.data;

      if (!data.history.data.length || columns.length !== values.length) {
        return;
      }

      return Object.fromEntries(
        columns.map((_, i: number) => [columns[i], values[i]]),
      ) as any;
    } catch (error) {
      console.log('[getMarketData error]:', error);
    }
  }

  async getPortfolioInfo(date: string) {
    const tickersWithClosePrice: IMarketDataResponse[] = await Promise.all(
      this.tickers.map(ticker => this.getMarketData({ ticker, date })),
    );

    const result: IPortfolioInfo = {};

    for (const item of tickersWithClosePrice) {
      result[item.SECID] = item;
    }

    return result;
  }
}

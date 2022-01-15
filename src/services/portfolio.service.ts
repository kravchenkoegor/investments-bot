import axios from 'axios';
import EventEmitter from 'events';
import {
  CalculatorService,
  MoexApiService,
} from '../services';
import {
  formatDateDefault,
  getMaxDate,
  SEND_INITIAL_DATA,
  SEND_LATEST_INFO,
} from '../constants';
import {
  IPortfolio,
  ITickerChange,
  TradeWithCommission,
} from '../interfaces';

interface IPortfolioService {
  calc: CalculatorService;
  moexApi: MoexApiService;
  portfolio: IPortfolio;
  portfolioLatest: IPortfolio;
  serverUrl: string;
  trades: TradeWithCommission[];
}

export class PortfolioService implements IPortfolioService {
  eventEmitter: EventEmitter;
  calc: CalculatorService;
  moexApi: MoexApiService;
  portfolio: IPortfolio;
  portfolioLatest: IPortfolio;
  serverUrl: string;
  trades: TradeWithCommission[];

  constructor(
    { eventEmitter, serverUrl }:
    { eventEmitter: EventEmitter; serverUrl: string; },
  ) {
    this.eventEmitter = eventEmitter;
    this.eventEmitter.on('start', this.sendInitialData.bind(this));
    this.eventEmitter.on('info', this.sendLatestInfo.bind(this));

    this.serverUrl = serverUrl;
    this.calc = new CalculatorService();
  }

  async start() {
    const portfolio = await this.initPortfolio();
    if (portfolio) {
      this.portfolio = portfolio;
      this.moexApi = new MoexApiService(Object.keys(this.portfolio));
    }
  }

  async getPortfolioChanges(date: string) {
    const result: ITickerChange[] = [];
    const data = await this.moexApi.getPortfolioInfo(date);

    for (const ticker in data) {
      if (Object.prototype.hasOwnProperty.call(data, ticker)) {
        const { LEGALCLOSEPRICE: closePrice } = data[ticker];
        const { avgBuyPrice } = this.portfolio[ticker];

        const change = this.calc.getChange(avgBuyPrice, closePrice);
        result.push({
          ticker,
          closePrice,
          change,
        });

        this.portfolioLatest[ticker] = {
          ...this.portfolio[ticker],
          closePrice,
        };
      }
    }

    return result;
  }

  sendInitialData() {
    const lastUpdated = formatDateDefault(
      getMaxDate(this.trades.map(({ date }) => date)),
    );
    this.eventEmitter.emit(SEND_INITIAL_DATA, {
      lastUpdated,
      portfolio: this.portfolio,
      totalBuyPrice: this.totalCost,
    });
  }

  async sendLatestInfo() {
    const dates = await this.moexApi.getLastAvailableDate();
    if (!dates) {
      return;
    }

    const result = await this.getPortfolioChanges(dates.till);
    this.eventEmitter.emit(SEND_LATEST_INFO, {
      changes: this.calc.getTodayDiff(this.totalCost, this.totalCostLatest),
      date: formatDateDefault(new Date(dates.till)),
      portfolio: result,
      totalPrice: this.totalCostLatest,
    });
  }

  async initPortfolio() {
    if (!this.portfolio) {
      this.portfolio = {} as IPortfolio;
    }

    if (!this.portfolioLatest) {
      this.portfolioLatest = {} as IPortfolio;
    }

    try {
      const { data } = await axios.get<{ trades: TradeWithCommission[] }>(
        `${this.serverUrl}/api/trades`,
      );
      this.trades = data.trades;

      const portfolio = {} as Record<
        string,
        Array<{ price: number; quantity: number; commission: number; }>
        >;

      for (const trade of this.trades) {
        if (!portfolio[trade.secCode]) {
          portfolio[trade.secCode] = [];
        }

        portfolio[trade.secCode].push({
          price: trade.price,
          quantity: trade.quantity,
          commission: (trade.commission!.tsCommission + trade.commission!.bankCommission),
        });
      }

      for (const ticker in portfolio) {
        if (Object.prototype.hasOwnProperty.call(portfolio, ticker)) {
          const tradesByTicker = portfolio[ticker];
          const stats = tradesByTicker.reduce(
            (acc, val) => {
              return {
                cost: acc.cost + ((val.price * val.quantity) + val.commission),
                quantity: acc.quantity + val.quantity,
              };
            },
            {
              cost: 0,
              quantity: 0,
            },
          );
          const decimals = this.getFloatPrecision(ticker);

          this.portfolio[ticker] = {
            ...stats,
            avgBuyPrice: parseFloat((stats.cost / stats.quantity).toFixed(decimals)),
            quantity: stats.quantity,
          };
        }
      }

      return Object.keys(this.portfolio)
        .sort()
        .reduce(
          (obj, key) => {
            obj[key] = this.portfolio[key];
            return obj;
          },
          {} as IPortfolio,
        );
    } catch (error) {
      console.log(error);
    }
  }

  getFloatPrecision(ticker: string) {
    switch (ticker) {
      case 'VTBR':
      case 'FEES':
        return 5;
      case 'HYDR':
        return 4;
      default:
        return 2;
    }
  }

  get totalCost() {
    return this.calc.getInitialPrice(this.trades);
  }

  get totalCostLatest() {
    return this.calc.getTotalPrice(Object.values(this.portfolioLatest));
  }
}

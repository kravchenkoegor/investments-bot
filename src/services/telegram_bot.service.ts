import EventEmitter from 'events';
import TelegramBot from 'node-telegram-bot-api';
import {
  SEND_INITIAL_DATA,
  SEND_LATEST_INFO,
} from '../constants';
import { IPortfolio } from '../interfaces';

export interface ITelegramBot {
  bot: TelegramBot;
  chatId: number;
  eventEmitter: EventEmitter;
}

interface ISendInitialDataPayload {
  lastUpdated: string;
  portfolio: IPortfolio;
  totalBuyPrice: number;
}

interface ISendLatestInfoPayload {
  changes: {
    absolute: number;
    relative: number;
  };
  date: string;
  portfolio: Array<{ ticker: string; closePrice: number; change: number }>;
  totalPrice: number;
}

export class BotService implements ITelegramBot {
  bot;
  chatId;
  eventEmitter;

  constructor(eventEmitter: EventEmitter) {
    const isProd = process.env.NODE_ENV === 'production';
    const options = isProd ? {} : { polling: true };

    this.bot = new TelegramBot(`${process.env.TELEGRAM_API_TOKEN}`, options);
    this.chatId = Number(process.env.MY_TELEGRAM_ID);

    if (isProd) {
      this.bot.setWebHook(`${process.env.HEROKU_URL}/bot`);
    }

    this.eventEmitter = eventEmitter;
  }

  start() {
    this.bot.on('text', ({ chat, text }) => {
      if (chat.id !== this.chatId) {
        return;
      }

      if (text?.startsWith('https://www.instagram.com/')) {
        this.eventEmitter.emit('SEND_IMAGE', text);
        return;
      }

      this.eventEmitter.emit(`${text?.replace(/\//, '')}`);
    });

    this.eventEmitter.on(
      SEND_INITIAL_DATA,
      async (payload: ISendInitialDataPayload) => {
        const { lastUpdated, totalBuyPrice, portfolio } = payload;

        const info = Object.keys(portfolio)
          .map(ticker => {
            const { avgBuyPrice, quantity } = portfolio[ticker];
            const share = (
              ((avgBuyPrice * quantity) / Number(process.env.TOTAL_INVESTMENTS)) * 100
            ).toFixed(2);

            return [
              `<b>${ticker}:</b>`,
              `Ср. цена покупки ${avgBuyPrice} ₽`,
              `Количество ${quantity} шт.`,
              `Доля в портфеле ${share}%`,
            ].join('\n');
          })
          .join('\n\n');

        await this.bot.sendMessage(
          this.chatId,
          [
            `📅 <b>Последнее обновление</b> ${lastUpdated}`,
            `💰 <b>Стоимость покупки</b> ${totalBuyPrice} ₽`,
            info,
          ].join('\n\n'),
          { parse_mode: 'HTML' },
        );
      },
    );

    this.eventEmitter.on(
      SEND_LATEST_INFO,
      async (payload: ISendLatestInfoPayload) => {
        const { changes, date, portfolio, totalPrice } = payload;

        await this.bot.sendMessage(
          this.chatId,
          [
            `📅 Итоги торгов за ${date}`,
            portfolio
              .map(({ ticker, closePrice, change }) => {
                return `<b>${ticker}:</b> ${closePrice} ₽ (${change > 0 ? '+' : ''}${change}%)`;
              })
              .join('\n'),
            [
              `Стоимость портфеля <b>${totalPrice} ₽</b>`,
              `Итого <b>${changes.relative > 0 ? '+' : ''}${changes.absolute} ₽ (${changes.relative > 0 ? '+' : ''}${changes.relative}%)</b>`,
            ].join('\n'),
          ].join('\n\n'),
          { parse_mode: 'HTML' },
        );
      },
    );
  }

  get botInstance() {
    return this.bot;
  }
}

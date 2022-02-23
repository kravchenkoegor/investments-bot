import EventEmitter from 'events';
import { PrismaClient } from '@prisma/client';
import {
  BotService,
  HttpService,
  MoexApiService,
  PortfolioService,
} from './services';
import { PROCESS_UPDATE } from './constants';

// @ts-ignore
import InstaSaver from './test.js';

interface IApp {
  bot: BotService;
  eventEmitter: EventEmitter;
  portfolio: PortfolioService;
  prisma: PrismaClient;
  server: HttpService;
}

export class App implements IApp {
  bot: BotService;
  eventEmitter: EventEmitter;
  moexApi: MoexApiService;
  portfolio: PortfolioService;
  prisma: PrismaClient;
  server: HttpService;

  constructor() {
    this.prisma = new PrismaClient();

    // @ts-ignore
    this.instaSaver = new InstaSaver();
  }

  async bootstrap() {
    this.checkRequiredVariables();

    this.initEventEmitter();
    await this.initServer();
    await this.initPortfolio();
    this.initTelegramBot();
  }

  initEventEmitter() {
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.on(PROCESS_UPDATE, data => {
      this.bot.botInstance.processUpdate(data);
    });
  }

  async initPortfolio() {
    this.portfolio = new PortfolioService({
      eventEmitter: this.eventEmitter,
      serverUrl: this.server.url,
    });
    await this.portfolio.start();
  }

  async initServer() {
    this.server = new HttpService({
      eventEmitter: this.eventEmitter,
      prisma: this.prisma,
    });
    await this.server.start();
  }

  initTelegramBot() {
    this.bot = new BotService(this.eventEmitter);
    this.bot.start();
  }

  checkRequiredVariables() {
    const requiredVariables = [
      'DATABASE_URL',
      'TELEGRAM_API_TOKEN',
      'MY_TELEGRAM_ID',
      'TOTAL_INVESTMENTS',
    ];

    for (const variable of requiredVariables) {
      if (typeof process.env[variable] === 'undefined') {
        throw new Error(`Required variable ${variable} is missing!`);
      }
    }
  }

  async savePhotoFromInsta(url: string) {
    // @ts-ignore
    const imageUrl = this.instaSaver.download(url);
    console.log({ imageUrl });

    this.bot.botInstance.sendPhoto(
      process.env.MY_TELEGRAM_ID as string,
      imageUrl,
    );
  }
}

import EventEmitter from 'events';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PROCESS_UPDATE } from '../../constants';
import { apiRoutes } from './router';

interface IServer {
  eventEmitter: EventEmitter;
  prisma: PrismaClient;
}

export class HttpService implements IServer {
  eventEmitter;
  prisma;
  private port: number;

  constructor(
    { eventEmitter, prisma }:
    {
      eventEmitter: EventEmitter;
      prisma: PrismaClient;
    },
  ) {
    this.eventEmitter = eventEmitter;
    this.prisma = prisma;
    this.port = Number(process.env.PORT) || 5000;
  }

  async start(): Promise<void> {
    return new Promise(resolve => {
      const app = express();
      app.use(express.json());
      app.use('/api', apiRoutes(this.prisma));

      if (process.env.NODE_ENV === 'production') {
        app.post('/bot', (req, res) => {
          this.eventEmitter.emit(PROCESS_UPDATE, req.body);
          res.sendStatus(200);
        });
      }

      app.listen(this.port, () => {
        console.log(`Server is listening on ${this.port}`);
        resolve();
      });
    });
  }

  get url() {
    return process.env.NODE_ENV === 'production'
      ? `${process.env.HEROKU_URL}`
      : `http://localhost:${this.port}`;
  }
}

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  batchValidateTrades,
  validateTrade,
} from '../../validators';

const router = Router();

export const apiRoutes = (prisma: PrismaClient) => {
  const myUserId = Number(process.env.MY_TELEGRAM_ID);

  router.get('/trades', async (_, res) => {
    try {
      const trades = await prisma.trade.findMany({
        where: { userId: myUserId },
        select: {
          secCode: true,
          price: true,
          quantity: true,
          currencyCode: true,
          date: true,
          commission: {
            select: {
              tsCommission: true,
              bankCommission: true,
            },
          },
        },
      });

      res.json({ trades });
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  });

  // TODO parse trades from xls report file and save them to DB
  router.post('/trade', async (req, res) => {
    const { userId, trade } = req.body;

    if (userId !== myUserId) {
      res.sendStatus(403);
      return;
    }

    if (!validateTrade(trade)) {
      res.sendStatus(400);
      return;
    }

    try {
      const createdTrade = await prisma.trade.create({
        data: {
          ...trade,
          user: {
            connect: {
              userId: myUserId,
            },
          },
        },
      });
      res.status(201).json(createdTrade);
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  });

  router.post('/trades', async (req, res) => {
    try {
      const { trades } = req.body;
      if (!batchValidateTrades(trades)) {
        res.sendStatus(400);
        return;
      }

      await prisma.$transaction(
        trades
          .map((trade: any) => {
            const quantity = parseInt(trade.quantity, 10);
            const data = {
              currencyCode: trade.currencyCode,
              date: new Date(trade.date1).toISOString(),
              secCode: trade.secCode,
              price: parseFloat(trade.price1),
              quantity: trade.side === 2 ? quantity * -1 : quantity,
              commission: {
                create: {
                  tsCommission: parseFloat(trade.tsCommission.value),
                  bankCommission: parseFloat(trade.bankCommission.value),
                },
              },
              user: {
                connect: { userId: Number(process.env.MY_TELEGRAM_ID) },
              },
            };

            return prisma.trade.create({ data });
          }),
      );

      res.sendStatus(200);
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  });

  router.post('/user', async (req, res) => {
    const { userId } = req.body;
    if (!userId || typeof userId !== 'number') {
      res.sendStatus(400);
    }

    try {
      let user = await prisma.user.findUnique({
        where: { userId },
      });

      if (!user) {
        user = await prisma.user.create({
          data: { userId },
        });
      }

      res.json({ user });
    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
  });

  return router;
};

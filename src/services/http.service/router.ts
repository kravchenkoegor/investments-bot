import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

export const apiRoutes = (prisma: PrismaClient) => {
  router.get('/trades', async (_, res) => {
    const userId = Number(process.env.MY_TELEGRAM_ID);

    if (!userId) {
      res.json({ trades: [] });
      return;
    }

    try {
      const trades = await prisma.trade.findMany({
        where: { userId },
        select: {
          secCode: true,
          price: true,
          quantity: true,
          currencyCode: true,
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
  router.post('/trades', async (req, res) => {
    // const { userId } = req.body;

    // await this.prisma.$transaction(
    //   trades
    //     .map(trade => {
    //       const quantity = parseInt(trade.quantity, 10);
    //       const data = {
    //         currencyCode: trade.currencyCode,
    //         date: new Date(trade.date1).toISOString(),
    //         secCode: trade.secCode,
    //         price: parseFloat(trade.price1),
    //         quantity: trade.side === 2 ? quantity * -1 : quantity,
    //         commission: {
    //           create: {
    //             tsCommission: parseFloat(trade.tsCommission.value),
    //             bankCommission: parseFloat(trade.bankCommission.value),
    //           },
    //         },
    //         user: {
    //           connect: { userId: Number(process.env.MY_TELEGRAM_ID) },
    //         },
    //       };

    //       return this.prisma.trade.create({ data });
    //     }),
    // );

    res.sendStatus(403);
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

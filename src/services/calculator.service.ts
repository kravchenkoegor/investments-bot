import { IAsset } from '../interfaces';

export class CalculatorService {
  getChange(buyPrice: number, closePrice: number): number {
    const change = ((1 - (buyPrice / closePrice)) * 100).toFixed(2);
    return parseFloat(change);
  }

  getTotalPrice(items: IAsset[]): number {
    const totalPrice = items.reduce(
      (acc: number, val) => {
        const {
          avgBuyPrice,
          closePrice,
          quantity,
        } = val;

        if (!closePrice) {
          return (avgBuyPrice * quantity) + acc;
        }

        return (closePrice * quantity) + acc;
      },
      0,
    ).toFixed(2);

    return parseFloat(totalPrice);
  }

  getTodayDiff(totalBuyPrice: number, newTotalPrice: number) {
    return {
      absolute: (newTotalPrice - totalBuyPrice).toFixed(2),
      relative: ((1 - (totalBuyPrice / newTotalPrice)) * 100).toFixed(2),
    };
  }
}

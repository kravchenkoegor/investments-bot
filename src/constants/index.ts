import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export * from './events';

export const ENGINE = 'stock';
export const MARKET = 'shares';
export const BOARD = 'TQBR';

export const DATE_FORMAT_DEFAULT = 'd MMMM yyyy';
export const formatDateDefault = (date: Date) => {
  return format(date, DATE_FORMAT_DEFAULT, { locale: ru });
};

export const getUrl = (ticket: string) => {
  return `/history/engines/${ENGINE}/markets/${MARKET}/boards/${BOARD}/securities/${ticket}.json`;
};

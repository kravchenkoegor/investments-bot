import dotenv from 'dotenv';
import { App } from './app';

dotenv.config();

/* eslint-disable-next-line */
const app = new App();
app.bootstrap();

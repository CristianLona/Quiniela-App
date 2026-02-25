import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { onRequest } from 'firebase-functions/v2/https';

const server = express();

const createNestServer = async (expressInstance) => {
    const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressInstance),
    );

    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    });

    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.setGlobalPrefix('api');

    return app.init();
};
let appReady = false;
const initPromise = createNestServer(server).then(() => {
    appReady = true;
}).catch(err => {
    console.error('Nest Broken', err);
});

export const api = onRequest({ maxInstances: 10 }, async (req, res) => {
    if (!appReady) {
        await initPromise;
    }
    server(req, res);
});

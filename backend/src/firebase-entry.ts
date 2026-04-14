import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { onRequest } from 'firebase-functions/v2/https';

const server = express();

const ALLOWED_ORIGINS = [
    'https://quinielaapp-d8fed.firebaseapp.com',
    'https://quinielaapp-d8fed.web.app',
];

const createNestServer = async (expressInstance) => {
    const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressInstance),
    );

    app.enableCors({
        origin: (origin, callback) => {
            // Permitir requests sin origin (ej. mobile apps, curl) o de orígenes permitidos
            if (!origin || ALLOWED_ORIGINS.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Bloqueado por CORS'));
            }
        },
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
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


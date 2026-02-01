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

    // Replicate configuration from main.ts
    // Enable CORS for frontend
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    });

    // Global Validation
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

    // Global Prefix
    app.setGlobalPrefix('api');

    // Force Deploy: v2
    console.log('Initializing NestJS with Global Prefix: api');

    return app.init();
};

createNestServer(server)
    .then(v => console.log('Nest Ready'))
    .catch(err => console.error('Nest Broken', err));

export const api = onRequest({ maxInstances: 10 }, server);

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

const ALLOWED_ORIGINS = [
    'https://quinielaapp-d8fed.firebaseapp.com',
    'https://quinielaapp-d8fed.web.app',
    'http://localhost:5173', 
    'http://localhost:4173', 
];

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: (origin, callback) => {
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

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();


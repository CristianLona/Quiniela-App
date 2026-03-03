import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                global: true,
                secret: configService.get<string>('JWT_SECRET') || 'fallback-secret-gaston-1234',
                signOptions: { expiresIn: '7d' }, // 1 semana de login
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }

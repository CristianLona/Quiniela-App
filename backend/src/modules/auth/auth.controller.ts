import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    @UseGuards(ThrottlerGuard)
    @Throttle({ login: { ttl: 300000, limit: 5 } }) // 5 intentos cada 5 minutos
    login(@Body() body: Record<string, any>) {
        return this.authService.login(body.password);
    }
}


import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService
    ) { }

    async login(password: string) {
        // En producción sería ideal tener la contra en un env solo de backend,
        // pero usaremos el mismo VITE_ADMIN_PASSWORD o ADMIN_PASSWORD
        const validPassword = this.configService.get<string>('VITE_ADMIN_PASSWORD') || 'nzxtfirebase';

        if (password !== validPassword) {
            throw new UnauthorizedException('Contraseña incorrecta');
        }

        const payload = { role: 'admin' };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }
}

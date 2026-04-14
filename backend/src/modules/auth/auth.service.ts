import { Injectable, UnauthorizedException, Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService implements OnModuleInit {
    private readonly logger = new Logger(AuthService.name);
    private adminPasswordHash: string | null = null;
    private adminPasswordPlain: string | null = null;

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async onModuleInit() {
        // Prioridad: ADMIN_PASSWORD_HASH (bcrypt) > ADMIN_PASSWORD (plain, para migración)
        this.adminPasswordHash = this.configService.get<string>('ADMIN_PASSWORD_HASH');
        this.adminPasswordPlain = this.configService.get<string>('ADMIN_PASSWORD');

        if (!this.adminPasswordHash && !this.adminPasswordPlain) {
            this.logger.error('Ni ADMIN_PASSWORD_HASH ni ADMIN_PASSWORD están configurados. El login de admin no funcionará.');
        }

        // Si solo hay password plano, generar y logear el hash para que el dev lo configure
        if (!this.adminPasswordHash && this.adminPasswordPlain) {
            const hash = await bcrypt.hash(this.adminPasswordPlain, 12);
            this.logger.warn(
                `Usando ADMIN_PASSWORD en texto plano. Para mayor seguridad, configura ADMIN_PASSWORD_HASH con:\n` +
                `ADMIN_PASSWORD_HASH=${hash}`
            );
        }
    }

    async login(password: string) {
        if (!password) {
            throw new UnauthorizedException('Contraseña requerida');
        }

        let isValid = false;

        if (this.adminPasswordHash) {
            // Comparación segura con bcrypt
            isValid = await bcrypt.compare(password, this.adminPasswordHash);
        } else if (this.adminPasswordPlain) {
            // Fallback temporal para migración (texto plano)
            isValid = password === this.adminPasswordPlain;
        } else {
            throw new UnauthorizedException('Configuración de seguridad incompleta en el servidor');
        }

        if (!isValid) {
            throw new UnauthorizedException('Contraseña incorrecta');
        }

        const payload = { role: 'admin' };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }
}

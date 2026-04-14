import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    private readonly logger = new Logger(JwtAuthGuard.name);
    private readonly jwtSecret: string;

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {
        this.jwtSecret = this.configService.get<string>('JWT_SECRET');
        if (!this.jwtSecret) {
            this.logger.error('JWT_SECRET no está configurado. El guard JWT no funcionará.');
        }
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (!this.jwtSecret) {
            throw new UnauthorizedException('Configuración de seguridad incompleta en el servidor');
        }

        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException('Token de acceso no proporcionado');
        }
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.jwtSecret,
            });
            request['user'] = payload;
        } catch {
            throw new UnauthorizedException('Token inválido o expirado');
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}

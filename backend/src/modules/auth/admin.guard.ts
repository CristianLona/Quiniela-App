import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Token de acceso obligatorio');
        }

        try {
            // Verifica y decodifica el token
            const decodedToken = await admin.auth().verifyIdToken(token);

            const adminEmailStr = process.env.ADMIN_EMAIL || '';
            const allowedEmails = adminEmailStr.split(',').map(e => e.trim().toLowerCase());

            if (!decodedToken.email || !allowedEmails.includes(decodedToken.email.toLowerCase())) {
                throw new UnauthorizedException('Acceso denegado: Necesitas privilegios de Administrador');
            }

            request['user'] = decodedToken;
            return true;
        } catch (error) {
            throw new UnauthorizedException('Token inválido o insuficiente nivel de acceso');
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Request } from 'express';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Token de acceso no proporcionado');
        }

        try {
            // Intentar verificar como token de Firebase
            const decodedToken = await admin.auth().verifyIdToken(token);
            request['user'] = decodedToken;
            return true;
        } catch (error) {
            // Fallback opcional para tokens normales de JWT si existiera lógica legacy
            // Si el token no es de Firebase, tiramos Unauthorized.
            throw new UnauthorizedException('Token inválido o expirado');
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}

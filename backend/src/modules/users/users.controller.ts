import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { Request } from 'express';

@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post('fcm-token')
    async saveFcmToken(@Req() req: Request, @Body('token') token: string) {
        const userId = (req as any).user?.uid;
        if (!userId || !token) {
            return { success: false, message: 'Invalid payload' };
        }
        await this.usersService.saveFcmToken(userId, token);
        return { success: true };
    }
}

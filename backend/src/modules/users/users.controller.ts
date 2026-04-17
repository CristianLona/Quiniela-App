import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { Request } from 'express';

@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('me')
    async getMe(@Req() req: Request) {
        const userId = (req as any).user?.uid;
        if (!userId) return { success: false };
        const user = await this.usersService.getUser(userId);
        return { success: true, user };
    }

    @Post('fcm-token')
    async saveFcmToken(@Req() req: Request, @Body('token') token: string) {
        const userId = (req as any).user?.uid;
        if (!userId || !token) {
            return { success: false, message: 'Invalid payload' };
        }
        await this.usersService.saveFcmToken(userId, token);
        return { success: true };
    }

    @Post('phone')
    async savePhoneNumber(@Req() req: Request, @Body('phoneNumber') phoneNumber: string) {
        const userId = (req as any).user?.uid;
        if (!userId || !phoneNumber) {
            return { success: false, message: 'Invalid payload' };
        }
        await this.usersService.savePhoneNumber(userId, phoneNumber);
        return { success: true };
    }

    @Post('accept-rules')
    async acceptRules(@Req() req: Request) {
        const userId = (req as any).user?.uid;
        if (!userId) {
            return { success: false, message: 'Unauthorized' };
        }
        await this.usersService.acceptRules(userId);
        return { success: true };
    }
}

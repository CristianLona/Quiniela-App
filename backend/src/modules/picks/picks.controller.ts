import { Body, Controller, Get, Param, Patch, Post, Delete, UseGuards } from '@nestjs/common';
import { PicksService } from './picks.service';
import { AdminGuard } from '../auth/admin.guard';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { User } from '../auth/user.decorator';

@Controller('picks')
export class PicksController {
    constructor(private readonly picksService: PicksService) { }

    @Post()
    @UseGuards(FirebaseAuthGuard)
    submit(@Body() body: any, @User() user: any) {
        return this.picksService.submitPick({ ...body, userEmail: user?.email });
    }

    @Post('admin')
    @UseGuards(AdminGuard)
    adminSubmit(@Body() body: any) {
        return this.picksService.submitPick(body, true);
    }

    @Get('week/:weekId')
    async getByWeek(@Param('weekId') weekId: string) {
        const picks = await this.picksService.findAllByWeek(weekId);
        // Eliminar emails y campo normalizado de la respuesta — datos sensibles/internos
        return picks.map(({ userEmail, participantNameNormalized, ...rest }) => rest);
    }

    @Patch(':id/payment')
    @UseGuards(AdminGuard)
    togglePayment(@Param('id') id: string) {
        return this.picksService.togglePayment(id);
    }

    @Patch(':id')
    @UseGuards(AdminGuard)
    updatePick(@Param('id') id: string, @Body() body: any) {
        return this.picksService.updatePick(id, body);
    }

    @Delete(':id')
    @UseGuards(AdminGuard)
    deletePick(@Param('id') id: string) {
        return this.picksService.deletePick(id);
    }
}


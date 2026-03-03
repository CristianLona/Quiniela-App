import { Body, Controller, Get, Param, Patch, Post, Delete, UseGuards } from '@nestjs/common';
import { PicksService } from './picks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('picks')
export class PicksController {
    constructor(private readonly picksService: PicksService) { }

    @Post()
    submit(@Body() body: any) {
        return this.picksService.submitPick(body);
    }

    @Post('admin')
    @UseGuards(JwtAuthGuard)
    adminSubmit(@Body() body: any) {
        return this.picksService.submitPick(body, true);
    }

    @Get('week/:weekId')
    getByWeek(@Param('weekId') weekId: string) {
        return this.picksService.findAllByWeek(weekId);
    }

    @Patch(':id/payment')
    @UseGuards(JwtAuthGuard)
    togglePayment(@Param('id') id: string) {
        return this.picksService.togglePayment(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    updatePick(@Param('id') id: string, @Body() body: any) {
        return this.picksService.updatePick(id, body);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    deletePick(@Param('id') id: string) {
        return this.picksService.deletePick(id);
    }
}

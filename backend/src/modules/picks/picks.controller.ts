import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PicksService } from './picks.service';

@Controller('picks')
export class PicksController {
    constructor(private readonly picksService: PicksService) { }

    @Post()
    submit(@Body() body: any) {
        return this.picksService.submitPick(body);
    }

    @Post('admin')
    adminSubmit(@Body() body: any) {
        return this.picksService.submitPick(body, true);
    }

    @Get('week/:weekId')
    getByWeek(@Param('weekId') weekId: string) {
        return this.picksService.findAllByWeek(weekId);
    }

    @Patch(':id/payment')
    togglePayment(@Param('id') id: string) {
        return this.picksService.togglePayment(id);
    }
}

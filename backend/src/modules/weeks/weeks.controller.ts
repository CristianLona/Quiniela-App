import { Body, Controller, Get, Param, Post, Patch } from '@nestjs/common';
import { WeeksService } from './weeks.service';
import { WeekDraft } from '../../common/types';

@Controller('weeks')
export class WeeksController {
    constructor(private readonly weeksService: WeeksService) { }

    @Post('parse')
    parseText(@Body('text') text: string): WeekDraft {
        return this.weeksService.parseWeekText(text);
    }

    @Post()
    create(@Body() body: { name: string; matches: any[]; price?: number; adminFee?: number }) {
        return this.weeksService.createWeek(body.name, body.matches, body.price, body.adminFee);
    }

    @Get()
    findAll() {
        return this.weeksService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.weeksService.findOne(id);
    }

    @Patch(':id/matches/:matchId')
    updateMatch(
        @Param('id') weekId: string,
        @Param('matchId') matchId: string,
        @Body() body: { homeScore: number; awayScore: number }
    ) {
        return this.weeksService.updateMatch(weekId, matchId, body.homeScore, body.awayScore);
    }

    @Patch(':id/visibility')
    toggleVisibility(
        @Param('id') id: string,
        @Body() body: { hide: boolean }
    ) {
        return this.weeksService.toggleVisibility(id, body.hide);
    }
}

import { Body, Controller, Get, Param, Post, Patch, Header, Delete, UseGuards } from '@nestjs/common';
import { WeeksService } from './weeks.service';
import { WeekDraft } from '../../common/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('weeks')
export class WeeksController {
    constructor(private readonly weeksService: WeeksService) { }

    @Post('parse')
    @UseGuards(JwtAuthGuard)
    parseText(@Body('text') text: string): WeekDraft {
        return this.weeksService.parseWeekText(text);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() body: { name: string; matches: any[]; price?: number; adminFee?: number; league?: string }) {
        return this.weeksService.createWeek(body.name, body.matches, body.price, body.adminFee, body.league);
    }

    @Get()
    @Header('Cache-Control', 'public, max-age=300, s-maxage=300')
    findAll() {
        return this.weeksService.findAll();
    }

    @Get(':id')
    @Header('Cache-Control', 'public, max-age=300, s-maxage=300')
    findOne(@Param('id') id: string) {
        return this.weeksService.findOne(id);
    }

    @Patch(':id/matches/:matchId')
    @UseGuards(JwtAuthGuard)
    updateMatch(
        @Param('id') weekId: string,
        @Param('matchId') matchId: string,
        @Body() body: { homeScore: number; awayScore: number; status?: string }
    ) {
        return this.weeksService.updateMatch(weekId, matchId, body.homeScore, body.awayScore, body.status);
    }

    @Patch(':id/visibility')
    @UseGuards(JwtAuthGuard)
    toggleVisibility(
        @Param('id') id: string,
        @Body() body: { hide: boolean }
    ) {
        return this.weeksService.toggleVisibility(id, body.hide);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(
        @Param('id') id: string,
        @Body() body: { adminFee?: number; price?: number }
    ) {
        return this.weeksService.updateWeek(id, body);
    }
    @Patch(':id/matches')
    @UseGuards(JwtAuthGuard)
    updateMatches(
        @Param('id') weekId: string,
        @Body() body: { matches: { matchId: string; homeScore: number; awayScore: number; status?: string }[] }
    ) {
        return this.weeksService.updateMatches(weekId, body.matches);
    }
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    delete(@Param('id') id: string) {
        return this.weeksService.deleteWeek(id);
    }
}

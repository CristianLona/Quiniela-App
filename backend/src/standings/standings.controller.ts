import { Controller, Get, Query } from '@nestjs/common';
import { StandingsService, ScrapedStanding } from './standings.service';

@Controller('standings')
export class StandingsController {
    constructor(private readonly standingsService: StandingsService) { }

    @Get()
    async getStandings(@Query('league') leagueSlug?: string): Promise<{ league: { name: string; logo: string; standings: ScrapedStanding[][] } }> {
        const result = await this.standingsService.getStandingsFromESPN(leagueSlug);
        return {
            league: result
        };
    }
}   

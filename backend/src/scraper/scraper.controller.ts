import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ScraperService, ScrapedMatch } from './scraper.service';
import { AdminGuard } from '../modules/auth/admin.guard';

@Controller('scraper')
@UseGuards(AdminGuard)
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) { }

    @Get('matches')
    async getMatches(@Query('league') league: string = 'liga-mx'): Promise<ScrapedMatch[]> {
        return this.scraperService.scrapeMatches(league);
    }

    @Get('results')
    async getResults(@Query('league') league: string = 'liga-mx'): Promise<any[]> {
        return this.scraperService.scrapeMatches(league);
    }
}

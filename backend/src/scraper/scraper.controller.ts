import { Controller, Get, Query } from '@nestjs/common';
import { ScraperService, ScrapedMatch } from './scraper.service';

@Controller('scraper')
export class ScraperController {
    constructor(private readonly scraperService: ScraperService) { }

    @Get('matches')
    async getMatches(@Query('league') league: string = 'liga-mx'): Promise<ScrapedMatch[]> {
        return this.scraperService.scrapeMatches(league);
    }
}

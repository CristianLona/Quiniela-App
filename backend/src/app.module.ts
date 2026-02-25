import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './common/firebase/firebase.module';
import { WeeksModule } from './modules/weeks/weeks.module';
import { PicksModule } from './modules/picks/picks.module';
import { StandingsModule } from './standings/standings.module';
import { ScraperModule } from './scraper/scraper.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        FirebaseModule,
        WeeksModule,
        PicksModule,
        StandingsModule,
        ScraperModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }

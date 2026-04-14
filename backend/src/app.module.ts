import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { FirebaseModule } from './common/firebase/firebase.module';
import { WeeksModule } from './modules/weeks/weeks.module';
import { PicksModule } from './modules/picks/picks.module';
import { StandingsModule } from './standings/standings.module';
import { ScraperModule } from './scraper/scraper.module';
import { EventsModule } from './events/events.module';
import { UsersModule } from './modules/users/users.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['../frontend/.env', '.env'],
        }),
        ThrottlerModule.forRoot([{
            name: 'default',
            ttl: 60000,  
            limit: 60,   
        }, {
            name: 'login',
            ttl: 300000, 
            limit: 5,    
        }]),
        AuthModule,
        FirebaseModule,
        WeeksModule,
        PicksModule,
        StandingsModule,
        ScraperModule,
        EventsModule,
        UsersModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }


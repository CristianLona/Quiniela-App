import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './common/firebase/firebase.module';
import { WeeksModule } from './modules/weeks/weeks.module';
import { PicksModule } from './modules/picks/picks.module';
// import { AdminModule } from './modules/admin/admin.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        FirebaseModule,
        WeeksModule,
        PicksModule,
        // AdminModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }

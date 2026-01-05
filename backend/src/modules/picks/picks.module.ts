import { Module } from '@nestjs/common';
import { PicksController } from './picks.controller';
import { PicksService } from './picks.service';
import { WeeksModule } from '../weeks/weeks.module';
import { WeeksService } from '../weeks/weeks.service';

@Module({
    imports: [WeeksModule],
    controllers: [PicksController],
    providers: [PicksService],
})
export class PicksModule { }

import { Module } from '@nestjs/common';
import { WeeksController } from './weeks.controller';
import { WeeksService } from './weeks.service';
import { EventsModule } from '../../events/events.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [EventsModule, UsersModule],
    controllers: [WeeksController],
    providers: [WeeksService],
    exports: [WeeksService],
})
export class WeeksModule { }

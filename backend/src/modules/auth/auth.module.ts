import { Module, Global } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { FirebaseAuthGuard } from './firebase-auth.guard';

@Global()
@Module({
    providers: [AdminGuard, FirebaseAuthGuard],
    exports: [AdminGuard, FirebaseAuthGuard],
})
export class AuthModule { }

import { Module } from '@nestjs/common';
import { StoresModule } from './stores/stores.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}.local`, '.env'],
    }),
    StoresModule,
  ],
})
export class AppModule {}

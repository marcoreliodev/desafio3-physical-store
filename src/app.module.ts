import { Module } from '@nestjs/common';
import { StoresModule } from './stores/stores.module';

@Module({
  imports: [StoresModule],
})
export class AppModule {}

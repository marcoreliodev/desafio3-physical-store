import { Module } from '@nestjs/common';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { ViaCepService } from 'src/services/via-cep.service';
import { GoogleMapsService } from 'src/services/google-maps.service';
import { MelhorEnvioService } from 'src/services/melhor-envio.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Store, StoreSchema } from './schemas/store.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Store.name, schema: StoreSchema }]),
    HttpModule,
  ],
  controllers: [StoresController],
  providers: [
    StoresService,
    ViaCepService,
    GoogleMapsService,
    MelhorEnvioService,
  ],
})
export class StoresModule {}

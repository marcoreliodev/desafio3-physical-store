import { Injectable, NotFoundException } from '@nestjs/common';
import { GoogleMapsService } from 'src/services/google-maps.service';
import { ViaCepService } from 'src/services/via-cep.service';

@Injectable()
export class StoresService {
  constructor(
    private readonly viaCepService: ViaCepService,
    private readonly googleMapsService: GoogleMapsService,
  ) {}

  async listNearbyStoresByCep(cep: string) {
    const userLocation = await this.viaCepService.getLocationByCep(cep);

    if (!userLocation) {
      throw new NotFoundException(
        `Não foi possível encontrar a localização para o CEP: ${cep}`,
      );
    }

    const userCoordinates =
      await this.googleMapsService.geocodeCep(userLocation);

    if (!userCoordinates) {
      throw new NotFoundException(
        'Não foi possível recuperar as coordenadas para a localização informada.',
      );
    }
  }
}

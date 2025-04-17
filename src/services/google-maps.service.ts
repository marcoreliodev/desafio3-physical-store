import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  Coordinates,
  DistanceMatrixData,
  GeocodeData,
  TravelDistanceAndDuration,
  ViaCepData,
} from '../types';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class GoogleMapsService {
  constructor(
    private readonly httpService: HttpService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  async geocodeCep(location: ViaCepData): Promise<Coordinates> {
    const { cep, localidade, uf } = location;

    try {
      const address = `${cep}, ${localidade}, ${uf}`;

      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address,
      )}&key=${process.env.GOOGLE_API_KEY}`;
      const response = await firstValueFrom(
        this.httpService.get<GeocodeData>(url),
      );

      const geo = response.data.results[0]?.geometry.location;

      if (!geo) {
        throw new NotFoundException(
          'Localização não encontrada no Google Maps.',
        );
      }

      return { lat: geo.lat, lng: geo.lng };
    } catch (error) {
      this.logger.error('Erro no geocodeCep:', error?.response?.data || error);
      throw new InternalServerErrorException(
        'Erro ao consultar o Google Maps.',
      );
    }
  }

  async getDistanceMatrix(
    origin: Coordinates,
    destinations: Coordinates[],
  ): Promise<TravelDistanceAndDuration[]> {
    try {
      const destinationsString = destinations
        .map((d) => `${d.lat},${d.lng}`)
        .join('|');

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destinationsString}&key=${process.env.GOOGLE_API_KEY}`;
      const response = await firstValueFrom(
        this.httpService.get<DistanceMatrixData>(url),
      );

      const distanceMatrix = response.data.rows?.[0]?.elements;

      if (!distanceMatrix || !distanceMatrix.length) {
        throw new NotFoundException('Nenhuma distância encontrada.');
      }

      return distanceMatrix;
    } catch (error) {
      this.logger.error(
        'Erro no getDistanceMatrix:',
        error?.response?.data || error,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro ao consultar o Google Maps.',
      );
    }
  }
}

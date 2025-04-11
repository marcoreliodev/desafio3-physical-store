import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Coordinates, GeocodeData, ViaCepData } from '../types';

@Injectable()
export class GoogleMapsService {
  constructor(private readonly httpService: HttpService) {}

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
      console.error('Erro no geocodeCep:', error?.response?.data || error);
      throw new InternalServerErrorException(
        'Erro ao consultar o Google Maps.',
      );
    }
  }
}

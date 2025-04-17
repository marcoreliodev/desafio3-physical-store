import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ShippingChoice } from 'src/types';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class MelhorEnvioService {
  private readonly apiUrl =
    'https://melhorenvio.com.br/api/v2/me/shipment/calculate';
  private readonly token = process.env.MELHORENVIO_API_KEY;

  constructor(
    private readonly httpService: HttpService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  async calculateShipping(
    fromCep: string,
    toCep: string,
  ): Promise<ShippingChoice[]> {
    const payload = {
      from: { postal_code: fromCep },
      to: { postal_code: toCep },
      products: [
        {
          id: '1',
          width: 15,
          height: 10,
          length: 20,
          weight: 1,
          insurance_value: 0,
          quantity: 1,
        },
      ],
      options: {
        receipt: false,
        own_hand: false,
        collect: false,
        non_commercial: true,
        reverse: false,
        insurance_value: 0,
      },
      services: '1,2',
      validate: true,
    };

    const headers = {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<ShippingChoice[]>(this.apiUrl, payload, {
          headers,
        }),
      );

      if (!response.data || response.data.length === 0) {
        throw new NotFoundException(
          'Nenhuma opção de frete encontrada para o cálculo.',
        );
      }

      const shippingChoices: ShippingChoice[] = response.data.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        currency: item.currency,
        company: { name: item.company.name },
        delivery_time: item.delivery_time,
      }));

      return shippingChoices;
    } catch (error) {
      this.logger.error(
        'Erro ao consultar a API do Melhor Envio.',
        error?.response?.data || error,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro ao consultar a Melhor Envio.',
      );
    }
  }
}

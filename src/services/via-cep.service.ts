import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ViaCepData } from '../types';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class ViaCepService {
  constructor(
    private readonly httpService: HttpService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  async getLocationByCep(cep: string): Promise<ViaCepData> {
    const sanitizedCep = cep.replace(/\D/g, '');

    try {
      const response = await firstValueFrom(
        this.httpService.get<ViaCepData>(
          `https://viacep.com.br/ws/${sanitizedCep}/json/`,
        ),
      );

      if (response.data.erro) {
        throw new NotFoundException(`CEP ${cep} não encontrado.`);
      }

      return response.data;
    } catch (error) {
      this.logger.error(
        'Erro ao consultar o ViaCEP.',
        error?.response?.data || error,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro ao consultar o ViaCEP.');
    }
  }
}

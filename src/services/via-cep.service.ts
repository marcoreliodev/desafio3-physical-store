import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ViaCepData } from '../types';

@Injectable()
export class ViaCepService {
  constructor(private readonly httpService: HttpService) {}

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
      console.error(error);
      throw new InternalServerErrorException('Erro ao consultar o ViaCEP.');
    }
  }
}

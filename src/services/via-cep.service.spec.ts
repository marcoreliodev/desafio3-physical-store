import { Test, TestingModule } from '@nestjs/testing';
import { ViaCepService } from './via-cep.service';
import { HttpService } from '@nestjs/axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import {
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { ViaCepData } from 'src/types';

describe('ViaCepService', () => {
  let service: ViaCepService;
  let httpService: HttpService;
  let logger: Logger;

  const fakeCep = '12345678';
  const mockViaCepData: ViaCepData = {
    cep: '70150-900',
    logradouro: 'Praça dos Três Poderes',
    complemento: '',
    unidade: '',
    bairro: 'Zona Cívico-Administrativa',
    localidade: 'Brasília',
    uf: 'DF',
    estado: 'Distrito Federal',
    regiao: 'Centro-Oeste',
    ibge: '5300108',
    gia: '',
    ddd: '61',
    siafi: '9701',
    erro: '',
  };

  const mockLogger = {
    error: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViaCepService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ViaCepService>(ViaCepService);
    httpService = module.get<HttpService>(HttpService);
    logger = module.get(WINSTON_MODULE_PROVIDER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should return location data when the CEP is valid', async () => {
    const fakeResponse = {
      data: mockViaCepData,
    };
    mockHttpService.get.mockReturnValue(of(fakeResponse));

    const result = await service.getLocationByCep(fakeCep);

    expect(result).toEqual(mockViaCepData);
    expect(mockHttpService.get).toHaveBeenCalledWith(
      `https://viacep.com.br/ws/${fakeCep}/json/`,
    );
    expect(mockHttpService.get).toHaveBeenCalledTimes(1);
  });

  it('Should throw NotFoundException if CEP is not found', async () => {
    const fakeResponse = {
      data: {
        erro: 'true',
      },
    };

    mockHttpService.get.mockReturnValue(of(fakeResponse));

    await expect(service.getLocationByCep(fakeCep)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockHttpService.get).toHaveBeenCalledTimes(1);
  });

  it('Should throw InternalServerErrorException on unexpected error', async () => {
    const error = new Error('Timeout');

    mockHttpService.get.mockReturnValue(throwError(() => error));

    await expect(service.getLocationByCep(fakeCep)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(mockHttpService.get).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Erro ao consultar o ViaCEP.',
      error,
    );
  });
});

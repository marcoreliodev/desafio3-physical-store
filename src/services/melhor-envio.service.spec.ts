import { Test, TestingModule } from '@nestjs/testing';
import { MelhorEnvioService } from './melhor-envio.service';
import { HttpService } from '@nestjs/axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { of, throwError } from 'rxjs';
import {
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';

describe('MelhorEnvioService', () => {
  let service: MelhorEnvioService;
  let httpService: HttpService;
  let logger: Logger;

  const mockFromCep = '12345-678';
  const mockToCep = '87654-321';

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MelhorEnvioService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<MelhorEnvioService>(MelhorEnvioService);
    httpService = module.get<HttpService>(HttpService);
    logger = module.get(WINSTON_MODULE_PROVIDER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return a list of shipping choices when response is valid', async () => {
    const payload = {
      from: { postal_code: mockFromCep },
      to: { postal_code: mockToCep },
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
      Authorization: 'Bearer undefined',
      'Content-Type': 'application/json',
    };

    const fakeResponse = {
      data: [
        {
          id: '123',
          name: 'Sedex',
          price: '25.50',
          currency: 'R$',
          company: { name: 'Correios' },
          delivery_time: 3,
        },
        {
          id: '321',
          name: 'PAC',
          price: '25.50',
          currency: 'R$',
          company: { name: 'Correios' },
          delivery_time: 3,
        },
      ],
    };

    mockHttpService.post.mockReturnValue(of(fakeResponse));

    const result = await service.calculateShipping(mockFromCep, mockToCep);

    expect(result).toEqual([
      {
        id: '123',
        name: 'Sedex',
        price: '25.50',
        currency: 'R$',
        company: { name: 'Correios' },
        delivery_time: 3,
      },
      {
        id: '321',
        name: 'PAC',
        price: '25.50',
        currency: 'R$',
        company: { name: 'Correios' },
        delivery_time: 3,
      },
    ]);
    expect(mockHttpService.post).toHaveBeenCalledWith(
      'https://melhorenvio.com.br/api/v2/me/shipment/calculate',
      payload,
      { headers },
    );
    expect(mockHttpService.post).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException if no shipping options are found', async () => {
    const emptyResponse = {
      data: [],
    };

    mockHttpService.post.mockReturnValue(of(emptyResponse));

    await expect(
      service.calculateShipping(mockFromCep, mockToCep),
    ).rejects.toThrow(NotFoundException);
    expect(mockHttpService.post).toHaveBeenCalledTimes(1);
  });

  it('should throw InternalServerErrorException on unexpected errors', async () => {
    mockHttpService.post.mockImplementation(() =>
      throwError(() => new Error('Timeout')),
    );

    await expect(
      service.calculateShipping(mockFromCep, mockToCep),
    ).rejects.toThrow(InternalServerErrorException);

    expect(mockHttpService.post).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalled();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { GoogleMapsService } from './google-maps.service';
import { HttpService } from '@nestjs/axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { of, throwError } from 'rxjs';
import {
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ViaCepData } from 'src/types';

describe('GoogleMapsService', () => {
  let service: GoogleMapsService;
  let httpService: HttpService;
  let logger: Logger;

  const mockLocationData: ViaCepData = {
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

  const mockOrigin = { lat: -23.55052, lng: -46.633308 };
  const mockDestinations = [{ lat: -23.561414, lng: -46.655881 }];

  const mockLogger = {
    error: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleMapsService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<GoogleMapsService>(GoogleMapsService);
    httpService = module.get<HttpService>(HttpService);
    logger = module.get(WINSTON_MODULE_PROVIDER);

    process.env.GOOGLE_API_KEY = 'fake-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should return coordinates when a valid CEP is provided', async () => {
    const fakeResponse = {
      data: {
        results: [
          {
            geometry: {
              location: {
                lat: -23.55052,
                lng: -46.633308,
              },
            },
          },
        ],
      },
    };
    mockHttpService.get.mockReturnValue(of(fakeResponse));

    const result = await service.geocodeCep(mockLocationData);

    const { cep, localidade, uf } = mockLocationData;
    const address = `${cep}, ${localidade}, ${uf}`;

    expect(result).toEqual({
      lat: -23.55052,
      lng: -46.633308,
    });
    expect(mockHttpService.get).toHaveBeenCalledWith(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address,
      )}&key=${process.env.GOOGLE_API_KEY}`,
    );
    expect(mockHttpService.get).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException if no location is found', async () => {
    const fakeResponse = {
      data: {
        results: [],
      },
    };

    mockHttpService.get.mockReturnValue(of(fakeResponse));

    await expect(service.geocodeCep(mockLocationData)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockHttpService.get).toHaveBeenCalledTimes(1);
  });

  it('should throw InternalServerErrorException on unexpected error', async () => {
    const error = new Error('Timeout');

    mockHttpService.get.mockReturnValue(throwError(() => error));

    await expect(service.geocodeCep(mockLocationData)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(mockHttpService.get).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('should return distance matrix when data is available', async () => {
    const fakeResponse = {
      data: {
        rows: [
          {
            elements: [
              {
                distance: { text: '2 km', value: 2000 },
                duration: { text: '5 mins', value: 300 },
              },
              {
                distance: { text: '4 km', value: 4000 },
                duration: { text: '10 mins', value: 600 },
              },
            ],
          },
        ],
      },
    };

    mockHttpService.get.mockReturnValue(of(fakeResponse));

    const result = await service.getDistanceMatrix(
      mockOrigin,
      mockDestinations,
    );

    const destinationsString = mockDestinations
      .map((d) => `${d.lat},${d.lng}`)
      .join('|');

    expect(mockHttpService.get).toHaveBeenCalledWith(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${mockOrigin.lat},${mockOrigin.lng}&destinations=${destinationsString}&key=${process.env.GOOGLE_API_KEY}`,
    );

    expect(result).toHaveLength(2);
    expect(result[0].distance.value).toBe(2000);
    expect(result[1].duration.text).toBe('10 mins');
    expect(mockHttpService.get).toHaveBeenCalledTimes(1);
  });

  it('should throw NotFoundException if no distances are found', async () => {
    const fakeResponse = {
      data: {
        rows: [
          {
            elements: [],
          },
        ],
      },
    };

    mockHttpService.get.mockReturnValue(of(fakeResponse));

    await expect(
      service.getDistanceMatrix(mockOrigin, mockDestinations),
    ).rejects.toThrow(NotFoundException);
    expect(mockHttpService.get).toHaveBeenCalledTimes(1);
  });

  it('should throw InternalServerErrorException on unexpected error (distance matrix)', async () => {
    mockHttpService.get.mockImplementation(() => {
      throw new Error('Timeout');
    });

    await expect(
      service.getDistanceMatrix(mockOrigin, mockDestinations),
    ).rejects.toThrow(InternalServerErrorException);
    expect(mockHttpService.get).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});

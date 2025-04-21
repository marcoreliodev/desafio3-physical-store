import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { StoresService } from './stores.service';
import { GoogleMapsService } from '../services/google-maps.service';
import { ViaCepService } from 'src/services/via-cep.service';
import { MelhorEnvioService } from 'src/services/melhor-envio.service';
import { Store } from './schemas/store.schema';
import { Model } from 'mongoose';

const mockStore = {
  storeID: 'store123',
  storeName: 'Loja Teste',
  city: 'São Paulo',
  state: 'SP',
  postalCode: '01000000',
  type: 'PDV',
  latitude: -23.5505,
  longitude: -46.6333,
  location: {
    type: 'Point',
    coordinates: [-46.6333, -23.5505],
  },
  toObject: function () {
    return {
      storeID: this.storeID,
      storeName: this.storeName,
      city: this.city,
      state: this.state,
      postalCode: this.postalCode,
      type: this.type,
      latitude: this.latitude,
      longitude: this.longitude,
    };
  },
};

const mockUserLocation = {
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

const mockUserCoordinates = {
  lat: -23.5505,
  lng: -46.6333,
};

const mockDistanceMatrix = [
  {
    distance: { text: '10 km', value: 10000 },
    duration: { text: '15 min', value: 900 },
    status: 'OK',
  },
];

const mockShippingOptions = [
  {
    name: 'PAC',
    price: '15.50',
    delivery_time: 5,
  },
  {
    name: 'SEDEX',
    price: '30.00',
    delivery_time: 2,
  },
];

describe('StoresService', () => {
  let service: StoresService;
  let storeModel: jest.Mocked<any>;
  let viaCepService: ViaCepService;
  let googleMapsService: GoogleMapsService;
  let melhorEnvioService: MelhorEnvioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: getModelToken(Store.name),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            countDocuments: jest.fn(),
          },
        },
        {
          provide: ViaCepService,
          useValue: {
            getLocationByCep: jest.fn(),
          },
        },
        {
          provide: GoogleMapsService,
          useValue: {
            geocodeCep: jest.fn(),
            getDistanceMatrix: jest.fn(),
          },
        },
        {
          provide: MelhorEnvioService,
          useValue: {
            calculateShipping: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StoresService>(StoresService);
    storeModel = module.get<Model<Store>>(getModelToken(Store.name));
    viaCepService = module.get<ViaCepService>(ViaCepService);
    googleMapsService = module.get<GoogleMapsService>(GoogleMapsService);
    melhorEnvioService = module.get<MelhorEnvioService>(MelhorEnvioService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listNearbyStoresByCep', () => {
    it('should return nearby stores', async () => {
      const cep = '12345678';
      const mockFindResult = {
        find: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnValue([mockStore]),
      };

      jest
        .spyOn(viaCepService, 'getLocationByCep')
        .mockResolvedValue(mockUserLocation);
      jest
        .spyOn(googleMapsService, 'geocodeCep')
        .mockResolvedValue(mockUserCoordinates);
      jest
        .spyOn(storeModel, 'find')
        .mockImplementation(() => mockFindResult as any);
      jest
        .spyOn(googleMapsService, 'getDistanceMatrix')
        .mockResolvedValue(mockDistanceMatrix);

      const result = await service.listNearbyStoresByCep(cep);

      expect(viaCepService.getLocationByCep).toHaveBeenCalledWith(cep);
      expect(googleMapsService.geocodeCep).toHaveBeenCalledWith(
        mockUserLocation,
      );
      expect(storeModel.find).toHaveBeenCalledWith({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [mockUserCoordinates.lng, mockUserCoordinates.lat],
            },
            $maxDistance: 100000,
          },
        },
      });
      expect(googleMapsService.getDistanceMatrix).toHaveBeenCalled();
      expect(result).toEqual([
        {
          ...mockStore.toObject(),
          distance: mockDistanceMatrix[0].distance.text,
          duration: mockDistanceMatrix[0].duration.text,
        },
      ]);
    });

    it('Should throw NotFoundException when no location found for CEP', async () => {
      const cep = '00000000';
      jest
        .spyOn(viaCepService, 'getLocationByCep')
        .mockResolvedValue(mockUserLocation);

      await expect(service.listNearbyStoresByCep(cep)).rejects.toThrow(
        new NotFoundException(
          'Não foi possível recuperar as coordenadas para a localização informada.',
        ),
      );
    });

    it('Should throw NotFoundException when no coordinates found for location', async () => {
      const cep = '01001000';
      jest
        .spyOn(viaCepService, 'getLocationByCep')
        .mockResolvedValue(mockUserLocation);
      jest
        .spyOn(googleMapsService, 'geocodeCep')
        .mockResolvedValue(null as any);

      await expect(service.listNearbyStoresByCep(cep)).rejects.toThrow(
        new NotFoundException(
          'Não foi possível recuperar as coordenadas para a localização informada.',
        ),
      );
    });

    it('Should throw NotFoundException when no stores found within radius', async () => {
      const cep = '01001000';
      const mockFindResult = {
        find: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnValue([]),
      };

      jest
        .spyOn(viaCepService, 'getLocationByCep')
        .mockResolvedValue(mockUserLocation);
      jest
        .spyOn(googleMapsService, 'geocodeCep')
        .mockResolvedValue(mockUserCoordinates);
      jest
        .spyOn(storeModel, 'find')
        .mockImplementation(() => mockFindResult as any);

      await expect(service.listNearbyStoresByCep(cep)).rejects.toThrow(
        new NotFoundException('Nenhuma loja encontrada no raio de 100Km.'),
      );
    });
  });

  describe('listAllStores', () => {
    it('should return all stores with pagination', async () => {
      const paginationDto = { offset: 0, limit: 10 };
      const mockStores = [mockStore];
      const totalCount = 1;

      jest.spyOn(storeModel, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockStores),
      } as any);
      jest.spyOn(storeModel, 'countDocuments').mockResolvedValue(totalCount);

      const result = await service.listAllStores(paginationDto);

      expect(storeModel.find).toHaveBeenCalled();
      expect(storeModel.countDocuments).toHaveBeenCalled();
      expect(result).toEqual({
        stores: mockStores,
        limit: paginationDto.limit,
        offset: paginationDto.offset,
        total: totalCount,
        currentPage: 1,
        totalPages: 1,
        statusCode: 200,
      });
    });

    it('should throw NotFoundException when no stores found', async () => {
      const paginationDto = { offset: 0, limit: 10 };

      jest.spyOn(storeModel, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      } as any);
      jest.spyOn(storeModel, 'countDocuments').mockResolvedValue(0);

      await expect(service.listAllStores(paginationDto)).rejects.toThrow(
        new NotFoundException('Nenhuma loja encontrada.'),
      );
    });
  });

  describe('getStoreById', () => {
    it('Should return a store by ID', async () => {
      const storeID = 'store123';

      jest.spyOn(storeModel, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockStore),
      } as any);

      const result = await service.getStoreById(storeID);

      expect(storeModel.findOne).toHaveBeenCalledWith({ storeID });
      expect(result).toBe(mockStore);
    });

    it('Should throw NotFoundException when store not found', async () => {
      const storeID = 'nonexistent';

      jest.spyOn(storeModel, 'findOne').mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.getStoreById(storeID)).rejects.toThrow(
        new NotFoundException(
          `Loja com o storeID ${storeID} não foi encontrada.`,
        ),
      );
    });
  });

  describe('listStoresByState', () => {
    it('Should return stores by state with pagination', async () => {
      const state = 'SP';
      const paginationDto = { offset: 0, limit: 10 };
      const mockStores = [mockStore];
      const totalCount = 1;

      jest.spyOn(storeModel, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockStores),
      } as any);
      jest.spyOn(storeModel, 'countDocuments').mockResolvedValue(totalCount);

      const result = await service.listStoresByState(state, paginationDto);

      expect(storeModel.find).toHaveBeenCalledWith({ state });
      expect(storeModel.countDocuments).toHaveBeenCalledWith({ state });
      expect(result).toEqual({
        stores: mockStores,
        limit: paginationDto.limit,
        offset: paginationDto.offset,
        total: totalCount,
        currentPage: 1,
        totalPages: 1,
        statusCode: 200,
      });
    });

    it('Should throw NotFoundException when no stores found in state', async () => {
      const state = 'XX';
      const paginationDto = { offset: 0, limit: 10 };

      jest.spyOn(storeModel, 'find').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      } as any);
      jest.spyOn(storeModel, 'countDocuments').mockResolvedValue(0);

      await expect(
        service.listStoresByState(state, paginationDto),
      ).rejects.toThrow(
        new NotFoundException(`Nenhuma loja encontrada no estado ${state}.`),
      );
    });
  });

  describe('listStoreByCep', () => {
    it('Should return the nearest PDV store to CEP', async () => {
      const cep = '01001000';

      jest
        .spyOn(viaCepService, 'getLocationByCep')
        .mockResolvedValue(mockUserLocation);
      jest
        .spyOn(googleMapsService, 'geocodeCep')
        .mockResolvedValue(mockUserCoordinates);
      jest.spyOn(storeModel, 'findOne').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockStore),
      } as any);
      jest
        .spyOn(googleMapsService, 'getDistanceMatrix')
        .mockResolvedValue(mockDistanceMatrix);

      const result = await service.listStoreByCep(cep);

      expect(viaCepService.getLocationByCep).toHaveBeenCalledWith(cep);
      expect(googleMapsService.geocodeCep).toHaveBeenCalledWith(
        mockUserLocation,
      );
      expect(storeModel.findOne).toHaveBeenCalledWith({
        type: 'PDV',
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [mockUserCoordinates.lng, mockUserCoordinates.lat],
            },
            $maxDistance: 50000,
          },
        },
      });
      expect(googleMapsService.getDistanceMatrix).toHaveBeenCalled();
      expect(result).toHaveProperty('stores');
      expect(result).toHaveProperty('pins');
      expect(result.stores[0]).toHaveProperty(
        'distance',
        mockDistanceMatrix[0].distance.text,
      );
      expect(result.stores[0]).toHaveProperty(
        'deliveryAddress',
        'Brasília, DF',
      );
      expect(result.stores[0]).toHaveProperty('value');
    });

    it('Should fall back to any store type if no PDV found', async () => {
      const cep = '01001000';
      const mockFindOneFirst = {
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };
      const mockFindOneSecond = {
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockStore),
      };

      jest
        .spyOn(viaCepService, 'getLocationByCep')
        .mockResolvedValue(mockUserLocation);
      jest
        .spyOn(googleMapsService, 'geocodeCep')
        .mockResolvedValue(mockUserCoordinates);
      jest
        .spyOn(storeModel, 'findOne')
        .mockReturnValueOnce(mockFindOneFirst as any)
        .mockReturnValueOnce(mockFindOneSecond as any);
      jest
        .spyOn(googleMapsService, 'getDistanceMatrix')
        .mockResolvedValue(mockDistanceMatrix);

      const result = await service.listStoreByCep(cep);

      expect(storeModel.findOne).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('stores');
      expect(result.stores.length).toBe(1);
    });

    it('Should throw NotFoundException when no store found', async () => {
      const cep = '01001000';

      jest
        .spyOn(viaCepService, 'getLocationByCep')
        .mockResolvedValue(mockUserLocation);
      jest
        .spyOn(googleMapsService, 'geocodeCep')
        .mockResolvedValue(mockUserCoordinates);
      jest.spyOn(storeModel, 'findOne').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.listStoreByCep(cep)).rejects.toThrow(
        new NotFoundException('Nenhuma loja encontrada.'),
      );
    });

    it('Should use processLocalDelivery for PDV store type', async () => {
      const cep = '01001000';
      const mockPdvStore = {
        ...mockStore,
        type: 'PDV',
      };

      jest
        .spyOn(viaCepService, 'getLocationByCep')
        .mockResolvedValue(mockUserLocation);
      jest
        .spyOn(googleMapsService, 'geocodeCep')
        .mockResolvedValue(mockUserCoordinates);
      jest.spyOn(storeModel, 'findOne').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPdvStore),
      } as any);
      jest.spyOn(googleMapsService, 'getDistanceMatrix').mockResolvedValue([
        {
          distance: { text: '10 km', value: 10000 },
          duration: { text: '15 min', value: 900 },
          status: 'OK',
        },
      ]);

      const result = await service.listStoreByCep(cep);

      expect(result.stores[0].value).toEqual([
        {
          prazo: '3h 7min',
          price: 'R$ 15,00',
          description: 'Motoboy',
        },
      ]);
    });

    it('Should use processShippingDelivery for non-PDV store type', async () => {
      const cep = '01001000';
      const mockNonPdvStore = {
        ...mockStore,
        type: 'DISTRIBUIDOR',
      };

      jest
        .spyOn(viaCepService, 'getLocationByCep')
        .mockResolvedValue(mockUserLocation);
      jest
        .spyOn(googleMapsService, 'geocodeCep')
        .mockResolvedValue(mockUserCoordinates);
      jest.spyOn(storeModel, 'findOne').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockNonPdvStore),
      } as any);
      jest
        .spyOn(googleMapsService, 'getDistanceMatrix')
        .mockResolvedValue(mockDistanceMatrix);
      jest
        .spyOn(melhorEnvioService, 'calculateShipping')
        .mockResolvedValue(mockShippingOptions as any);

      const result = await service.listStoreByCep(cep);

      expect(melhorEnvioService.calculateShipping).toHaveBeenCalledWith(
        mockNonPdvStore.postalCode,
        mockUserLocation.cep,
      );
      expect(result.stores[0].value).toHaveLength(2);
      expect(result.stores[0].value[0]).toHaveProperty('prazo', '5 dias úteis');
      expect(result.stores[0].value[0]).toHaveProperty('price', 'R$ 15.50');
      expect(result.stores[0].value[0]).toHaveProperty(
        'description',
        'PAC a encomenda econômica dos Correios',
      );
    });

    it('Should throw NotFoundException when CEP location not found', async () => {
      const cep = '00000000';
      jest
        .spyOn(viaCepService, 'getLocationByCep')
        .mockResolvedValue(null as any);

      await expect(service.listStoreByCep(cep)).rejects.toThrow(
        new NotFoundException(
          `Não foi possível encontrar a localização para o CEP: ${cep}`,
        ),
      );
    });

    it('Should throw NotFoundException when coordinates not found', async () => {
      const cep = '01001000';
      jest
        .spyOn(viaCepService, 'getLocationByCep')
        .mockResolvedValue(mockUserLocation);
      jest
        .spyOn(googleMapsService, 'geocodeCep')
        .mockResolvedValue(null as any);

      await expect(service.listStoreByCep(cep)).rejects.toThrow(
        new NotFoundException(
          'Não foi possível recuperar as coordenadas para a localização informada.',
        ),
      );
    });
  });
});

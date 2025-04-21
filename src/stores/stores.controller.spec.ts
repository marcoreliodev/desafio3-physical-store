import { Test, TestingModule } from '@nestjs/testing';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { CepValidationDto, PaginationQueryDto } from './dtos';
import { NotFoundException } from '@nestjs/common';

describe('StoresController', () => {
  let controller: StoresController;
  let service: StoresService;

  const mockStoresService = {
    listNearbyStoresByCep: jest.fn(),
    listAllStores: jest.fn(),
    getStoreById: jest.fn(),
    listStoresByState: jest.fn(),
    listStoreByCep: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoresController],
      providers: [
        {
          provide: StoresService,
          useValue: mockStoresService,
        },
      ],
    }).compile();

    controller = module.get<StoresController>(StoresController);
    service = module.get<StoresService>(StoresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findNearbyStores', () => {
    it('should call listNearbyStoresByCep with the correct CEP', async () => {
      const cepDto: CepValidationDto = { cep: '01001000' };
      const expectedResult = [{ id: '1', name: 'Store 1', distance: 5 }];

      mockStoresService.listNearbyStoresByCep.mockResolvedValue(expectedResult);

      const result = await controller.findNearbyStores(cepDto);

      expect(service.listNearbyStoresByCep).toHaveBeenCalledWith('01001000');
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException when no coordinates found', async () => {
      const cepDto: CepValidationDto = { cep: '01001000' };

      mockStoresService.listNearbyStoresByCep!.mockRejectedValue(
        new NotFoundException('Não encontrado'),
      );

      await expect(controller.findNearbyStores(cepDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listAll', () => {
    it('should call listAllStores with pagination parameters', async () => {
      const paginationDto: PaginationQueryDto = { limit: 10, offset: 0 };
      const expectedResult = {
        data: [
          { id: '1', name: 'Store 1' },
          { id: '2', name: 'Store 2' },
        ],
        total: 2,
        limit: 10,
        offset: 0,
      };

      mockStoresService.listAllStores.mockResolvedValue(expectedResult);

      const result = await controller.listAll(paginationDto);

      expect(service.listAllStores).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findStoreById', () => {
    it('should call getStoreById with the correct id', async () => {
      const storeId = '56';
      const expectedResult = { id: '56', name: 'Store 56' };

      mockStoresService.getStoreById.mockResolvedValue(expectedResult);

      const result = await controller.findStoreById(storeId);

      expect(service.getStoreById).toHaveBeenCalledWith(storeId);
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException if store not found', async () => {
      mockStoresService.getStoreById!.mockRejectedValue(
        new NotFoundException('Não encontrado'),
      );

      await expect(controller.findStoreById('notfound')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findStoresByState', () => {
    it('should call listStoresByState with state and pagination parameters', async () => {
      const state = 'SP';
      const paginationDto: PaginationQueryDto = { limit: 10, offset: 0 };
      const expectedResult = {
        data: [
          { id: '1', name: 'Store SP 1', state: 'SP' },
          { id: '2', name: 'Store SP 2', state: 'SP' },
        ],
        total: 2,
        limit: 10,
        offset: 0,
      };

      mockStoresService.listStoresByState.mockResolvedValue(expectedResult);

      const result = await controller.findStoresByState(state, paginationDto);

      expect(service.listStoresByState).toHaveBeenCalledWith(
        state,
        paginationDto,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findStoresByCep', () => {
    it('should call listStoreByCep with the correct CEP', async () => {
      const cepDto: CepValidationDto = { cep: '01001000' };
      const expectedResult = {
        id: '1',
        name: 'Store 1',
        deliveryFee: 10.5,
        deliveryTime: '30-45 min',
      };

      mockStoresService.listStoreByCep.mockResolvedValue(expectedResult);

      const result = await controller.findStoresByCep(cepDto);

      expect(service.listStoreByCep).toHaveBeenCalledWith('01001000');
      expect(result).toEqual(expectedResult);
    });

    it('should throw NotFoundException if store not found', async () => {
      const cepDto: CepValidationDto = { cep: '01001000' };

      mockStoresService.listStoreByCep!.mockRejectedValue(
        new NotFoundException('Não encontrado'),
      );

      await expect(controller.findStoresByCep(cepDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

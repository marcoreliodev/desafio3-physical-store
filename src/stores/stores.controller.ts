import { Controller, Get, Param, Query } from '@nestjs/common';
import { CepValidationDto } from './dtos/cep-validation.dto';
import { StoresService } from './stores.service';
import { PaginationQueryDto } from './dtos/pagination-query.dto';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('nearby/:cep')
  async findNearbyStores(@Param() params: CepValidationDto) {
    return await this.storesService.listNearbyStoresByCep(params.cep);
  }

  @Get('listall')
  async listAll(@Query() paginationQuery: PaginationQueryDto) {
    return await this.storesService.listAllStores(paginationQuery);
  }

  @Get('storebyid/:id')
  async findStoreById(@Param('id') id: string) {
    return await this.storesService.getStoreById(id);
  }

  @Get('storebystate/:state')
  async findStoresByState(
    @Param('state') state: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return await this.storesService.listStoresByState(state, paginationQuery);
  }
}

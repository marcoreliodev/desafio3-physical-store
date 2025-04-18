import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import {
  CepValidationDto,
  PaginationQueryDto,
  StoreResponseDto,
  StoreListResponseDto,
  StoreDeliveryResponseDto,
} from './dtos';

import { StoresService } from './stores.service';

@ApiTags('Lojas')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('nearby/:cep')
  @ApiOperation({
    summary: 'Listar lojas próximas no raio de 100km de um CEP.',
    description: 'Retorna uma lista de lojas no raio de 100km.',
  })
  @ApiParam({
    name: 'cep',
    description: 'CEP para busca geográfica',
    example: '01001000',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Lista de lojas próximas retornada com sucesso.',
    type: [StoreResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'CEP não encontrado ou fora da área de cobertura.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno no servidor.',
  })
  async findNearbyStores(@Param() params: CepValidationDto) {
    return await this.storesService.listNearbyStoresByCep(params.cep);
  }

  @Get('listall')
  @ApiOperation({
    summary: 'Listar todas as lojas com paginação.',
    description: 'Retorna uma lista de todas as lojas.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número máximo de resultados.',
    example: 10,
    type: 'number',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Deslocamento dos resultados.',
    example: 0,
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Lista completa de lojas retornada com sucesso.',
    type: [StoreListResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Nenhuma loja encontrada.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno no servidor.',
  })
  async listAll(@Query() paginationQuery: PaginationQueryDto) {
    return await this.storesService.listAllStores(paginationQuery);
  }

  @Get('storebyid/:id')
  @ApiOperation({
    summary: 'Buscar loja por ID.',
    description: 'Retorna os dados da loja com o ID informado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da loja.',
    example: '56',
  })
  @ApiOkResponse({
    description: 'Loja encontrada.',
    type: [StoreResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Loja não encontrada.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno no servidor.',
  })
  async findStoreById(@Param('id') id: string) {
    return await this.storesService.getStoreById(id);
  }

  @Get('storebystate/:state')
  @ApiOperation({
    summary: 'Listar lojas por estado com paginação.',
    description: 'Retorna uma lista de lojas de acordo com o estado informado.',
  })
  @ApiParam({
    name: 'state',
    description: 'Sigla do estado (UF).',
    example: 'SP',
    type: 'string',
  })
  @ApiQuery({ name: 'limit', required: false, example: 10, type: 'number' })
  @ApiQuery({ name: 'offset', required: false, example: 0, type: 'number' })
  @ApiOkResponse({
    description: 'Lista de lojas por estado retornada com sucesso.',
    type: [StoreListResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Nenhuma loja encontrada no estado indicado.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno no servidor.',
  })
  async findStoresByState(
    @Param('state') state: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return await this.storesService.listStoresByState(state, paginationQuery);
  }

  @Get('storebycep/:cep')
  @ApiOperation({
    summary: 'Buscar loja por CEP com entrega.',
    description: 'Retorna loja com dados de entrega.',
  })
  @ApiParam({
    name: 'cep',
    description: 'CEP da loja',
    example: '01001000',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Loja encontrada.',
    type: [StoreDeliveryResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Nenhuma loja encontrada.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno no servidor.',
  })
  async findStoresByCep(@Param() params: CepValidationDto) {
    return await this.storesService.listStoreByCep(params.cep);
  }
}

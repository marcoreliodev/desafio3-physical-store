import { Controller, Get, Param } from '@nestjs/common';
import { CepValidationDto } from './dtos/cep-validation.dto';
import { StoresService } from './stores.service';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get('nearby/:cep')
  async findNearbyStores(@Param() params: CepValidationDto) {}
}

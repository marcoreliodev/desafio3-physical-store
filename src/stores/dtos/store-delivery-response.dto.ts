import { ApiProperty } from '@nestjs/swagger';

class DeliveryOptionDto {
  @ApiProperty({ example: '8 dias úteis' })
  prazo: string;

  @ApiProperty({ example: 13987 })
  codProdutoAgencia: number;

  @ApiProperty({ example: 'R$ 89,90' })
  price: string;

  @ApiProperty({
    example: 'Descrição do tipo de entrega (ex: PAC, SEDEX, etc.)',
  })
  description: string;
}

class StoreDto {
  @ApiProperty({ example: 'Loja Centro SP' })
  storeName: string;

  @ApiProperty({ example: 'São Paulo' })
  city: string;

  @ApiProperty({ example: 'LOJA' })
  type: string;

  @ApiProperty({ example: '01000-000' })
  postalCode: string;

  @ApiProperty({ example: '158 km' })
  distance: string;

  @ApiProperty({ type: [DeliveryOptionDto] })
  value: DeliveryOptionDto[];
}

class PinPositionDto {
  @ApiProperty({ example: -23.561903 })
  lat: number;

  @ApiProperty({ example: -46.530821 })
  lng: number;
}

class PinDto {
  @ApiProperty({ type: PinPositionDto })
  position: PinPositionDto;

  @ApiProperty({ example: 'Loja Centro SP' })
  title: string;
}

export class StoreDeliveryResponseDto {
  @ApiProperty({ type: [StoreDto] })
  stores: StoreDto[];

  @ApiProperty({ type: [PinDto] })
  pins: PinDto[];

  @ApiProperty({ example: 1 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;

  @ApiProperty({ example: 1 })
  total: number;

  @ApiProperty({ example: 1 })
  currentPage: number;

  @ApiProperty({ example: 1 })
  totalPages: number;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

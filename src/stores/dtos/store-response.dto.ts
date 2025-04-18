import { ApiProperty } from '@nestjs/swagger';

export class StoreResponseDto {
  @ApiProperty({ example: '15' })
  storeID: string;

  @ApiProperty({ example: 'Loja 1 Centro' })
  storeName: string;

  @ApiProperty({ example: true })
  takeOutInStore: boolean;

  @ApiProperty({ example: 2, required: false })
  shippingTimeInDays?: number;

  @ApiProperty({ example: -7.160783 })
  latitude: number;

  @ApiProperty({ example: -35.860388 })
  longitude: number;

  @ApiProperty({ example: 'Rua Exemplo, 123' })
  address1: string;

  @ApiProperty({ example: 'São Paulo' })
  city: string;

  @ApiProperty({ example: 'Centro' })
  district: string;

  @ApiProperty({ example: 'SP' })
  state: string;

  @ApiProperty({ example: 'LOJA' })
  type: string;

  @ApiProperty({ example: 'Brasil' })
  country: string;

  @ApiProperty({ example: '01000-000' })
  postalCode: string;

  @ApiProperty({ example: '5.2 km' })
  distance: string;

  @ApiProperty({ example: '11 mins' })
  duration: string;
}

export class StoreListResponseDto {
  @ApiProperty({ type: [StoreResponseDto] })
  stores: StoreResponseDto[];

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;

  @ApiProperty({ example: 5 })
  total: number;

  @ApiProperty({ example: 1 })
  currentPage: number;

  @ApiProperty({ example: 1 })
  totalPages: number;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

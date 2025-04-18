import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GoogleMapsService } from 'src/services/google-maps.service';
import { ViaCepService } from 'src/services/via-cep.service';
import { MelhorEnvioService } from 'src/services/melhor-envio.service';
import { Store, StoreDocument } from './schemas/store.schema';
import { Model } from 'mongoose';
import { PaginationQueryDto } from './dtos/pagination-query.dto';

@Injectable()
export class StoresService {
  constructor(
    private readonly viaCepService: ViaCepService,
    private readonly googleMapsService: GoogleMapsService,
    private readonly melhorEnvioService: MelhorEnvioService,
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
  ) {}

  async listNearbyStoresByCep(cep: string) {
    const userLocation = await this.viaCepService.getLocationByCep(cep);

    if (!userLocation) {
      throw new NotFoundException(
        `Não foi possível encontrar a localização para o CEP: ${cep}`,
      );
    }

    const userCoordinates =
      await this.googleMapsService.geocodeCep(userLocation);

    if (!userCoordinates) {
      throw new NotFoundException(
        'Não foi possível recuperar as coordenadas para a localização informada.',
      );
    }

    const radiusInMeters = 100 * 1000; // 100km

    const nearbyStores = await this.storeModel
      .find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [userCoordinates.lng, userCoordinates.lat],
            },
            $maxDistance: radiusInMeters,
          },
        },
      })
      .select('-_id -createdAt -updatedAt -__v -location');
    if (nearbyStores.length === 0) {
      throw new NotFoundException('Nenhuma loja encontrada no raio de 100Km.');
    }

    const origin = userCoordinates;

    const destinations = nearbyStores.map((store) => ({
      lat: store.latitude,
      lng: store.longitude,
    }));

    const distanceMatrix = await this.googleMapsService.getDistanceMatrix(
      origin,
      destinations,
    );

    return nearbyStores.map((store, index) => ({
      ...store.toObject(),
      distance: distanceMatrix[index].distance.text,
      duration: distanceMatrix[index].duration.text,
    }));
  }

  async listAllStores({ offset, limit }: PaginationQueryDto) {
    const [stores, totalCount] = await Promise.all([
      this.storeModel
        .find()
        .select('-_id -createdAt -updatedAt -__v -location')
        .skip(offset)
        .limit(limit)
        .exec(),
      this.storeModel.countDocuments(),
    ]);

    if (!stores || stores.length === 0) {
      throw new NotFoundException('Nenhuma loja encontrada.');
    }

    return {
      stores,
      limit,
      offset,
      total: totalCount,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 0,
      statusCode: 200,
    };
  }

  async getStoreById(storeID: string) {
    const store = await this.storeModel
      .findOne({ storeID })
      .select('-_id -createdAt -updatedAt -__v -location');

    if (!store) {
      throw new NotFoundException(
        `Loja com o storeID ${storeID} não foi encontrada.`,
      );
    }

    return store;
  }

  async listStoresByState(
    state: string,
    { offset, limit }: PaginationQueryDto,
  ) {
    const [stores, totalCount] = await Promise.all([
      this.storeModel
        .find({ state })
        .select('-_id -createdAt -updatedAt -__v -location')
        .skip(offset)
        .limit(limit)
        .exec(),
      this.storeModel.countDocuments({ state }),
    ]);

    if (!stores || stores.length === 0) {
      throw new NotFoundException(
        `Nenhuma loja encontrada no estado ${state}.`,
      );
    }

    return {
      stores,
      limit,
      offset,
      total: totalCount,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 0,
      statusCode: 200,
    };
  }

  async listStoreByCep(cep: string) {
    const userLocation = await this.viaCepService.getLocationByCep(cep);

    if (!userLocation) {
      throw new NotFoundException(
        `Não foi possível encontrar a localização para o CEP: ${cep}`,
      );
    }

    const userCoordinates =
      await this.googleMapsService.geocodeCep(userLocation);

    if (!userCoordinates) {
      throw new NotFoundException(
        'Não foi possível recuperar as coordenadas para a localização informada.',
      );
    }

    const radiusInMeters = 50 * 1000; // 50km

    let nearbyStore = await this.storeModel
      .findOne({
        type: 'PDV',
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [userCoordinates.lng, userCoordinates.lat],
            },
            $maxDistance: radiusInMeters,
          },
        },
      })
      .select('-_id storeName city postalCode type latitude longitude')
      .exec();

    if (!nearbyStore) {
      nearbyStore = await this.storeModel
        .findOne({
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [userCoordinates.lng, userCoordinates.lat],
              },
            },
          },
        })
        .select('-_id storeName city postalCode type latitude longitude')
        .exec();
    }

    if (!nearbyStore) {
      throw new NotFoundException('Nenhuma loja encontrada.');
    }

    const { latitude, longitude, ...storeDetails } = nearbyStore.toObject();

    const origin = userCoordinates;
    const destinations = [
      {
        lat: latitude,
        lng: longitude,
      },
    ];

    const deliveryMetrics = await this.googleMapsService.getDistanceMatrix(
      origin,
      destinations,
    );

    const { text: travelDistance, value: travelTimeInSeconds } =
      deliveryMetrics[0].distance;

    const value =
      storeDetails.type === 'PDV'
        ? this.processLocalDelivery(travelTimeInSeconds)
        : await this.processShippingDelivery(
            storeDetails.postalCode,
            userLocation.cep,
          );

    const { localidade = '', uf = '' } = userLocation || {};
    const buyerAddress = [localidade, uf].join(', ');

    const storeWithDeliveryDetails = {
      ...storeDetails,
      distance: travelDistance,
      deliveryAddress: buyerAddress,
      value,
    };

    const pins = [
      {
        position: {
          lat: latitude,
          lng: longitude,
        },
        title: storeDetails.storeName,
      },
    ];

    return {
      stores: [storeWithDeliveryDetails],
      pins,
      limit: 1,
      offset: 0,
      total: 1,
      currentPage: 1,
      totalPages: 1,
      statusCode: 200,
    };
  }

  private processLocalDelivery(travelTimeInSeconds: number) {
    const PREPARATION_TIME_SECONDS = 20 * 60; // 20 minutos

    const ETA = (travelTimeInSeconds + PREPARATION_TIME_SECONDS) / 60;

    const hours = Math.floor(ETA / 60);
    const minutes = Math.round(ETA % 60);

    const formattedETA =
      hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

    return [
      {
        prazo: formattedETA,
        price: 'R$ 15,00',
        description: 'Motoboy',
      },
    ];
  }

  private async processShippingDelivery(fromCep: string, toCep: string) {
    const shippingOptions = await this.melhorEnvioService.calculateShipping(
      fromCep,
      toCep,
    );

    return shippingOptions.map((shipping) => {
      return {
        prazo: `${shipping.delivery_time} dias úteis`,
        codProdutoAgencia: Math.floor(Math.random() * 90000) + 10000,
        price: `R$ ${shipping.price}`,
        description:
          shipping.name === 'PAC'
            ? 'PAC a encomenda econômica dos Correios'
            : 'Sedex a encomenda expressa dos Correios',
      };
    });
  }
}

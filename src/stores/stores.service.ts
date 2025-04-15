import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GoogleMapsService } from 'src/services/google-maps.service';
import { ViaCepService } from 'src/services/via-cep.service';
import { Store, StoreDocument } from './schemas/store.schema';
import { Model } from 'mongoose';
import { PaginationQueryDto } from './dtos/pagination-query.dto';

@Injectable()
export class StoresService {
  constructor(
    private readonly viaCepService: ViaCepService,
    private readonly googleMapsService: GoogleMapsService,
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

    const nearbyStores = await this.storeModel.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [userCoordinates.lng, userCoordinates.lat],
          },
          $maxDistance: radiusInMeters,
        },
      },
    });

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
      storeID: store.storeID,
      storeName: store.storeName,
      takeOutInStore: store.takeOutInStore,
      shippingTimeInDays: store.shippingTimeInDays,
      latitude: store.latitude,
      longitude: store.longitude,
      address1: store.address1,
      address2: store.address2,
      address3: store.address3,
      city: store.city,
      district: store.district,
      state: store.state,
      type: store.type,
      country: store.country,
      postalCode: store.postalCode,
      telephoneNumber: store.telephoneNumber,
      emailAddress: store.emailAddress,
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
}

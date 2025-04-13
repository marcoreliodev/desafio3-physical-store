import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StoreDocument = HydratedDocument<Store>;

export enum StoreType {
  PDV = 'PDV',
  LOJA = 'LOJA',
}

@Schema({ timestamps: true })
export class Store {
  @Prop({ required: true, unique: true, index: true })
  storeID: string;

  @Prop({ required: true })
  storeName: string;

  @Prop({ default: true })
  takeOutInStore: boolean;

  @Prop()
  shippingTimeInDays: number;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
    },
  })
  location: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop({ required: true })
  address1: string;

  @Prop()
  address2?: string;

  @Prop()
  address3?: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  district: string;

  @Prop({ required: true })
  state: string;

  @Prop({ type: String, enum: StoreType, required: true })
  type: StoreType;

  @Prop({ default: 'Brasil' })
  country: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop()
  telephoneNumber: string;

  @Prop()
  emailAddress: string;
}

export const StoreSchema = SchemaFactory.createForClass(Store);

StoreSchema.index({ type: 1 });
StoreSchema.index({ city: 1, state: 1 });
StoreSchema.index({ postalCode: 1 });
StoreSchema.index({ location: '2dsphere' });

StoreSchema.pre<StoreDocument>('save', function (next) {
  if (this.latitude && this.longitude) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude],
    };
  }

  next();
});

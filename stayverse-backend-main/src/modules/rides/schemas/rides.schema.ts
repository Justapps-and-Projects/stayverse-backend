import { ListingLocationSchema } from '../../../common/schemas/listing-location.schema';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { BookedStatus, CAUTION_FEE, ServiceStatus, ServiceType } from "src/common/constants/enum";
import mongoose from "mongoose";

export type RideDocument = Ride & Document;

@Schema({ timestamps: true })
export class Ride {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
  agentId: Types.ObjectId;

  @Prop({ required: true })
  rideName: string;

  @Prop({ required: true })
  rideDescription: string;

  @Prop({ required: true })
  address: string;

  @Prop({ type: String, required: false })
  placeId: string;
  @Prop({ type: ListingLocationSchema, default: null })
  location: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop({ type: String, required: true })
  rideType: string;

  @Prop({
    type: [String],
    validate: [(val: string[]) => val.length >= 3 && val.length <= 7, 'Features must be between 3 and 7']
  })
  features: string[];

  @Prop({ type: Number, required: true, min: 1000 })
  pricePerHour: number;

  @Prop({ type: String, default: null })
  rules?: string;

  @Prop({ type: Number, min: 1, default: 0 })
  maxPassengers?: number;

  @Prop({
    type: [String],
    validate: [(val: string[]) => val.length >= 3 && val.length <= 12, 'You can upload between 3 and 12 ride images']
  })
  rideImages: string[];

  @Prop({ required: true })
  plateNumber: string;

  @Prop({ required: true })
  registrationNumber: string;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  vehicleVerificationNumber: string;

  @Prop({ type: String, enum: BookedStatus, default: BookedStatus.AVAILABLE })
  bookedStatus: BookedStatus;

  @Prop({ type: String, enum: ServiceStatus, default: ServiceStatus.PENDING })
  status: string;

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  averageRating?: number;

  @Prop({ type: String, enum: ServiceType, default: ServiceType.RIDE })
  serviceType: ServiceType;

  @Prop({ type: String, default: false })
  security: boolean

  @Prop({ type: String, default: false })
  airportPickup: boolean

  @Prop({ type: Number, min: 0, default: CAUTION_FEE })
  cautionFee?: number;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const RideSchema = SchemaFactory.createForClass(Ride);
RideSchema.virtual('agent', {
  ref: 'Agent',
  localField: 'agentId',
  foreignField: '_id',
  justOne: true,
  options: {
    populate: {
      path: 'user',
      select: 'firstname lastname email phoneNumber proilePicture'
    }
  }
});
RideSchema.set('toObject', { virtuals: true });
RideSchema.set('toJSON', { virtuals: true });

RideSchema.index({ location: '2dsphere' });

RideSchema.pre(/^find/, function (next) {
  if (this instanceof mongoose.Query) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

RideSchema.pre('countDocuments', function (next) {
  if (this instanceof mongoose.Query) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});



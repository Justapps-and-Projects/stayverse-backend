import { ListingLocationSchema } from '../../../common/schemas/listing-location.schema';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Certification } from "./certification.schema";
import { Experience } from "./experience.schema";
import { BookedStatus, ServiceStatus } from "src/common/constants/enum";
import { Feature } from "./feaure.schema";

export type ChefDocument = Chef & Document;

@Schema({ timestamps: true })
export class Chef {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
  agentId: Types.ObjectId;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  address: string;

  @Prop({ type: String, required: false })
  placeId: string;

  @Prop({ type: ListingLocationSchema, default: null })
  location: {
    type: 'Point';
    coordinates: [number, number];
  };

  @Prop({ required: true })
  bio: string;

  @Prop({ required: true })
  about: string;

  @Prop({
    type: [String],
    validate: [(val: string[]) => val.length >= 2 && val.length <= 10, 'Culinary specialties must be between 2 and 10'],
    required: true
  })
  culinarySpecialties: string[];

  @Prop({ type: Number, required: true, min: 0 })
  pricingPerHour: number;

  @Prop({
    type: String,
    required: true,
    validate: {
      validator: (v: string) => typeof v === 'string' && v.length > 0,
      message: 'Profile picture must be a valid string URL'
    }
  })
  profilePicture: string;

  @Prop({ type: String, enum: ServiceStatus, default: ServiceStatus.PENDING })
  status: ServiceStatus;


  @Prop({
    type: String,
    required: true,
    validate: {
      validator: (v: string) => typeof v === 'string' && v.length > 0,
      message: 'Cover photo must be a valid string URL'
    }
  })
  coverPhoto: string;

  @Prop({ required: false, default: false })
  hasExperience: boolean;

  @Prop({ required: false, default: false })
  hasCertifications: boolean;

  @Prop({ type: Number, min: 0, default: 0 })
  averageRating?: number;
}

export const ChefSchema = SchemaFactory.createForClass(Chef);

ChefSchema.index({ location: '2dsphere' });

ChefSchema.virtual('agent', {
  ref: 'Agent',
  localField: 'agentId',
  foreignField: '_id',
  justOne: true,
  options: {
    populate: {
      path: 'user',
      select: 'firstname lastname email phoneNumber profilePicture proilePicture'
    }
  }
});

ChefSchema.virtual('experiences', {
  ref: Experience.name,
  localField: '_id',
  foreignField: 'chefId',
});

ChefSchema.virtual('certifications', {
  ref: Certification.name,
  localField: '_id',
  foreignField: 'chefId',
});
ChefSchema.virtual('features', {
  ref: Feature.name,
  localField: '_id',
  foreignField: 'chefId',
});

ChefSchema.set('toObject', { virtuals: true });
ChefSchema.set('toJSON', { virtuals: true });

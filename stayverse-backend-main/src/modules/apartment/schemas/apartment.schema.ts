import { ListingLocationSchema } from '../../../common/schemas/listing-location.schema';
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import mongoose from "mongoose";
import { ServiceStatus, BookedStatus, CAUTION_FEE } from "src/common/constants/enum";

export type ApartmentDocument = Apartment & Document;

@Schema({ timestamps: true })
export class Apartment {
    _id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Agent', required: true })
    agentId: Types.ObjectId;

    @Prop({ required: true })
    apartmentName: string;

    @Prop({ required: true })
    details: string;

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
    apartmentType: string;

    @Prop({ type: Number, required: true, min: 0, default: 1 })
    numberOfBedrooms: number;

    @Prop({
        type: [String],
        validate: [(val: string[]) => val.length >= 3 && val.length <= 7, 'Amenities must be between 3 and 7']
    })
    amenities: string[];

    @Prop({ type: Number, required: true, min: 0 })
    pricePerDay: number;

    @Prop({ type: String, default: null })
    houseRules?: string;

    @Prop({ type: Number, min: 0, default: 0 })
    maxGuests?: number;

    @Prop({ type: Date, required: true })
    checkIn: Date;

    @Prop({ type: Date, default: null })
    checkOut?: Date;

    @Prop({ type: Number, min: 0, default: CAUTION_FEE })
    cautionFee?: number;

    @Prop({
        type: [String],
        validate: [(val: string[]) => val.length >= 2 && val.length <= 10, 'Cannot upload more than 10 images']
    })
    apartmentImages: string[];

    @Prop({ type: String, enum: BookedStatus, default: BookedStatus.AVAILABLE })
    bookedStatus: BookedStatus;

    @Prop({ type: String, enum: ServiceStatus, default: ServiceStatus.PENDING })
    status: ServiceStatus;

    @Prop({ type: Number, default: 0, min: 0, max: 5 })
    averageRating?: number;

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;
}

export const ApartmentSchema = SchemaFactory.createForClass(Apartment);

ApartmentSchema.index({ location: '2dsphere' });

ApartmentSchema.pre(/^find/, function (next) {
    if (this instanceof mongoose.Query) {
        this.find({ isDeleted: { $ne: true } });
    }
    next();
});

ApartmentSchema.pre('countDocuments', function (next) {
    if (this instanceof mongoose.Query) {
        this.find({ isDeleted: { $ne: true } });
    }
    next();
});

ApartmentSchema.virtual('agent', {
    ref: 'Agent',
    localField: 'agentId',
    foreignField: '_id',
    justOne: true,
    options: {
        populate: {
            path: 'user',
            select: 'firstname lastname email phoneNumber profilePicture'
        }
    }
});
ApartmentSchema.set('toObject', { virtuals: true });
ApartmentSchema.set('toJSON', { virtuals: true });
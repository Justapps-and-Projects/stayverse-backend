import { Schema } from 'mongoose';

/** Optional GeoJSON point. Manual addresses have no location until geocoded. */
export const ListingLocationSchema = new Schema({
  type: { type: String, enum: ['Point'], required: true },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: (value: number[]) => value.length === 2 &&
        value.every(Number.isFinite) && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90,
      message: 'Coordinates must be a valid longitude and latitude pair',
    },
  },
}, { _id: false });

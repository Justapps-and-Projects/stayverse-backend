import { ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  IsDate,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
  Validate,
  MinDate,
  IsEnum,
  IsLatitude,
  IsLongitude,
  ValidateNested,
  Max,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ServiceStatus } from "src/common/constants/enum";
import { IsDefinedAndNotEmpty } from "src/common/validators/undefined-empty.validator";

export class CreateApartmentDto {
  @ApiProperty({ example: "Los Blancos" })
  @IsString()
  @IsNotEmpty()
  apartmentName: string;

  @ApiProperty({ example: "A beautiful apartment in Lagos" })
  @IsString()
  @IsNotEmpty()
  details: string;

  @ApiPropertyOptional({ description: 'Google Place ID; optional for a manual address' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() || undefined : value)
  @IsOptional()
  @IsString()
  placeId?: string;

  @ApiPropertyOptional({ description: 'Address entered by the agent; required without a Place ID' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @ValidateIf(o => o.address !== undefined || !o.placeId)
  @IsString()
  @IsNotEmpty()
  address?: string;

  @ApiProperty({ example: 'STUDIO' })
  apartmentType: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  numberOfBedrooms: number;

  @ApiProperty({
    description: "List of amenities available in the apartment",
    example: ["WiFi", "Parking", "Gym"],
    type: [String],
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map(v => v.trim());
    if (typeof value === "string") return value.split(",").map(v => v.trim());
    return [];
  })
  @IsArray()
  @ArrayMinSize(3, { message: "Amenities must be between 3 and 7" })
  @ArrayMaxSize(7, { message: "Amenities must be between 3 and 7" })
  @IsString({ each: true })
  amenities: string[];

  @ApiProperty({ example: 1500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerDay: number;

  @ApiPropertyOptional({ example: "No smoking allowed inside the apartment" })
  @IsString()
  @IsOptional()
  houseRules?: string;

  @ApiPropertyOptional({ example: 4 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxGuests?: number;

  @ApiProperty({ example: "2024-12-01T14:00:00.000Z" })
  @IsDate()
  @Type(() => Date)
  checkIn: Date;

  @ApiPropertyOptional({ example: "2024-12-05T12:00:00.000Z" })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  checkOut?: Date;

  @ApiPropertyOptional({ example: 20000, description: "Refundable caution fee (NGN)" })
  @IsDefinedAndNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  cautionFee?: number;


  @ApiProperty({
    type: "array",
    items: {
      type: "string",
      format: "binary",
    },
    description: "Apartment images",
  })
  apartmentImages: string[];
}

export class UpdateApartmentDto {
  @ApiPropertyOptional({ description: 'Address entered by the agent' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @ValidateIf(o => o.address !== undefined)
  @IsString()
  @IsNotEmpty()
  address?: string;

  @ApiPropertyOptional({ example: 'Los Blancos' })
  @IsDefinedAndNotEmpty()
  @IsString()
  @IsOptional()
  apartmentName?: string;

  @ApiPropertyOptional({ example: 'A beautiful apartment in Lagos' })
  @IsDefinedAndNotEmpty()
  @IsString()
  @IsOptional()
  details?: string;

  @ApiPropertyOptional({ example: 'ChIJd8BlQ2BZwokRAFUEcm_qrcA' })
  @IsDefinedAndNotEmpty()
  @IsString()
  @IsOptional()
  placeId?: string;

  @ApiPropertyOptional({ example: 'STUDIO' })
  apartmentType: any;

  @ApiPropertyOptional({ example: 2 })
  @IsDefinedAndNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  numberOfBedrooms?: number;

  @ApiPropertyOptional({
    description: 'List of amenities available in the apartment',
    example: ['WiFi', 'Parking', 'Gym'],
    type: [String],
  })
  @IsDefinedAndNotEmpty()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.map((v) => v.trim());
    if (typeof value === 'string') return value.split(',').map((v) => v.trim());
    return [];
  })
  @IsArray()
  @ArrayMinSize(3, { message: 'Amenities must be between 3 and 7' })
  @ArrayMaxSize(7, { message: 'Amenities must be between 3 and 7' })
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @ApiPropertyOptional({ example: 1500 })
  @IsDefinedAndNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerDay?: number;

  @ApiPropertyOptional({ example: 'No smoking allowed inside the apartment' })
  @IsString()
  @IsOptional()
  houseRules?: string;

  @ApiPropertyOptional({ example: 4 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxGuests?: number;

  @ApiPropertyOptional({ example: '2024-12-01T14:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  checkIn?: Date;

  @ApiPropertyOptional({ example: '2024-12-05T12:00:00.000Z' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  checkOut?: Date;

  @ApiPropertyOptional({ example: 20000 })
  @IsDefinedAndNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  cautionFee?: number;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Apartment images',
  })
  @IsOptional()
  apartmentImages?: string[];
}
export class PriceRangeDto {
  @ApiPropertyOptional({
    example: 5000,
    description: 'Minimum price (inclusive)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  min?: number;

  @ApiPropertyOptional({
    example: 10000,
    description: 'Maximum price (inclusive)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  max?: number;
}
export class SearchApartmentDto {
  @ApiProperty({
    required: false,
    type: String,
    description: 'Search term that matches apartment name, address or details',
  })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Details of the apartment',
  })
  @IsOptional()
  @IsString()
  details?: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Type of the apartment',
  })
  @IsOptional()
  @IsString()
  apartmentType?: string;

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Number of bedrooms in the apartment',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  numberOfBedrooms?: number;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Amenities available in the apartment',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Latitude of the apartment location',
  })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Longitude of the apartment location',
  })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Radius in meters for searching apartments',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radius?: number;

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiProperty({
    required: false,
    type: Number,
    description: 'Number of items per page for pagination',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiProperty({
    required: false,
    type: Object,
    description: 'Price range filter object with optional min and max fields',
    example: { min: 1000, max: 5000 },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PriceRangeDto)
  priceRange?: PriceRangeDto;
}

export class UpdateApartmentStatusDto {
  @ApiProperty({
    description: 'update apartment listing status',
    enum: ServiceStatus,
    example: ServiceStatus.APPROVED,
  })
  @IsEnum(ServiceStatus, { message: 'Status must be one of: approved, cancelled' })
  @IsNotEmpty()
  status: ServiceStatus;
}
export class CreateApartmentRatingDto {
  @ApiProperty({ example: 5, description: 'Rating value between 1 and 5' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Great experience, very clean and cozy place!' })
  @IsOptional()
  @IsString()
  review?: string;
}

export class UpdateApartmentRatingDto {
  @ApiPropertyOptional({ example: 4 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ example: 'Updated review text' })
  @IsOptional()
  @IsString()
  review?: string;
}

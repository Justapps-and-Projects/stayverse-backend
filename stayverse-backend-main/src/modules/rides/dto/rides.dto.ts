import { ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  IsEnum,
  IsLatitude,
  IsLongitude,
  ArrayMinSize,
  ArrayMaxSize,
  Max,
  IsBoolean,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ServiceStatus } from "src/common/constants/enum";
import { IsDefinedAndNotEmpty } from "src/common/validators/undefined-empty.validator";
import { MinIfDefined } from "src/common/validators/min-if-defined.validator";
export class CreateRideDto {
  @ApiProperty({ example: "Toyota Camry" })
  @IsString()
  @IsNotEmpty()
  rideName: string;

  @ApiProperty({ example: "An Ebony 4-wheeled Sonic" })
  @IsString()
  @IsNotEmpty()
  rideDescription: string;

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

  @ApiProperty({ example: 'car' })
  rideType: string;

  @ApiProperty({
    description: "List of ride features (e.g., AC, Leather Seats)",
    example: ["AC", "Leather Seats", "Bluetooth"],
    type: [String],
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map((v) => v.trim());
    if (typeof value === "string") return value.split(",").map((v) => v.trim());
    return [];
  })
  @IsArray()
  @ArrayMinSize(3, { message: "Features must be between 3 and 7" })
  @ArrayMaxSize(7, { message: "Features must be between 3 and 7" })
  @IsString({ each: true })
  features: string[];

  @ApiProperty({ example: 5000, description: "Price per Hour(NGN)" })
  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  pricePerHour: number;

  @ApiProperty({ example: "No smoking or eating inside the vehicle" })
  @IsString()
  @IsOptional()
  rules?: string;

  @ApiPropertyOptional({ example: 4, description: "Maximum number of passengers" })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxPassengers?: number;

  @ApiProperty({
    type: "array",
    items: { type: "string", format: "binary" },
    description: "Upload ride images",
  })
  rideImages: string[];

  @ApiProperty({ example: "ABC-1234", description: "Vehicle Plate Number" })
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @ApiProperty({ example: "RVN-456789", description: "Vehicle Registration Number" })
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @ApiProperty({ example: "Red", description: "Vehicle Color" })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({ example: "VVN-987654", description: "Vehicle Verification Number" })
  @IsString()
  @IsNotEmpty()
  vehicleVerificationNumber: string;

  @ApiPropertyOptional({
    example: true,
    description: "Whether the ride has security features",
    default: false,
  })
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  @IsOptional()
  security?: boolean = false;

  @ApiPropertyOptional({
    example: true,
    description: "Whether airport pickup is available",
    default: false,
  })
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  @IsOptional()
  airportPickup?: boolean = false;

  @ApiPropertyOptional({ example: 20000, description: "Refundable caution fee (NGN)" })
  @IsDefinedAndNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  cautionFee?: number;
}

export class UpdateRideDto {
  @ApiPropertyOptional({ description: 'Address entered by the agent' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @ValidateIf(o => o.address !== undefined)
  @IsString()
  @IsNotEmpty()
  address?: string;

  @ApiPropertyOptional({ example: "Toyota Camry" })
  @IsDefinedAndNotEmpty()
  @IsString()
  @IsOptional()
  rideName?: string;

  @ApiPropertyOptional({ example: "An Ebony 4-wheeled Sonic" })
  @IsDefinedAndNotEmpty()
  @IsString()
  @IsOptional()
  rideDescription?: string;

  @ApiPropertyOptional({ example: "ChIJd8BlQ2BZwokRAFUEcm_qrcA" })
  @IsDefinedAndNotEmpty()
  @IsString()
  @IsOptional()
  placeId?: string;

  @ApiPropertyOptional({ example: 'car' })
  @IsDefinedAndNotEmpty()
  @IsString()
  @IsOptional()
  rideType?: string;

  @ApiPropertyOptional({
    description: "List of ride features (e.g., AC, Leather Seats)",
    example: ["AC", "Leather Seats", "Bluetooth"],
    type: [String],
  })
  @IsDefinedAndNotEmpty()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.map((v) => v.trim());
    if (typeof value === "string") return value.split(",").map((v) => v.trim());
    return [];
  })
  @IsArray()
  @ArrayMinSize(3, { message: "Features must be between 3 and 7" })
  @ArrayMaxSize(7, { message: "Features must be between 3 and 7" })
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ example: 5000, description: "Price per hour (NGN)" })
  @IsOptional()
  @IsDefinedAndNotEmpty()
  // @MinIfDefined(1000, { message: 'pricePerHour must not be less than 1000' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  pricePerHour?: number;

  @ApiPropertyOptional({ example: "No smoking or eating inside the vehicle" })
  @IsOptional()
  @IsDefinedAndNotEmpty()
  @IsString()
  @IsOptional()
  rules?: string;

  @ApiPropertyOptional({ example: 4, description: "Maximum number of passengers" })
  @IsOptional()
  @IsDefinedAndNotEmpty()
  // @MinIfDefined(1, { message: 'maxPassengers must not be less than 1' })
  @Type(() => Number)
  @IsNumber()
  maxPassengers?: number;

  @ApiPropertyOptional({

    type: "array",
    items: { type: "string", format: "binary" },
    description: "Upload ride images",
  })
  @IsOptional()
  @IsDefinedAndNotEmpty()
  rideImages?: string[];

  @ApiPropertyOptional({ example: "ABC-1234", description: "Vehicle Plate Number" })
  @IsDefinedAndNotEmpty()
  @IsString()
  @IsOptional()
  plateNumber?: string;

  @ApiPropertyOptional({ example: "RVN-456789", description: "Vehicle Registration Number" })
  @IsDefinedAndNotEmpty()
  @IsString()
  @IsOptional()
  registrationNumber?: string;

  @ApiPropertyOptional({ example: "Red", description: "Vehicle Color" })
  @IsDefinedAndNotEmpty()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: "VVN-987654", description: "Vehicle Verification Number" })
  @IsDefinedAndNotEmpty()
  @IsString()
  @IsOptional()
  vehicleVerificationNumber?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Whether the ride has security features",
    default: false,
  })
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  @IsOptional()
  security?: boolean = false;

  @ApiPropertyOptional({
    example: true,
    description: "Whether airport pickup is available",
    default: false,
  })
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  @IsOptional()
  airportPickup?: boolean = false;

  @ApiPropertyOptional({ example: 20000, description: "Refundable caution fee (NGN)" })
  @IsDefinedAndNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  cautionFee?: number;
}

export class SearchRidesDto {
  @ApiProperty({
    required: false,
    type: String,
    description: "Search term that matches ride name, address, type, color",
  })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiProperty({ required: false, type: String, description: "Type of the ride" })
  @IsOptional()
  @IsString()
  rideType?: string;

  @ApiProperty({ required: false, type: String, description: "Ride Description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, type: [String], description: "Features of the ride" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({ required: false, type: Number, description: "Latitude of the ride location" })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @ApiProperty({ required: false, type: Number, description: "Longitude of the ride location" })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;

  @ApiProperty({ required: false, type: Number, description: "Radius (in meters) for searching rides from given location" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radius?: number;

  @ApiProperty({ required: false, type: Number, description: "Minimum price filter for the ride" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMin?: number;

  @ApiProperty({ required: false, type: Number, description: "Maximum price filter for the ride" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMax?: number;

  @ApiProperty({ required: false, type: Number, description: "Page number for pagination" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiProperty({ required: false, type: Number, description: "Number of items per page for pagination" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export class UpdateRideStatusDto {
  @ApiProperty({
    description: "update ride listing status",
    enum: ServiceStatus,
    example: ServiceStatus.APPROVED,
  })
  @IsEnum(ServiceStatus, { message: "Status must be one of: approved, cancelled" })
  @IsNotEmpty()
  status: ServiceStatus;
}

export class CreateRideRatingDto {
  @ApiProperty({ example: 5, description: 'Rating value between 1 and 5' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Smooth ride, very comfortable car!' })
  @IsOptional()
  @IsString()
  review?: string;
}

export class UpdateRideRatingDto {
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

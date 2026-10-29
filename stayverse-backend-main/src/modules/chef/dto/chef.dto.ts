import { ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsLatitude, IsLongitude, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Types } from 'mongoose';
import { ServiceStatus } from 'src/common/constants/enum';

export class CreateChefDto {
  @ApiProperty({ description: 'Full name of the chef', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

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

  @ApiProperty({ description: 'Short bio of the chef', example: 'Award-winning chef with 10 years of experience.' })
  @IsString()
  @IsNotEmpty()
  bio: string;

  @ApiProperty({ description: 'Detailed description about the chef', example: 'Specializes in Italian and French cuisine.' })
  @IsString()
  @IsNotEmpty()
  about: string;
  // 681b72c5beb4aa08735c5621
  @ApiProperty({ description: 'Culinary specialties of the chef', example: ['Italian Cuisine', 'French Cuisine'], type: [String] })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map(v => v.trim());
    if (typeof value === "string") return value.split(",").map(v => v.trim());
    return [];
  })
  @IsArray()
  @ArrayMinSize(3, { message: "Culinary Specialities must be between 3 and 7" })
  @ArrayMaxSize(5, { message: "Culinary Specialities must be between 3 and 7" })
  culinarySpecialties: string;

  @ApiProperty({ description: 'Pricing per hour in Naira', example: 50 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricingPerHour: number;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'URL of the profile picture' })
  profilePicture: string;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'URL of the cover photo' })
  coverPhoto: string;
}

export class UpdateChefDto {
  @ApiPropertyOptional({ description: 'Address entered by the agent' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @ValidateIf(o => o.address !== undefined)
  @IsString()
  @IsNotEmpty()
  address?: string;

  @ApiPropertyOptional({ description: 'Full name of the chef', example: 'John Doe' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: 'ChIJd8BlQ2BZwokRAFUEcm_qrcA' })
  @IsString()
  @IsOptional()
  placeId?: string;

  @ApiPropertyOptional({ description: 'Short bio of the chef', example: 'Award-winning chef with 10 years of experience.' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ description: 'Detailed description about the chef', example: 'Specializes in Italian and French cuisine.' })
  @IsString()
  @IsOptional()
  about?: string;

  @ApiPropertyOptional({ description: 'Culinary specialties of the chef', example: ['Italian Cuisine', 'French Cuisine'], type: [String] })
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value.map(v => v.trim());
    if (typeof value === 'string') return value.split(',').map(v => v.trim());
    return [];
  })
  @IsArray()
  @IsOptional()
  @ArrayMinSize(3, { message: 'Culinary Specialities must be between 3 and 7' })
  @ArrayMaxSize(5, { message: 'Culinary Specialities must be between 3 and 7' })
  culinarySpecialties?: string[];

  @ApiPropertyOptional({ description: 'Pricing per hour in Naira', example: 50 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  pricingPerHour?: number;

  @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'URL of the profile picture' })
  @IsOptional()
  profilePicture?: string;

  @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'URL of the cover photo' })
  @IsOptional()
  coverPhoto?: string;
}
export class SearchChefDto {
  @ApiProperty({ required: false, type: String, description: 'Search term that matches chef name or address' })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiProperty({ required: false, type: [String], description: 'Culinary specialties of the chef' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  culinarySpecialties?: string[];

  @ApiProperty({ required: false, type: Number, description: 'Minimum price of the chef\'s services' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiProperty({ required: false, type: Number, description: 'Maximum price of the chef\'s services' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiProperty({ required: false, type: Number, description: 'Latitude of the chef\'s location' })
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @ApiProperty({ required: false, type: Number, description: 'Longitude of the chef\'s location' })
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  lng?: number;

  @ApiProperty({ required: false, type: Number, description: 'Radius for searching chefs' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radius?: number;

  @ApiProperty({ required: false, type: Number, description: 'Page number for pagination' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiProperty({ required: false, type: Number, description: 'Number of items per page for pagination' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
export class UpdateChefStatusDto {
  @ApiProperty({
    description: 'New status for this chef: approved or cancelled',
    enum: ServiceStatus,
    example: ServiceStatus.APPROVED,
  })
  @IsEnum(ServiceStatus)
  @IsNotEmpty()
  status: ServiceStatus;
}

export class ObjectIdParamDto {
  @ApiProperty({
    description: 'The ID of the chef',
    type: String,
    example: '60f6f92b9e7a5e3a5c3f4b1c'
  })
  @IsMongoId()
  id: Types.ObjectId;
}
export class UpdateChefRatingDto {
  @ApiProperty({
    description: 'Updated numeric rating (1–5)',
    example: 4,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({
    description: 'Updated review text',
    example: 'Changed my mind — the service was great, but delivery took a bit long.',
    required: false,
  })
  @IsOptional()
  @IsString()
  review?: string;
}

export class CreateChefRatingDto {
    @ApiProperty({
    description: 'The numeric rating given to the chef (1–5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'An optional review message for the chef',
    example: 'The chef was punctual, creative, and the food was exceptional!',
    required: false,
  })
  @IsOptional()
  @IsString()
  review?: string;
}

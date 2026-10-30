import { ApiProperty, ApiPropertyOptional, OmitType, PickType } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from "class-validator";
import parsePhoneNumberFromString from "libphonenumber-js";
import { IsPhoneNumber } from "src/common/validators/phone-number.validator";
import { Roles } from "src/common/constants/enum";
import { IsEnum } from "class-validator";
import { KycStatus } from "src/common/constants/enum";


export class CreateUserDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastname: string;

  @ApiProperty({ example: 'johndoe@example.com', required: false })
  @IsNotEmpty()
  @ValidateIf(o => o.email !== '')
  @Transform(({ value }) => typeof value === "string" ? value.trim().toLowerCase() : value)
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+2348123456789' })
  @IsPhoneNumber({ message: 'Phone number must be valid' })
  @Transform(({ value }) => {
    // Validation must handle omitted/non-string input as a client error.  Passing
    // it directly to libphonenumber can throw before Nest has a chance to return
    // its normal 400 response.
    if (typeof value !== 'string') return value;
    const phone = parsePhoneNumberFromString(value, 'NG');
    return phone ? phone.number : value;
  })
  phoneNumber: string;

  @ApiProperty({ example: 'StrongPassword123@' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstname?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastname?: string;

  @ApiPropertyOptional({ example: '+2348123456789' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

export class LoginUserDto extends PickType(CreateUserDto, ['email', 'password'] as const) {
  @ApiProperty({ example: 'user' })
  @IsOptional()
  @IsEnum(Roles)
  expectedRole?: Roles;
}
export class ForgotPasswordResetDto {
  @ApiProperty({ example: 'johndoe@example.com' })
  @Transform(({ value }) => typeof value === "string" ? value.trim().toLowerCase() : value)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'NewStrongPassword123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}
export class UpdatePasswordDto {
  @IsString()
  @MinLength(6)
  oldPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
export class UpdateProfilePicture {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' }, description: 'URL of the profile picture' })
  profilePicture: string;
}
export class VerifyNinSelfieDto {
  @ApiProperty({ example: '70123456789', description: 'User NIN' })
  @IsString()
  nin: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Selfie image file',
  })
  selfie: any;
}

export class UpdateDeviceTokenAndNotificationDto {
  @ApiPropertyOptional({
    description: 'Device token from mobile device (FCM or APNs)',
    example: 'fcm_token_1234567890',
  })
  @IsOptional()
  @IsString()
  deviceToken: string;

  @ApiProperty({
    description: 'Enable or disable notifications',
    example: true,
  })
  @IsBoolean()
  enable: boolean;
}

export class DeleteAccountDto {
  @ApiProperty({ example: 'StrongPassword123@', description: 'Password to confirm account deletion' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SocialLoginDto {
  @ApiProperty({ enum: ['google', 'apple'], example: 'google' })
  @IsIn(['google', 'apple'])
  provider: 'google' | 'apple';

  @ApiProperty({ description: 'Google or Apple identity token' })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiPropertyOptional({ example: 'Ada' })
  @IsOptional()
  @IsString()
  firstname?: string;

  @ApiPropertyOptional({ example: 'Lovelace' })
  @IsOptional()
  @IsString()
  lastname?: string;
}

export class UpdateKycStatusDto {
  @ApiProperty({ example: KycStatus.VERIFIED, enum: KycStatus })
  @IsEnum(KycStatus)
  kycStatus: KycStatus;
}

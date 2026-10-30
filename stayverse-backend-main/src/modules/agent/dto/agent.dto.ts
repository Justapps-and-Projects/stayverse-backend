import { Transform } from "class-transformer";
import { ApiProperty, PickType } from "@nestjs/swagger";
import { IsEnum, IsEmail, IsNotEmpty, IsString, MinLength, Matches, IsOptional, isEnum } from "class-validator";
import { CreateUserDto } from "../../user/dto/user.dto"
import { ServiceType } from "src/common/constants/enum";


export class CreateAgentDto extends PickType(CreateUserDto, [
    'firstname',
    'lastname',
    'email',
    'phoneNumber',
    'password'
] as const) {
    @ApiProperty({ example: ServiceType.APARTMENT, enum: ServiceType })
    @IsEnum(ServiceType)
    serviceType: ServiceType
}
export class LoginAgentDto extends PickType(CreateUserDto, ['email', 'password'] as const) { }


export class ForgotPasswordResetDto {
    @ApiProperty({ example: 'johndoe@example.com' })
    @Transform(({ value }) => typeof value === "string" ? value.trim().toLowerCase() : value)
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'NewStrongPassword123!' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{6}$/)
    otp: string;
}

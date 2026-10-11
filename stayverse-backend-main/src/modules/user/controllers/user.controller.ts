import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard, Public } from '../../../common/guards/auth.guard';
import { UserService } from '../services/user.service';
import {
  CreateUserDto,
  DeleteAccountDto,
  ForgotPasswordResetDto,
  LoginUserDto,
  SocialLoginDto,
  UpdateKycStatusDto,
  UpdateDeviceTokenAndNotificationDto,
  UpdatePasswordDto,
  UpdateProfilePicture,
  UpdateUserDto,
  VerifyNinSelfieDto,
} from '../dto/user.dto';
import { VerifyEmailTokenDto } from '../../../common/dtos/verify-email-token.dto';
import { ResendVerificationEmailDto } from '../../../common/dtos/resend-verification-email.dto';
import { Role, RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/constants/enum';
import { FilterUsersDto } from '../dto/filter-users.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadPipe } from 'src/common/pipes/file-upload.pipe';
import { AuthenticatedRequest } from 'src/common/types/app.interface';
import { DOUploadService } from 'src/common/providers/digiital-ocean.service';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(RolesGuard, AuthGuard)
export class UserController {
  constructor(
    private readonly usersService: UserService,
    private readonly uploadService: DOUploadService

  ) { }

  /**
   * Public Endpoints
   */

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    example: { message: 'User created successfully' },
  })
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.register(createUserDto);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  async updateProfile(@Req() req, @Body() dto: UpdateUserDto) {
    const userId = req.user.sub;
    return await this.usersService.updateProfile(userId, dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    example: {
      access_token: 'jwt_token_here',
      isEmailVerified: true,
      user: {
        _id: 'user_id',
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
      },
    },
  })
  async login(@Body() loginDto: LoginUserDto) {
    return await this.usersService.login(loginDto.email, loginDto.password, loginDto.expectedRole);
  }

  @Public()
  @Post('auth/social')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in with Google or Apple' })
  @ApiBody({ type: SocialLoginDto })
  async socialLogin(@Body() dto: SocialLoginDto) {
    return await this.usersService.loginWithSocial(dto);
  }

  @Role(Roles.USER)
  @Put('update-password')
  @ApiOperation({
    summary: 'Update password',
    description: 'Allows an authenticated user to change their password by providing the current and new passwords.',
  })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully',
    example: { message: 'Password updated successfully' },
  })
  @ApiResponse({ status: 400, description: 'Invalid password or other error' })
  async updatePassword(@Req() req, @Body() dto: UpdatePasswordDto) {
    return await this.usersService.updatePassword(req.user.sub, dto.oldPassword, dto.newPassword);
  }

  @Public()
  @Get('request-forgot-password/:email')
  @ApiOperation({ summary: 'Request password reset (Forgot Password)' })
  @ApiParam({
    name: 'email',
    required: true,
    description: 'User email address',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    example: 'OTP sent successfully',
  })
  async requestForgotPassword(@Param('email') email: string) {
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format.');
    }
    return await this.usersService.forgotPassword(email);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Reset password (for users who forgot their password)',
  })
  @ApiBody({ type: ForgotPasswordResetDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    example: 'Password reset successful',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordResetDto) {
    return await this.usersService.resetForgottenPassword(
      forgotPasswordDto.email,
      forgotPasswordDto,
    );
  }

  @Public()
  @Post('verify-token')
  @ApiOperation({ summary: 'Verify email token' })
  @ApiBody({ type: VerifyEmailTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token verified successfully',
    example: 'Email OTP verified successfully',
  })
  async verifyEmailToken(@Body() verifyEmailTokenDto: VerifyEmailTokenDto) {
    return await this.usersService.verifyEmailToken(
      verifyEmailTokenDto.email,
      verifyEmailTokenDto.otp,
    );
  }
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update user profile picture' })
  @ApiBody({
    description: 'Upload a new profile picture',
    type: UpdateProfilePicture,
  })
  @Patch('profile-picture')
  @UseInterceptors(FileInterceptor('profilePicture'))
  async updateProfilePicture(
    @Body() updateProfilePicture: UpdateProfilePicture,
    @Req() req,
    @UploadedFile(new FileUploadPipe()) file: Express.Multer.File
  ) {
    const userId = req.user.sub;

    if (!file) {
      throw new BadRequestException('Profile picture is required.');
    }

    const uploadedUrl = await this.uploadService.uploadFile(file, 'users');

    updateProfilePicture.profilePicture = uploadedUrl;

    return this.usersService.updateProfilePicture(userId, updateProfilePicture);
  }

  @Public()
  @Post('send-token')
  @ApiOperation({ summary: 'Resend verification token' })
  @ApiBody({ type: ResendVerificationEmailDto })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    example: { message: 'Verification pin sent successfully.' },
  })
  async sendTokenPost(@Body() dto: ResendVerificationEmailDto) {
    return this.resendVerificationToken(dto.email);
  }

  @Public()
  @Get('send-token/:email')
  @ApiOperation({ summary: 'Resend verification token (legacy)' })
  @ApiParam({
    name: 'email',
    required: true,
    description: 'User email address',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    example: { message: 'Verification pin sent successfully.' },
  })
  async sendToken(@Param('email') email: string) {
    return this.resendVerificationToken(email);
  }

  private async resendVerificationToken(email: string) {
    if (!this.isValidEmail(email)) {
      throw new BadRequestException('Invalid email format.');
    }

    const result = await this.usersService.resendVerificationPin(email);
    return {
      message: result.emailDelivered
        ? 'Verification pin sent successfully.'
        : 'Verification code generated. Check your email or use the code provided in the app.',
      emailDelivered: result.emailDelivered,
      otp: result.otp,
    };
  }

  @Get('all')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(Roles.ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of users',
  })
  async findAllUsers(@Query() query: FilterUsersDto) {
    return await this.usersService.findAllUsers(query);
  }

  @Get('me')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(Roles.USER, Roles.ADMIN)
  @ApiOperation({ summary: 'Get current user profile' })
  async getCurrentUser(@Req() req) {
    return await this.usersService.getUserProfile(req.user.sub);

  }
  @Post('kyc')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(Roles.USER, Roles.ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: VerifyNinSelfieDto })
  @UseInterceptors(FileInterceptor('selfie'))
  async verifyNinSelfie(
    @Req() req: AuthenticatedRequest,
    @Body() body: Omit<VerifyNinSelfieDto, 'selfie'>,
    @UploadedFile() selfie: Express.Multer.File,
  ) {
    if (!selfie) {
      throw new BadRequestException('Selfie is required');
    }

    const base64Photo = Buffer.from(selfie.buffer).toString('base64');
    const dto = {
      nin: body.nin,
      selfie: `data:${selfie.mimetype};base64,${base64Photo}`,
    };
    return this.usersService.verifyNinAndSelfie(req.user.sub, dto);
  }

  @Patch('notifications/device-token')
  @Role(Roles.USER)
  @ApiOperation({ summary: 'Enable or disable notifications with device token' })
  @ApiBody({ type: UpdateDeviceTokenAndNotificationDto })
  @ApiResponse({ status: 200, description: 'Notification preference updated successfully' })
  async updateNotificationPreference(
    @Req() req,
    @Body() dto: UpdateDeviceTokenAndNotificationDto,
  ) {
    return await this.usersService.updateNotificationPreference(req.user.sub, dto);
  }

  @Delete('me')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(Roles.USER)
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiBody({ type: DeleteAccountDto })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  async deleteMyAccount(@Req() req, @Body() dto: DeleteAccountDto) {
    return await this.usersService.softDeleteAccount(req.user.sub, dto.password);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(Roles.ADMIN)
  @ApiOperation({ summary: 'Delete a user account by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID to delete' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  async deleteUser(@Param('id') userId: string) {
    return await this.usersService.softDeleteAccount(userId);
  }

  @Patch(':id/kyc-status')
  @UseGuards(AuthGuard, RolesGuard)
  @Role(Roles.ADMIN)
  @ApiOperation({ summary: 'Admin update user or agent KYC status' })
  @ApiParam({ name: 'id', description: 'User ID (for user or agent profile owner)' })
  async updateKycStatus(
    @Param('id') userId: string,
    @Body() dto: UpdateKycStatusDto,
  ) {
    return await this.usersService.adminUpdateKycStatus(userId, dto.kycStatus);
  }



  /**
   * Utility Method
   */
  private isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}

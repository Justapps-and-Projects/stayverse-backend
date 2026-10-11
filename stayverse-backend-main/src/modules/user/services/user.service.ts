import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { randomInt, randomBytes } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../schemas/user.schema';
import { Booking, BookingDocument } from '../../booking/schemas/booking.schema';
import { CreateUserDto, ForgotPasswordResetDto, SocialLoginDto, UpdateDeviceTokenAndNotificationDto, UpdateProfilePicture, UpdateUserDto, VerifyNinSelfieDto } from '../dto/user.dto';
import { verifySocialIdentity } from 'src/common/providers/social-token.util';
import { JwtPayloadDto } from '../../../common/dtos/jwt-payload.dto';
import { OtpService } from 'src/common/providers/otp.service';
import { BookingStatus, EmailType, KycStatus, OTP_MINUTES, Roles } from 'src/common/constants/enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { toObjectId } from 'src/common/utils/objectId.utils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { paginate } from 'src/common/utils/pagination.utils';
import { FilterUsersDto } from '../dto/filter-users.dto';
import { StreamChat } from "stream-chat";
import { STREAM_CLIENT } from 'src/common/providers/stream.provider';
import { DojahService } from 'src/common/providers/dojah.service';


dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = 'Africa/Lagos';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @Inject(STREAM_CLIENT) private readonly streamClient: StreamChat,
    private otpService: OtpService,
    private readonly dojahService: DojahService,
    private jwtService: JwtService,
    private eventEmitter: EventEmitter2
  ) { }

  async findbyId(userId: string, options?: { select?: string; extraFields?: string }) {
    const selectFields = options?.select ?? `firstname lastname email phoneNumber isEmailVerified ${options?.extraFields ?? ''} `;
    return await this.userModel.findById(userId).select(selectFields).lean({ virtuals: true });
  }
  async getUserProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userModel
      .findById(userId)
      .select(
        'firstname lastname email phoneNumber profilePicture balance customerCode role socketId lastSeenAt notificationsEnabled',
      )
      .lean();

    if (!user) {
      throw new BadRequestException('User not found!');
    }

    return user;
  }
  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.userModel.findOne({
      $or: [{ email: createUserDto.email }, { phoneNumber: createUserDto.phoneNumber }]
    });
    if (existingUser) throw new BadRequestException('User with this email or phone number already exists');

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const newUser = new this.userModel({ ...createUserDto, passwordHash });

    await newUser.save();

    const response = await this.otpService.sendEmailMessage(
      createUserDto.email,
      createUserDto.firstname,
      EmailType.EMAIL_VERIFICATION,
    );
    if (!response.status) {
      await this.userModel.deleteOne({ _id: newUser._id });
      this.logger.error(`Verification email failed for ${createUserDto.email}`);
      throw new InternalServerErrorException(
        'Unable to send verification email. Please check your email address and try again.',
      );
    }

    newUser.otp = response.otp;
    newUser.pinExpires = dayjs().tz(TIMEZONE).add(OTP_MINUTES, 'minute').toDate();
    await newUser.save();

    const chatToken = this.streamClient.createToken(newUser._id.toString());
    return {
      message: 'User created successfully',
      chatToken,
      otp: response.emailDelivered ? undefined : response.otp,
      emailDelivered: response.emailDelivered ?? false,
    };
  }

  async login(email: string, password: string, expectedRole?: Roles) {
    const user = await this.userModel
      .findOne({ email })
      .select('+passwordHash +balance +otp +pinExpires +notificationsEnabled');

    if (!user) throw new BadRequestException('User not found!');

    if (![Roles.ADMIN, Roles.USER].includes(user.role)) {
      throw new UnauthorizedException('This account is not authorized to access the system');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isEmailVerified) {
      const response = await this.otpService.sendEmailMessage(
        user.email,
        user.firstname,
        EmailType.EMAIL_VERIFICATION,
      );
      if (response.status) {
        user.otp = response.otp;
        user.pinExpires = dayjs().tz(TIMEZONE).add(OTP_MINUTES, 'minute').toDate();
        await user.save();
      } else {
        this.logger.warn(`Failed to resend verification email to ${user.email}`);
      }
      return {
        access_token: null,
        isEmailVerified: false,
        user: null,
      };
    }

    if (expectedRole && user.role !== expectedRole) {
      throw new UnauthorizedException(
        `This account is not authorized to access the ${expectedRole} area`,
      );
    }

    const jwtPayload: JwtPayloadDto = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
      serviceType: null,
    };
    const token = this.jwtService.sign(jwtPayload);
    const chatToken = this.streamClient.createToken(user._id.toString());

    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.otp;

    return { access_token: token, isEmailVerified: true, user: userObj, chatToken };
  }

  async loginWithSocial(dto: SocialLoginDto) {
    const identity = await verifySocialIdentity(dto.provider, dto.idToken);
    let user = await this.userModel
      .findOne({ email: identity.email })
      .select('+passwordHash +balance +otp +pinExpires +notificationsEnabled');

    if (user && ![Roles.ADMIN, Roles.USER].includes(user.role)) {
      throw new BadRequestException('This email belongs to an agent account. Open the agent app.');
    }

    if (!user) {
      const passwordHash = await bcrypt.hash(randomBytes(24).toString('hex'), 10);
      const created = await this.userModel.create({
        firstname: (dto.firstname || identity.givenName || 'Stayverse').trim(),
        lastname: (dto.lastname || identity.familyName || 'User').trim(),
        email: identity.email,
        phoneNumber: `080${randomInt(10000000, 99999999)}`,
        passwordHash,
        isEmailVerified: true,
        role: Roles.USER,
      });
      user = await this.userModel
        .findById(created._id)
        .select('+passwordHash +balance +otp +pinExpires +notificationsEnabled');
    }

    if (!user) throw new BadRequestException('User not found!');

    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      user.otp = null;
      user.pinExpires = null;
      await user.save();
    }

    const jwtPayload: JwtPayloadDto = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
      serviceType: null,
    };
    const token = this.jwtService.sign(jwtPayload);
    const chatToken = this.streamClient.createToken(user._id.toString());
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.otp;

    return { access_token: token, isEmailVerified: true, user: userObj, chatToken };
  }

  async verifyNinAndSelfie(userId: string, dto) {
    const response = await this.dojahService.verifyNinWithSelfie(dto.nin, dto.selfie);

    const verifiedData = response.entity;
    if (
      verifiedData.nin !== dto.nin ||
      (dto.firstName && verifiedData.first_name?.toLowerCase() !== dto.firstName.toLowerCase()) ||
      (dto.lastName && verifiedData.last_name?.toLowerCase() !== dto.lastName.toLowerCase())
    ) {
      throw new BadRequestException('User input does not match NIN records');
    }
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        kycStatus: KycStatus.VERIFIED,
        first_name: verifiedData.first_name,
        last_name: verifiedData.last_name,
      },
      { new: true },
    );
  }

  async adminUpdateKycStatus(userId: string, kycStatus: KycStatus) {
    const user = await this.userModel.findById(toObjectId(userId));
    if (!user) throw new BadRequestException('User not found');

    if (![Roles.USER, Roles.AGENT].includes(user.role)) {
      throw new BadRequestException('KYC status can only be updated for users or agents');
    }

    user.kycStatus = kycStatus;
    await user.save();

    const { passwordHash, otp, pinExpires, ...userObj } = user.toObject();
    return { message: 'KYC status updated successfully', user: userObj };
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    Object.assign(user, dto);
    await user.save();

    const { passwordHash, otp, pinExpires, ...userObj } = user.toObject();
    return { message: 'Profile updated successfully', user: userObj };
  }

  async verifyEmailToken(email: string, otp: string) {
    const user = await this.userModel.findOne({ email }).select('+otp +pinExpires');
    if (!user) throw new BadRequestException('User with this email not found!');
    if (user.isEmailVerified) throw new BadRequestException('User is already verified.');
    if (user.otp !== otp) throw new BadRequestException('Invalid OTP!');
    if (!user.pinExpires || dayjs().tz(TIMEZONE).isAfter(dayjs(user.pinExpires))) {
      throw new BadRequestException('OTP has expired!');
    }

    user.isEmailVerified = true;
    user.otp = null;
    user.pinExpires = null;
    await user.save();

    this.eventEmitter.emit('user.verified', { email: user.email, name: user.firstname });

    return 'Email OTP verified successfully';
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await this.userModel.findOne({ email }).select('+otp +pinExpires');;
    if (!user) throw new BadRequestException('User not found!');

    const response = await this.otpService.sendEmailMessage(user.email, user.firstname, EmailType.RESET_PASSWORD);
    if (!response.status) {
      throw new InternalServerErrorException(
        'Failed to send password reset email. Please try again later.',
      );
    }

    user.otp = response.otp;
    user.pinExpires = dayjs().tz(TIMEZONE).add(OTP_MINUTES, 'minute').toDate();
    await user.save();

    return 'OTP sent successfully';
  }

  async resetForgottenPassword(email: string, forgotPasswordDto: ForgotPasswordResetDto): Promise<string> {
    const user = (await this.userModel.findOne({ email }).select('+passwordHash +pinExpires +otp'));
    if (!user) throw new BadRequestException('User not found!');

    if (!user.otp || user.otp !== forgotPasswordDto.otp) {
      throw new BadRequestException('Invalid OTP!');
    }

    if (user.pinExpires && dayjs().tz(TIMEZONE).isAfter(dayjs(user.pinExpires))) {
      throw new BadRequestException('OTP has expired!');
    }

    user.passwordHash = await bcrypt.hash(forgotPasswordDto.password, 10);
    user.otp = null;
    user.pinExpires = null;
    await user.save();

    return 'Password reset successful';
  }

  async resendVerificationPin(email: string) {
    const user = await this.userModel.findOne({ email }).select('+otp +pinExpires');
    if (!user) throw new BadRequestException('User with this email not found!');
    if (user.isEmailVerified) throw new BadRequestException('User is already verified.');

    const response = await this.otpService.sendEmailMessage(
      email,
      user.firstname,
      EmailType.EMAIL_VERIFICATION,
    );
    if (!response.status) {
      this.logger.error(`Failed to resend verification email to ${email}`);
      throw new InternalServerErrorException(
        'Failed to send verification email. Please try again later.',
      );
    }

    user.otp = response.otp;
    user.pinExpires = dayjs().tz(TIMEZONE).add(OTP_MINUTES, 'minute').toDate();
    await user.save();
    return {
      emailDelivered: response.emailDelivered ?? false,
      otp: response.emailDelivered ? undefined : response.otp,
    };
  }

  async updatePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userModel.findOne({ _id: toObjectId(userId), role: Roles.USER }).select('+passwordHash');
    if (!user) throw new BadRequestException('Agent not found!');

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) throw new BadRequestException('Old password is incorrect');

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newPasswordHash;
    await user.save();

    return { message: 'Password updated successfully' };
  }

  async findAllUsers(query: FilterUsersDto) {
    const filter: any = { role: Roles.USER };
    if (query.searchTerm) {
      filter.$or = [
        { firstname: { $regex: query.searchTerm, $options: 'i' } },
        { lastname: { $regex: query.searchTerm, $options: 'i' } },
        { email: { $regex: query.searchTerm, $options: 'i' } },
        { phoneNumber: { $regex: query.searchTerm, $options: 'i' } },
      ];
    }
    if (query.isEmailVerified) filter.isEmailVerified = query.isEmailVerified === 'true';
    if (query.role) filter.role = query.role;
    return paginate({
      model: this.userModel,
      filter,
      params: query,
      select: '-passwordHash -otp -pinExpires -__v -updatedAt',
    })
  }
  async findBySocketId(socketId: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ socketId }).exec();
  }
  async updateProfilePicture(userId: string, dto: UpdateProfilePicture) {
    return await this.userModel.findByIdAndUpdate(
      { _id: userId },
      { profilePicture: dto.profilePicture },
      { new: true }
    );
  }
  async updateSocketId(userId: string, socketId: string): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { socketId }).exec();
  }

  async clearSocketId(userId: string | Types.ObjectId): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { socketId: null }).exec();
  }

  async getSocketId(userId: string | Types.ObjectId): Promise<string | null> {
    const user = await this.userModel.findById(userId).exec();
    return user?.socketId || null;
  }
  async updateLastSeen(userId: string, timestamp: Date): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { lastSeen: timestamp } }
    );
  }

  async updateNotificationPreference(userId: string, dto: UpdateDeviceTokenAndNotificationDto) {
    const { enable, deviceToken } = dto;

    const update: {
      $set: { notificationsEnabled: boolean; deviceToken?: string };
      $unset?: { deviceToken: string };
    } = {
      $set: { notificationsEnabled: enable },
    };

    if (enable && deviceToken) {
      update.$set.deviceToken = deviceToken;
    }
    if (!enable) {
      update.$unset = { deviceToken: '' };
    }

    const user = await this.userModel.findByIdAndUpdate(userId, update, { new: true }).select('email deviceToken notificationsEnabled');

    if (!user) throw new BadRequestException('User not found');

    return `Notifications ${enable ? 'enabled' : 'disabled'} successfully`;
  }

  async getAdminEarnings() {
    const admin = await this.userModel
      .findOne({ role: Roles.ADMIN })
      .select('+balance')
      .lean();

    if (!admin) throw new BadRequestException('Admin account not found');

    return admin.balance;
  }


  async softDeleteAccount(userId: string, password?: string) {
    const user = await this.userModel.findById(userId).select('+passwordHash');
    if (!user) throw new BadRequestException('User not found');

    if (password) {
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) throw new UnauthorizedException('Invalid password');
    }

    const activeBookingQuery = {
      status: { $in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] }
    };

    // Check if user has active bookings as a customer
    const activeCustomerBookings = await this.bookingModel.countDocuments({
      userId: user._id,
      ...activeBookingQuery
    });

    if (activeCustomerBookings > 0) {
      throw new BadRequestException('Cannot delete account. You have active bookings in progress.');
    }

    user.isDeleted = true;
    await user.save();

    return { message: 'Account deleted successfully' };
  }
}

import { emailIdentity } from '../../../common/providers/email-identity';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { Agent, AgentDocument } from '../schemas/agent.schema';
import { CreateAgentDto } from '../dto/agent.dto';
import { JwtPayloadDto } from '../../../common/dtos/jwt-payload.dto';
import { OtpService } from 'src/common/providers/otp.service';
import { BookingStatus, EmailType, FavoriteStatus, OTP_MINUTES, Roles, ServiceStatus, ServiceType, TIMEZONE } from 'src/common/constants/enum';
import { toObjectId } from '../../../common/utils/objectId.utils';
import { EventEmitter2 } from '@nestjs/event-emitter';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { paginate, PaginatedResult, PaginateOptions } from 'src/common/utils/pagination.utils';
import { FilterAgentsDto } from '../dto/filter-agents.dto';
import { Booking, BookingDocument } from 'src/modules/booking/schemas/booking.schema';
import { Favorite, FavoriteDocument } from 'src/modules/favorite/schemas/favorite.schema';
import { Apartment, ApartmentDocument } from 'src/modules/apartment/schemas/apartment.schema';
import { Ride, RideDocument } from 'src/modules/rides/schemas/rides.schema';
import { GetAgentRidesDto } from '../dto/get-agent-rides.dto';
import { GetAgentApartmentsDto } from '../dto/get-agent-apartments.dto';
import { StreamChat } from "stream-chat";
import { STREAM_CLIENT } from 'src/common/providers/stream.provider';
import { Service } from 'aws-sdk';
import { Chef, ChefDocument } from 'src/modules/chef/schemas/chef.schema';
import { SocialLoginDto, UpdateUserDto } from 'src/modules/user/dto/user.dto';
import { verifySocialIdentity } from 'src/common/providers/social-token.util';

dayjs.extend(utc);
dayjs.extend(timezone);

interface ResetPasswordProps {
  email: string;
  otp: string;
  password: string;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);


  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Agent.name) private agentModel: Model<AgentDocument>,
    @InjectModel(Apartment.name) private apartmentModel: Model<ApartmentDocument>,
    @InjectModel(Ride.name) private rideModel: Model<RideDocument>,
    @InjectModel(Chef.name) private cheModel: Model<ChefDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Favorite.name) private favoriteModel: Model<FavoriteDocument>,
    @Inject(STREAM_CLIENT) private readonly streamClient: StreamChat,
    private otpService: OtpService,
    private jwtService: JwtService,
    private eventEmitter: EventEmitter2
  ) { }

  async findbyId(agentId: string) {
    const agent = await this.agentModel
      .findById(toObjectId(agentId))
      .populate({
        path: 'userId',
        select: 'firstname lastname email phoneNumber isEmailVerified',
      })
      .lean();

    if (!agent) throw new BadRequestException('Agent not found!');
    return agent;
  }

  async getAgentProfile(agentId: string) {
    return this.findbyId(agentId);
  }

  async register(createAgentDto: CreateAgentDto) {
    const existingUser = await this.userModel.findOne({
      $or: [
        { email: emailIdentity(createAgentDto.email) },
        { phoneNumber: createAgentDto.phoneNumber },
      ],
    });

    if (existingUser)
      throw new BadRequestException(
        existingUser.role === Roles.AGENT
          ? 'An agent account already uses this email or phone. Sign in or reset your password.'
          : 'This email or phone belongs to a customer account. Use different details for an agent account or contact support.',
      );

    const passwordHash = await bcrypt.hash(createAgentDto.password, 10);

    const newUser = new this.userModel({
      firstname: createAgentDto.firstname,
      lastname: createAgentDto.lastname,
      email: createAgentDto.email.trim().toLowerCase(),
      phoneNumber: createAgentDto.phoneNumber,
      passwordHash,
      role: Roles.AGENT,
    });

    await newUser.save();

    const newAgent = new this.agentModel({
      userId: newUser._id,
      serviceType: createAgentDto.serviceType,
    });
    try {
      await newAgent.save();
    } catch (error) {
      await this.userModel.deleteOne({ _id: newUser._id });
      throw error;
    }
    const chatToken = this.streamClient.createToken(newAgent._id.toString())

    const response = await this.otpService.sendEmailMessage(
      createAgentDto.email,
      createAgentDto.firstname,
      EmailType.EMAIL_VERIFICATION,
    );
    // A delivery outage must not discard an account that was created safely.
    // OtpService supplies a short-lived fallback OTP for the client when email
    // delivery is unavailable, matching the user-account registration flow.
    if (!response.status) {
      await this.agentModel.deleteOne({ _id: newAgent._id });
      await this.userModel.deleteOne({ _id: newUser._id });
      throw new InternalServerErrorException(
        'Unable to send verification email. Please check your email address and try again.',
      );
    }

    newUser.otp = response.otp;
    newUser.otpPurpose = EmailType.EMAIL_VERIFICATION;
    newUser.pinExpires = dayjs().tz(TIMEZONE).add(OTP_MINUTES, 'minute').toDate();
    await newUser.save();

    return {
      message: 'Agent created successfully',
      chatToken,
      otp: response.emailDelivered ? undefined : response.otp,
      emailDelivered: response.emailDelivered ?? false,
    };
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('agent not found');

    Object.assign(user, dto);
    await user.save();

    const { passwordHash, otp, pinExpires, ...userObj } = user.toObject();
    return { message: 'Profile updated successfully', user: userObj };
  }

  async login(email: string, password: string) {
    const user = (await this.userModel.findOne({ email: emailIdentity(email), role: Roles.AGENT }).select('+passwordHash +balance +notificationsEnabled')) as UserDocument;

    if (!user) throw new BadRequestException('Agent not found!');

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials!');

    const agent = await this.agentModel.findOne({ userId: user._id });

    if (!agent) throw new BadRequestException('Agent profile not found or has been deleted');

    if (!user.isEmailVerified) {
      const response = await this.otpService.sendEmailMessage(
        user.email,
        user.firstname,
        EmailType.EMAIL_VERIFICATION,
      );
      if (response.status) {
        user.otp = response.otp;
        user.otpPurpose = EmailType.EMAIL_VERIFICATION;
        user.pinExpires = dayjs().tz(TIMEZONE).add(OTP_MINUTES, 'minute').toDate();
        await user.save();
      }
      return {
        access_token: null,
        isEmailVerified: false,
        user: null,
      };
    }

    const jwtPayload: JwtPayloadDto = {
      sub: String(user._id),
      agent: String(agent._id),
      email: user.email,
      role: user.role,
      serviceType: agent?.serviceType || null,
    };

    const token = this.jwtService.sign(jwtPayload);
    const chatToken = this.streamClient.createToken(agent._id.toString())
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.otp;

    return {
      access_token: token,
      chatToken,
      isEmailVerified: user.isEmailVerified,
      user: { ...userObj, agent: agent || null },
    };
  }

  async loginWithSocial(dto: SocialLoginDto) {
    const identity = await verifySocialIdentity(dto.provider, dto.idToken);
    const user = (await this.userModel
      .findOne({ email: emailIdentity(identity.email), role: Roles.AGENT })
      .select('+passwordHash +balance +notificationsEnabled')) as UserDocument;

    if (!user) {
      throw new BadRequestException('Agent not found! Sign up with this email first.');
    }

    const agent = await this.agentModel.findOne({ userId: user._id });
    if (!agent) throw new BadRequestException('Agent profile not found or has been deleted');

    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
    }

    const jwtPayload: JwtPayloadDto = {
      sub: String(user._id),
      agent: String(agent._id),
      email: user.email,
      role: user.role,
      serviceType: agent?.serviceType || null,
    };
    const token = this.jwtService.sign(jwtPayload);
    const chatToken = this.streamClient.createToken(agent._id.toString());
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.otp;

    return {
      access_token: token,
      chatToken,
      isEmailVerified: true,
      user: { ...userObj, agent: agent || null },
    };
  }

  async verifyEmailToken(email: string, otp: string) {
    const user = await this.userModel.findOne({ email: emailIdentity(email), role: Roles.AGENT }).select('+otp +pinExpires +otpPurpose');

    if (!user)
      throw new BadRequestException('Agent with this email not found!');
    if (user.isEmailVerified)
      throw new BadRequestException('Agent is already verified.');
    if (user.otpPurpose !== EmailType.EMAIL_VERIFICATION || user.otp !== otp) throw new BadRequestException('Invalid OTP!');
    if (!user.pinExpires || user.pinExpires < new Date())
      throw new BadRequestException('OTP has expired!');

    user.isEmailVerified = true;
    user.otp = null;
    user.otpPurpose = null;
    user.pinExpires = null;
    await user.save();

    this.eventEmitter.emit('user.verified', {
      email: user.email,
      name: user.firstname,
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email: emailIdentity(email), role: Roles.AGENT }).select('+otp +pinExpires +otpPurpose');

    if (!user) throw new BadRequestException('Agent not found!');

    const response = await this.otpService.sendEmailMessage(
      user.email,
      user.firstname,
      EmailType.RESET_PASSWORD,
    );

    if (!response.status || !response.emailDelivered) {
      throw new InternalServerErrorException(
        'Failed to send password reset email. Please try again later.',
      );
    }

    user.otp = response.otp;
    user.otpPurpose = EmailType.RESET_PASSWORD;
    user.pinExpires = dayjs().tz(TIMEZONE).add(10, 'minute').toDate();
    await user.save();

    return 'Reset password OTP sent successfully';
  }


  async resetForgottenPassword(props: ResetPasswordProps) {
    const { email, otp, password } = props;

    const user = await this.userModel.findOne({ email: emailIdentity(email), role: Roles.AGENT }).select('+passwordHash +otp +pinExpires +otpPurpose');

    if (!user) throw new BadRequestException('Agent not found!');

    if (user.otpPurpose !== EmailType.RESET_PASSWORD || !user.otp || user.otp !== otp || !user.pinExpires || user.pinExpires <= new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    user.passwordHash = passwordHash;
    user.otp = null;
    user.otpPurpose = null;
    user.pinExpires = null;

    await user.save();

    return 'Password reset successful';
  }

  async resendVerificationPin(email: string) {
    const user = await this.userModel.findOne({ email: emailIdentity(email), role: Roles.AGENT }).select('+otp +pinExpires +otpPurpose');

    if (!user)
      throw new BadRequestException('Agent with this email not found!');

    if (user.isEmailVerified)
      throw new BadRequestException('Agent is already verified.');

    const response = await this.otpService.sendEmailMessage(
      email,
      user.firstname,
      EmailType.EMAIL_VERIFICATION,
    );

    if (response.status) {
      user.otp = response.otp;
      user.otpPurpose = EmailType.EMAIL_VERIFICATION;
      user.pinExpires = dayjs().tz(TIMEZONE).add(OTP_MINUTES, 'minute').toDate();
      await user.save();
      return {
        message: 'Verification OTP resent successfully',
        emailDelivered: response.emailDelivered ?? false,
        otp: response.emailDelivered ? undefined : response.otp,
      };
    }

    throw new InternalServerErrorException(
      'Failed to resend verification OTP!',
    );
  }
  async updatePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userModel.findOne({ _id: toObjectId(userId), role: Roles.AGENT }).select('+passwordHash');

    if (!user) throw new BadRequestException('Agent not found!');

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) throw new BadRequestException('Old password is incorrect');

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = newPasswordHash;
    await user.save();

    return { message: 'Password updated successfully' };
  }

  async findAllAgents(query: FilterAgentsDto) {
    const filter: any = {};
    if (query.serviceType) filter.serviceType = query.serviceType;

    const paginationResult = await paginate({
      model: this.agentModel,
      filter,
      populate: [{ path: 'user' }],
      params: query,
      sort: { createdAt: -1 },
    });

    const agentIds = paginationResult.data.map((a: any) => a._id);

    const [totalBookings, completedBookings, earningsByAgent] = await Promise.all([
      this.bookingModel.aggregate([
        { $match: { agentId: { $in: agentIds } } },
        { $group: { _id: '$agentId', count: { $sum: 1 } } },
      ]),
      this.bookingModel.aggregate([
        { $match: { agentId: { $in: agentIds }, status: BookingStatus.COMPLETED } },
        { $group: { _id: '$agentId', count: { $sum: 1 } } },
      ]),
      this.bookingModel.aggregate([
        { $match: { agentId: { $in: agentIds }, status: BookingStatus.COMPLETED } },
        { $group: { _id: '$agentId', totalEarnings: { $sum: { $ifNull: ['$totalPrice', 0] } } } },
      ]),
    ]);

    const totalMap = new Map(totalBookings.map(x => [x._id.toString(), x.count]));
    const completedMap = new Map(completedBookings.map(x => [x._id.toString(), x.count]));
    const earningMap = new Map(
      earningsByAgent.map((x) => [x._id.toString(), x.totalEarnings || 0]),
    );

    paginationResult.data.forEach((agent: any) => {
      const id = agent._id.toString();
      agent.totalBookings = totalMap.get(id) || 0;
      agent.completedBookings = completedMap.get(id) || 0;
      agent.totalEarnings = earningMap.get(id) || 0;
    });

    let totalActive = 0;
    let totalInactive = 0;
    let serviceModel;

    if (query.serviceType === ServiceType.APARTMENT) serviceModel = this.apartmentModel;
    else if (query.serviceType === ServiceType.RIDE) serviceModel = this.rideModel;
    else if (query.serviceType === ServiceType.CHEF) serviceModel = this.cheModel;

    if (serviceModel) {
      const [totalCount, activeCount] = await Promise.all([
        serviceModel.countDocuments(),
        serviceModel.countDocuments({ status: ServiceStatus.APPROVED }),
      ]);

      totalActive = activeCount;
      totalInactive = totalCount - activeCount;
    }

    return {
      data: paginationResult.data,
      pagination: paginationResult.pagination,
      metadata: { totalActive, totalInactive },
    };
  }



  async findAgentApartments(agentId: string, query: GetAgentApartmentsDto): Promise<PaginatedResult<ApartmentDocument>> {
    const options: PaginateOptions<ApartmentDocument> = {
      model: this.apartmentModel,
      filter: {
        agentId: toObjectId(agentId),
        ...(query.status && { serviceStatus: query.status })
      },
      params: query,
      populate: [{ path: 'agent' }],
      sort: { createdAt: -1 }
    };

    return paginate(options);
  }

  async findAgentRides(agentId: string, query: GetAgentRidesDto): Promise<PaginatedResult<RideDocument>> {
    const options: PaginateOptions<RideDocument> = {
      model: this.rideModel,
      filter: {
        agentId: toObjectId(agentId),
        ...(query.status && { status: query.status })
      },
      params: query,
      populate: [{ path: 'agent' }],
      sort: { createdAt: -1 }
    };

    return paginate(options);
  }

  async currentUser(agentId: string) {
    const agent = await this.agentModel
      .findById(toObjectId(agentId))
      .populate({
        path: 'user',
        select: 'firstname lastname email phoneNumber profilePicture balance customerCode isEmailVerified role socketId lastSeenAt notificationsEnabled',
      })
      .sort({ createdAt: -1 });

    return agent;
  }

  async getAgentById(agentId: string) {
    const agent = await this.agentModel
      .findById(toObjectId(agentId))
      .populate({
        path: 'user',
        select:
          'firstname lastname email phoneNumber profilePicture balance isEmailVerified role',
      })
      .lean();

    if (!agent) throw new BadRequestException('Agent not found');

    const [completedBookings, completedDocs] = await Promise.all([
      this.bookingModel.countDocuments({ agentId, status: BookingStatus.COMPLETED }),
      this.bookingModel.find({ agentId, status: BookingStatus.COMPLETED }).lean(),
    ]);

    const totalEarnings = completedDocs.reduce(
      (sum, b) => sum + (b.totalPrice || 0),
      0
    );

    return {
      ...agent,
      completedBookings,
      totalEarnings,
    };
  }

  // get requested booking count ,
  // get accepted booking count ,
  // get favorite count ,
  //STEPS:
  //1. Check the github initial code
  //2. use the github initial code 
  async getAgentMetrics(agentId: string) {
    const now = dayjs();
    const weekStart = now.startOf('week').toDate();
    const monthStart = now.startOf('month').toDate();
    const yearStart = now.startOf('year').toDate();
    const agentObjectId = new Types.ObjectId(agentId);

    const [completed, pending, favorites, totalEarnings] = await Promise.all([
      this.getBookingCountByStatus(agentObjectId, BookingStatus.COMPLETED, {
        week: weekStart,
        month: monthStart,
        year: yearStart,
      }),
      this.getBookingCountByStatus(agentObjectId, BookingStatus.PENDING, {
        week: weekStart,
        month: monthStart,
        year: yearStart,
      }),
      this.getFavoriteCounts(agentObjectId, { week: weekStart, month: monthStart, year: yearStart }),
      this.getAgentEarnings(agentObjectId, { week: weekStart, month: monthStart, year: yearStart }),

    ]);

    return {
      bookings: completed,
      request: pending,
      favorites,
      earnings: totalEarnings
    };
  }

  async softDeleteAgent(agentId: string, password?: string) {
    const agent = await this.agentModel.findById(agentId);
    if (!agent) throw new BadRequestException('Agent profile not found');

    if (password) {
      const user = await this.userModel.findById(agent.userId).select('+passwordHash');
      if (!user) throw new BadRequestException('User not found');
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) throw new UnauthorizedException('Invalid password');
    }

    // Check active bookings where this agent is the provider
    const activeBookingQuery = {
      status: { $in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] }
    };

    const activeAgentBookings = await this.bookingModel.countDocuments({
      agentId: agent._id,
      ...activeBookingQuery
    });

    if (activeAgentBookings > 0) {
      throw new BadRequestException('Cannot delete agent profile. You have active service bookings pending completion.');
    }

    agent.isDeleted = true;
    await agent.save();

    return { message: 'Agent profile deleted successfully' };
  }

  private async getBookingCountByStatus(agentId: Types.ObjectId, status: string, dates: Record<string, Date>) {
    const data = await this.bookingModel.aggregate([
      {
        $match: {
          agentId,
          status,
          createdAt: { $gte: dates.year },
        },
      },
      {
        $facet: {
          week: [
            { $match: { createdAt: { $gte: dates.week } } },
            { $count: 'count' },
          ],
          month: [
            { $match: { createdAt: { $gte: dates.month } } },
            { $count: 'count' },
          ],
          year: [{ $count: 'count' }],
        },
      },
    ]);

    const result = data[0];

    return {
      week: result.week[0]?.count || 0,
      month: result.month[0]?.count || 0,
      year: result.year[0]?.count || 0,
    };
  }

  private async getAgentEarnings(agentId: Types.ObjectId, dates: Record<string, Date>) {
    const data = await this.bookingModel.aggregate([
      {
        $match: {
          agentId,
          status: BookingStatus.COMPLETED,
          createdAt: { $gte: dates.year },
        },
      },
      {
        $facet: {
          week: [
            { $match: { createdAt: { $gte: dates.week } } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } },
          ],
          month: [
            { $match: { createdAt: { $gte: dates.month } } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } },
          ],
          year: [
            { $group: { _id: null, total: { $sum: "$totalPrice" } } },
          ],
        },
      },
    ]);

    const result = data[0];

    return {
      week: result.week[0]?.total || 0,
      month: result.month[0]?.total || 0,
      year: result.year[0]?.total || 0,
    };
  }


  private async getFavoriteCounts(agentId: Types.ObjectId, dates: Record<string, Date>) {
    const data = await this.favoriteModel.aggregate([
      {
        $match: {
          agentId,
          status: FavoriteStatus.ACTIVE,
          createdAt: { $gte: dates.year },
        },
      },
      {
        $facet: {
          week: [
            { $match: { createdAt: { $gte: dates.week } } },
            { $count: 'likes' },
          ],
          month: [
            { $match: { createdAt: { $gte: dates.month } } },
            { $count: 'likes' },
          ],
          year: [{ $count: 'likes' }],
        },
      },
    ]);

    const result = data[0];

    return {
      week: result.week[0]?.likes || 0,
      month: result.month[0]?.likes || 0,
      year: result.year[0]?.likes || 0,
    };
  }


  async softDeleteAgentById(agentId: string) {
    const agent = await this.agentModel.findById(agentId);
    if (!agent) throw new BadRequestException('Agent profile not found');

    // Check active bookings where this agent is the provider
    const activeBookingQuery = {
      status: { $in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] }
    };

    const activeAgentBookings = await this.bookingModel.countDocuments({
      agentId: agent._id,
      ...activeBookingQuery
    });

    if (activeAgentBookings > 0) {
      throw new BadRequestException('Cannot delete agent profile. Agent has active service bookings pending completion.');
    }

    agent.isDeleted = true;
    await agent.save();

    return { message: 'Agent profile deleted successfully' };
  }
}

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { normalizeMediaUrl } from 'src/common/utils/media-url.utils';
import { Connection, Model, Types } from 'mongoose';
import dayjs from 'dayjs';
import tz from 'dayjs/plugin/timezone';

import { Chef, ChefDocument } from '../schemas/chef.schema';
import { Experience, ExperienceDocument } from '../schemas/experience.schema';
import { Certification, CertificationDocument } from '../schemas/certification.schema';

import { CreateChefDto, UpdateChefDto, SearchChefDto, ObjectIdParamDto, CreateChefRatingDto, UpdateChefRatingDto } from '../dto/chef.dto';
import { CreateExperienceDto } from '../dto/experience.dto';
import { CreateCertificationDtoo } from '../dto/certification.dto';

import { toObjectId } from 'src/common/utils/objectId.utils';
import { BookingStatus, EscrowStatus, PaymentStatus, PayoutType, ProposalStatus, ServiceStatus, ServiceType, TIMEZONE, TransactionPaymentStatus, TransactionType } from 'src/common/constants/enum';
import { GoogleMapsService } from 'src/common/providers/google-map.service';
import { Feature, FeatureDocument } from '../schemas/feaure.schema';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { GetAllChefsDto } from '../dto/get-all-chefs.dto';
import { paginate } from 'src/common/utils/pagination.utils';
import { stripEmptyFields } from 'src/common/utils/strip-empty-fields.utils';
import { ChefRating, ChefRatingDocument } from '../schemas/chef-rating.schema';
import { ChefProposal, ChefProposalDocument } from '../schemas/chef-proposal.schema';
import { CreateChefProposalDto, GetProposalsQueryDto, RespondChefProposalDto } from '../dto/chef-proposal.dto';
import { User, UserDocument } from 'src/modules/user/schemas/user.schema';
import { NotificationEvents } from 'src/modules/notification/event/notification.event';
import { Agent, AgentDocument } from 'src/modules/agent/schemas/agent.schema';
import { Booking, BookingDocument } from 'src/modules/booking/schemas/booking.schema';
import { PaymentEscrow } from 'src/modules/payments/schema/payment-escrow.schema';
import { PaymentTransaction, PaymentTransactionDocument } from 'src/modules/payments/schema/payment-transaction.schema';
import { generateTransactionReference } from 'src/common/utils/generate-transaction-ref.utils';



dayjs.extend(tz);

@Injectable()
export class ChefService {
  constructor(
    @InjectModel(Chef.name) private readonly chefModel: Model<ChefDocument>,
    @InjectModel(Experience.name) private readonly experienceModel: Model<ExperienceDocument>,
    @InjectModel(Certification.name) private readonly certificationModel: Model<CertificationDocument>,
    @InjectModel(Feature.name) private readonly featureModel: Model<FeatureDocument>,
    @InjectModel(ChefRating.name) private readonly ratingModel: Model<ChefRatingDocument>,
    @InjectModel(ChefProposal.name) private readonly proposalModel: Model<ChefProposalDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(PaymentEscrow.name) private readonly escrowModel: Model<PaymentEscrow>,
    @InjectModel(PaymentTransaction.name) private readonly txModel: Model<PaymentTransactionDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly notificationEvents: NotificationEvents,
    private readonly googleMapsService: GoogleMapsService,
    private readonly configService: ConfigService,
  ) { }

  private get cdnBase(): string {
    return this.configService.get<string>('do.cdnUrl') || '';
  }

  private withNormalizedChefImages<T extends { profilePicture?: string; coverPhoto?: string }>(chef: T): T {
    if (!chef) return chef;
    return {
      ...chef,
      ...(chef.profilePicture !== undefined && {
        profilePicture: normalizeMediaUrl(chef.profilePicture, this.cdnBase) ?? chef.profilePicture,
      }),
      ...(chef.coverPhoto !== undefined && {
        coverPhoto: normalizeMediaUrl(chef.coverPhoto, this.cdnBase) ?? chef.coverPhoto,
      }),
    };
  }

  private flattenAgent(chef: any) {
    if (chef.agent?.user) {
      const { user, ...agent } = chef.agent;
      // Provide an alias for the misspelled 'proilePicture' used in production mobile apps
      if (user.profilePicture) {
        user.proilePicture = user.profilePicture;
      }
      chef.agent = { ...agent, ...user, _id: agent._id };
    }
    return chef;
  }

  async create(dto: CreateChefDto, agentId: string): Promise<Chef> {
    const listingAddress = await this.googleMapsService.resolveListingAddress(dto);
    const chef = new this.chefModel({
      ...dto,
      ...listingAddress,
      _id: toObjectId(agentId),
      agentId: toObjectId(agentId)
    });
    return chef.save();
  }

  async getAll(query: PaginationQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 10);
    const skip = (page - 1) * limit;

    const filter = { status: ServiceStatus.APPROVED };

    const [list, total] = await Promise.all([
      this.chefModel.find(filter)
        .select('fullName pricingPerHour averageRating profilePicture culinarySpecialties address status createdAt agentId location')
        .populate({
          path: 'agent',
          select: '-balance -__v -createdAt -updatedAt',
          populate: {
            path: 'user',
            select: 'firstname lastname email phoneNumber'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true })
        .exec(),

      this.chefModel.countDocuments(filter),
    ]);

    const chefs = list.map(c => this.flattenAgent(c));
    return {
      chefs,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      }
    };
  }

  private async findProposals(
    filter: any,
    populateField: string,
    query: PaginationQueryDto,
  ) {
    const result = await paginate({
      model: this.proposalModel,
      filter,
      populate: [{ path: populateField }],
      params: query,
      sort: { createdAt: -1 },
    });
    return result;
  }

  async getUserProposals(
    userId: string,
    query: GetProposalsQueryDto
  ) {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (query.status) filter.status = query.status;

    const result = await this.findProposals(filter, 'chef', query);

    return {
      message: 'User proposals retrieved successfully',
      ...result,
    };
  }

  async getChefProposals(
    chefId: string,
    query: PaginationQueryDto,
    status?: ProposalStatus,
  ) {
    const filter: any = { chefId: new Types.ObjectId(chefId) };
    if (status) filter.status = status;

    const result = await this.findProposals(filter, 'user', query);

    return {
      message: 'Chef proposals retrieved successfully',
      ...result,
    };
  }

  async createProposal(chefId: string, userId: string, dto: CreateChefProposalDto) {
    const [user, chef] = await Promise.all([
      this.userModel.findById(userId).select('+deviceToken notificationsEnabled'),
      this.chefModel.findById(chefId).select('fullName')
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!chef) throw new NotFoundException('Chef not found');

    const proposal = await this.proposalModel.create({
      chefId: new Types.ObjectId(chefId),
      userId: new Types.ObjectId(userId),
      price: dto.price,
      description: dto.description,
      date: dto.date
    });

    if (user.notificationsEnabled && user.deviceToken) {
      this.notificationEvents.emitNotification({
        token: user.deviceToken,
        title: 'New Proposal',
        body: `You have received a proposal from ${chef.fullName}.`,
        extras: { proposalId: proposal._id.toString() },
      });
    }

    return { message: 'Proposal created successfully', proposal };
  }

  async respondToProposal(
    proposalId: string,
    userId: string,
    dto: RespondChefProposalDto,
  ) {
    const proposal = await this.proposalModel
      .findOne({ _id: new Types.ObjectId(proposalId), userId: new Types.ObjectId(userId) })
      .populate<{
        chef: ChefDocument & {
          agent: {
            user: UserDocument;
          };
        };
      }>({
        path: 'chef',
        populate: {
          path: 'agent',
          populate: {
            path: 'user',
            select: '+deviceToken notificationsEnabled firstname',
          },
        },
      });

    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.status !== ProposalStatus.PENDING)
      throw new BadRequestException('Proposal has already been responded to');

    const session = await this.connection.startSession();
    let booking: BookingDocument | null = null;
    let user: UserDocument | null = null;

    try {
      await session.withTransaction(async () => {
        if (dto.status === ProposalStatus.ACCEPTED) {
          user = await this.userModel
            .findOneAndUpdate(
              { _id: userId, balance: { $gte: proposal.price } },
              { $inc: { balance: -proposal.price } },
              { new: true, session },
            )
            .select('firstname balance');

          if (!user)
            throw new BadRequestException('Insufficient balance to accept proposal');

          const bookingPayload = {
            serviceType: ServiceType.CHEF,
            userId: new Types.ObjectId(userId),
            agentId: proposal.chef._id,
            chefId: proposal.chef._id,
            startDate: proposal.date,
            totalPrice: proposal.price,
            status: BookingStatus.ACCEPTED,
            paymentStatus: PaymentStatus.PAID,
            escrowStatus: EscrowStatus.HOLD,
          };

          const [newBooking] = await this.bookingModel.create([bookingPayload], { session });
          booking = newBooking;

          const pendingTx = await this.txModel.create(
            [
              {
                reference: `TX-${generateTransactionReference()}`,
                amount: proposal.price,
                type: TransactionType.CREDIT,
                status: TransactionPaymentStatus.PENDING,
                userId: new Types.ObjectId(proposal.chef._id),
                description: `Pending Payout for Chef service awaits you`,
              },
            ],
            { session },
          );

          await this.escrowModel.create(
            [
              {
                bookingId: booking._id,
                userId: new Types.ObjectId(proposal.chef._id),
                totalAmount: proposal.price,
                status: EscrowStatus.HOLD,
                amountReleased: 0,
                lastReleasedDay: 0,
                payoutType: PayoutType.WHOLE,
                releaseDate: proposal.date,
                referenceType: ServiceType.CHEF,
                transactionId: pendingTx[0]._id, // store pending transaction ID
              },
            ],
            { session },
          );

          await this.txModel.create(
            [
              {
                reference: `TX-${generateTransactionReference()}`,
                amount: proposal.price,
                type: TransactionType.DEBIT,
                status: TransactionPaymentStatus.SUCCESSFUL,
                userId: new Types.ObjectId(userId),
                description: `Proposal accepted by you for Chef service`,
              },
            ],
            { session },
          );

          proposal.bookingId = booking._id as Types.ObjectId;
          proposal.status = ProposalStatus.ACCEPTED;
          await proposal.save({ session });
        } else {
          user = await this.userModel.findById(userId).select('firstname').session(session);
          if (!user) throw new NotFoundException('User not found');

          proposal.status = ProposalStatus.REJECTED;
          await proposal.save({ session });
        }
      });

      const chefUser = proposal.chef.agent?.user;
      if (chefUser?.notificationsEnabled && chefUser?.deviceToken) {
        this.notificationEvents.emitNotification({
          token: chefUser.deviceToken,
          title:
            dto.status === ProposalStatus.ACCEPTED ? 'Proposal Accepted' : 'Proposal Rejected',
          body:
            dto.status === ProposalStatus.ACCEPTED
              ? `${user!.firstname} has accepted your proposal.`
              : `${user!.firstname} has rejected your proposal.`,
          extras: {
            proposalId: proposal._id.toString(),
            status: dto.status,
            bookingId: booking?._id?.toString() || null,
          },
        });
      }

      return {
        message:
          dto.status === ProposalStatus.ACCEPTED
            ? 'Proposal accepted successfully, funds held in escrow'
            : 'Proposal rejected',
        proposal,
        booking,
      };
    } finally {
      session.endSession();
    }
  }


  async findAllChefs(query: GetAllChefsDto) {
    const paginationResult = await paginate({
      model: this.chefModel,
      filter: {
        ...(query.status && { status: query.status }),
      },
      populate: [{
        path: 'agent',
        select: 'createdAt updatedAt userId',
        populate: { path: 'user', select: 'firstname lastname email phoneNumber profilePicture userId' }
      }],
      params: query,
      sort: { createdAt: -1 },
    });

    const chefIds = paginationResult.data.map((chef: any) => chef._id);
    const agentIds = paginationResult.data.map((chef: any) => chef.agent?._id);

    const [experiences, certifications, features, bookingStats, withdrawals, totalCount, activeCount] = await Promise.all([
      this.experienceModel.find({ chefId: { $in: chefIds } }).select('chefId title company').lean().exec(),
      this.certificationModel.find({ chefId: { $in: chefIds } }).select('chefId name issuer').lean().exec(),
      this.featureModel.find({ chefId: { $in: chefIds } }).select('chefId name').lean().exec(),
      this.bookingModel.aggregate([
        { $match: { chefId: { $in: chefIds } } },
        {
          $group: {
            _id: '$chefId',
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', BookingStatus.COMPLETED] }, 1, 0] },
            },
            earnings: {
              $sum: {
                $cond: [
                  { $eq: ['$status', BookingStatus.COMPLETED] },
                  { $ifNull: ['$totalPrice', 0] },
                  0,
                ],
              },
            },
          },
        },
      ]),
      this.txModel.find({
        userId: { $in: agentIds },
        type: TransactionType.DEBIT,
        status: TransactionPaymentStatus.SUCCESSFUL,
      }).lean().exec(),
      this.chefModel.countDocuments(),
      this.chefModel.countDocuments({ status: ServiceStatus.APPROVED }),
    ]);

    const experiencesMap = experiences.reduce(
      (map, exp) => map.set(exp.chefId.toString(), [...(map.get(exp.chefId.toString()) || []), exp]),
      new Map<string, any[]>()
    );

    const certificationsMap = certifications.reduce(
      (map, cert) => map.set(cert.chefId.toString(), [...(map.get(cert.chefId.toString()) || []), cert]),
      new Map<string, any[]>()
    );

    const featuresMap = features.reduce(
      (map, feat) => map.set(feat.chefId.toString(), [...(map.get(feat.chefId.toString()) || []), feat]),
      new Map<string, any[]>()
    );

    const bookingsMap = bookingStats.reduce((map, stat) => {
      const chefId = stat._id.toString();
      map.set(chefId, {
        total: stat.total,
        completed: stat.completed,
        earnings: stat.earnings,
      });
      return map;
    }, new Map<string, { total: number; completed: number; earnings: number }>());

    const withdrawalsMap = withdrawals.reduce((map, w) => {
      const id = w.userId.toString();
      map.set(id, (map.get(id) || 0) + 1);
      return map;
    }, new Map<string, number>());

    const totalActive = activeCount;
    const totalInactive = totalCount - activeCount;

    paginationResult.data.forEach((chef: any) => {
      chef.experiences = experiencesMap.get(chef._id.toString()) || [];
      chef.certifications = certificationsMap.get(chef._id.toString()) || [];
      chef.features = featuresMap.get(chef._id.toString()) || [];

      const stats = bookingsMap.get(chef._id.toString()) || { total: 0, completed: 0, earnings: 0 };
      chef.totalBookings = stats.total;
      chef.completedBookings = stats.completed;
      chef.totalEarnings = stats.earnings;
      const agentId = chef.agent?._id;
      this.flattenAgent(chef);
      chef.withdrawalCount = withdrawalsMap.get(agentId?.toString()) || 0;
      chef.user = chef.agent;
      Object.assign(chef, this.withNormalizedChefImages(chef));
    });

    return {
      data: paginationResult.data,
      pagination: paginationResult.pagination,
      metadata: { totalActive, totalInactive },
    };
  }


  async findNewestChef(query: PaginationQueryDto) {
    const since = dayjs().tz(TIMEZONE).subtract(1, 'week').toDate();
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 10);
    const skip = (page - 1) * limit;

    const filter = {
      status: ServiceStatus.APPROVED,
      createdAt: { $gte: since }
    };

    const [list, total] = await Promise.all([
      this.chefModel.find(filter)
        .select('fullName pricingPerHour averageRating profilePicture culinarySpecialties address status createdAt agentId location')
        .populate({
          path: 'agent',
          select: '-balance -__v -createdAt -updatedAt',
          populate: { path: 'user', select: 'firstname lastname email phoneNumber' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true })
        .exec(),

      this.chefModel.countDocuments(filter),
    ]);

    const chefs = list.map(c => this.flattenAgent(c));
    return {
      chefs,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      }
    };
  }

  async getChefProfile(chefId: string): Promise<any> {
    const profile = await this.chefModel.findOne({ _id: toObjectId(chefId) })
      .populate({
        path: 'agent',
        select: '-balance -__v -createdAt -updatedAt',
        populate: {
          path: 'user',
          select: 'firstname lastname email phoneNumber',
        },
      })
      .populate('features')
      .populate('experiences')
      .populate('certifications')
      .lean()
      .exec();

    if (!profile) throw new NotFoundException('Chef not found');

    return this.flattenAgent(profile);
  }

  async findOne(id: string) {
    const chef = await this.chefModel.findById(id)
      .populate({
        path: 'agent',
        select: '-balance -__v -createdAt -updatedAt',
        populate: { path: 'user', select: 'firstname lastname email phoneNumber' },
      })
      .populate('experiences')
      .populate('certifications')
      .populate('features')
      .lean({ virtuals: true })
      .exec();

    if (!chef) throw new NotFoundException('Chef not found');
    return this.flattenAgent(chef);
  }

  async getNearbyChefs(lng: number, lat: number, query: PaginationQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 10));
    const skip = (page - 1) * limit;
    const maxDistance = 30000;

    const filter = {
      status: ServiceStatus.APPROVED,
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat],
          },
          $maxDistance: maxDistance,
        },
      },
    };

    const [list, total] = await Promise.all([
      this.chefModel.find(filter)
        .select('fullName pricingPerHour averageRating profilePicture culinarySpecialties address status createdAt agentId location')
        .populate({
          path: 'agent',
          select: '-balance -__v -createdAt -updatedAt',
          populate: { path: 'user', select: 'firstname lastname email phoneNumber' },
        })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),

      this.chefModel.countDocuments({
        status: ServiceStatus.APPROVED,
        location: {
          $geoWithin: {
            $centerSphere: [[lng, lat], maxDistance / 6378137],
          },
        },
      }),
    ]);

    const chefs = list.map(c => this.flattenAgent(c));

    return {
      chefs,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async countChefs(): Promise<number> {
    const count = await this.chefModel.countDocuments();
    return count;
  }

  async searchChefWithFilters(query: SearchChefDto) {
    const {
      searchTerm,
      culinarySpecialties,
      minPrice,
      maxPrice,
      lat,
      lng,
      radius = 10000,
      page = 1,
      limit = 10
    } = query;

    const p = Math.max(1, +page);
    const l = Math.max(1, +limit);
    const skip = (p - 1) * l;
    const filter: any = { status: ServiceStatus.APPROVED };

    if (searchTerm) {
      filter.$or = [
        { fullName: { $regex: searchTerm, $options: 'i' } },
        { address: { $regex: searchTerm, $options: 'i' } },
      ];
    }
    if (culinarySpecialties) {
      filter.culinarySpecialties = {
        $all: Array.isArray(culinarySpecialties)
          ? culinarySpecialties
          : [culinarySpecialties]
      };
    }
    if (minPrice || maxPrice) {
      filter.pricingPerHour = {};
      if (minPrice) filter.pricingPerHour.$gte = +minPrice;
      if (maxPrice) filter.pricingPerHour.$lte = +maxPrice;
    }
    if (lat != null && lng != null) {
      filter.location = {
        $geoWithin: {
          $centerSphere: [
            [+lng, +lat],
            radius / 6378137
          ]
        }
      };
    }

    const [list, total] = await Promise.all([
      this.chefModel.find(filter)
        .select('fullName pricingPerHour averageRating profilePicture culinarySpecialties address status createdAt agentId location')
        .populate({
          path: 'agent',
          select: '-balance -__v -createdAt -updatedAt',
          populate: { path: 'user', select: 'firstname lastname email phoneNumber' }
        })
        .skip(skip)
        .limit(l)
        .lean({ virtuals: true })
        .exec(),

      this.chefModel.countDocuments(filter),
    ]);
    const chefs = list.map(c => this.flattenAgent(c));
    return {
      chefs,
      pagination: {
        total,
        totalPages: Math.ceil(total / l),
        currentPage: p
      }
    };
  }

  async updateChefStatus(
    chefId: string,
    newStatus: ServiceStatus,
  ): Promise<Chef> {
    const chef = await this.chefModel
      .findByIdAndUpdate(chefId, { status: newStatus }, { new: true, runValidators: true })
      .populate<{
        agent: { user: UserDocument };
      }>({
        path: 'agent',
        populate: {
          path: 'user',
          select: '+deviceToken notificationsEnabled firstname',
        },
      });

    if (!chef) {
      throw new NotFoundException('Chef not found');
    }

    const chefUser = chef.agent?.user;
    if (chefUser?.notificationsEnabled && chefUser?.deviceToken) {
      this.notificationEvents.emitNotification({
        token: chefUser.deviceToken,
        title: 'Chef Status Updated',
        body: `Your chef profile status has been updated to ${newStatus}.`,
        extras: { chefId: chef._id.toString(), serviceType: ServiceType.CHEF },
      });
    }

    return chef;
  }

  async update(id: string, updateChefDto: UpdateChefDto): Promise<Chef> {
    const cleanedDto = stripEmptyFields(updateChefDto);
    if (updateChefDto.address !== undefined || updateChefDto.placeId?.trim()) {
      Object.assign(cleanedDto, await this.googleMapsService.resolveListingAddress(updateChefDto));
    }
    const updatedChef = await this.chefModel.findByIdAndUpdate(
      id,
      { $set: cleanedDto },
      { new: true },
    );

    if (!updatedChef) throw new NotFoundException('Chef not found');

    return updatedChef;
  }

  async updateImagesByAdmin(
    chefId: string,
    images: { profilePicture?: string; coverPhoto?: string },
  ) {
    const update: Record<string, string> = {};

    if (images.profilePicture) {
      const url = normalizeMediaUrl(images.profilePicture, this.cdnBase);
      if (!url) throw new BadRequestException('Invalid profile picture URL');
      update.profilePicture = url;
    }

    if (images.coverPhoto) {
      const url = normalizeMediaUrl(images.coverPhoto, this.cdnBase);
      if (!url) throw new BadRequestException('Invalid cover photo URL');
      update.coverPhoto = url;
    }

    if (!Object.keys(update).length) {
      throw new BadRequestException('At least one image (profilePicture or coverPhoto) is required');
    }

    const chef = await this.chefModel.findByIdAndUpdate(
      chefId,
      { $set: update },
      { new: true, runValidators: false },
    );

    if (!chef) throw new NotFoundException('Chef not found');
    return this.withNormalizedChefImages(chef.toObject());
  }

  async hasExpCertProfile(chefId: string) {
    const chef = await this.chefModel.findById(chefId);
    if (!chef) {
      return {
        hasProfile: false,
        hasExperience: false,
        hasCertifications: false
      };
    }
    return {
      hasProfile: true,
      hasExperience: chef.hasExperience,
      hasCertifications: chef.hasCertifications
    };
  }


  async addExperience(id: string, data: CreateExperienceDto) {
    const experienceData = {
      ...data,
      chefId: toObjectId(id),
      stillWorking: data.endDate ? false : true,
    };

    const updatedChef = await this.chefModel.findByIdAndUpdate(
      id,
      { hasExperience: true },
      { new: true }
    );

    if (!updatedChef) throw new NotFoundException('Chef not found');

    const experience = await new this.experienceModel(experienceData).save();

    return experience;
  }

  async deleteExperience(chefId: string, experienceId: string) {
    const experience = await this.experienceModel.findById(experienceId);
    if (!experience) throw new NotFoundException('Experience not found');

    if (experience.chefId.toString() !== chefId) {
      throw new ForbiddenException('You are not allowed to delete this experience');
    }

    await this.experienceModel.findByIdAndDelete(experienceId);
    return { message: 'Experience deleted successfully' };
  }
  async addCertification(chefId: string, data: CreateCertificationDtoo) {
    const updatedChef = await this.chefModel.findByIdAndUpdate(
      chefId,
      { hasCertifications: true },
      { new: true }
    );

    if (!updatedChef) throw new NotFoundException('Chef not found');

    const certification = await new this.certificationModel({
      ...data,
      chefId: toObjectId(chefId),
    }).save();

    return certification;
  }
  async deleteCertification(chefId: string, certificationId: string) {
    const certification = await this.certificationModel.findById(certificationId);
    if (!certification) throw new NotFoundException('Certification not found');

    if (certification.chefId.toString() !== chefId) {
      throw new ForbiddenException('You are not allowed to delete this certification');
    }
    await this.certificationModel.findByIdAndDelete(certificationId);
    return { message: 'Certification deleted successfully' };
  }

  async addFeature(chefId: string, data: { imageUrl: string; description: string }) {
    const chef = await this.chefModel.findById(chefId);
    if (!chef) throw new NotFoundException('Chef not found');

    const updatedFeature = await this.featureModel.findOneAndUpdate(
      { chefId },
      {
        $push: { featuredImages: data },
        $setOnInsert: { chefId: toObjectId(chefId) },
      },
      {
        upsert: true,
        new: true,
      }
    );
    return updatedFeature;
  }

  async deleteFeature(chefId: string, featureId: string) {
    const feature = await this.featureModel.findById(featureId);
    if (!feature) throw new NotFoundException('Feature not found');

    if (feature.chefId.toString() !== chefId) {
      throw new ForbiddenException('You are not allowed to delete this feature');
    }
    await this.featureModel.findByIdAndDelete(featureId);
    return { message: 'Feature deleted successfully' };
  }

  async rateChef(
    userId: string,
    chefId: string,
    dto: CreateChefRatingDto | UpdateChefRatingDto,
  ) {
    const chef = await this.chefModel.findById(chefId);
    if (!chef) throw new NotFoundException('Chef not found');

    const rating = await this.ratingModel.findOneAndUpdate(
      { chefId: toObjectId(chefId), userId: toObjectId(userId) },
      { $set: { rating: dto.rating, review: dto.review } },
      { upsert: true, new: true, runValidators: true },
    );

    const stats = await this.ratingModel.aggregate([
      { $match: { chefId: toObjectId(chefId) } },
      { $group: { _id: '$chefId', avgRating: { $avg: '$rating' } } },
    ]);

    const newAvg =
      stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;

    await this.chefModel.findByIdAndUpdate(chefId, { averageRating: newAvg });

    return {
      message: 'Rating submitted successfully',
      rating,
      averageRating: newAvg,
    };
  }

  async getChefRatings(chefId: string, query: PaginationQueryDto) {
    const chef = await this.chefModel.findById(chefId);
    if (!chef) throw new NotFoundException('Chef not found');

    const filter = { chefId: toObjectId(chefId) };

    return paginate({
      model: this.ratingModel,
      filter,
      params: query,
      sort: { createdAt: -1 },
      populate: [
        {
          path: 'user',
          model: 'User',
          select: 'firstname lastname email profilePicture',
        },
      ],
    });
  }
}
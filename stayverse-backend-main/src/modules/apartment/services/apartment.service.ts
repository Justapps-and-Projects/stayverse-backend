import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { normalizeMediaUrls } from "src/common/utils/media-url.utils";
import { BookingStatus } from "src/common/constants/enum";
import {
  Apartment,
  ApartmentDocument,
} from "../schemas/apartment.schema";
import { Booking, BookingDocument } from "src/modules/booking/schemas/booking.schema";
import {
  CreateApartmentDto,
  UpdateApartmentDto,
  SearchApartmentDto,
  CreateApartmentRatingDto,
  UpdateApartmentRatingDto,
} from "../dto/apartment.dto";
import {
  ApartmentRating,
  ApartmentRatingDocument,
} from "../schemas/apartment-rating.schema";
import { PaginationQueryDto } from "src/common/dtos/pagination-query.dto";
import { ServiceQueryDto } from "src/common/dtos/service-query.dto";
import { GoogleMapsService } from "src/common/providers/google-map.service";
import { NotificationEvents } from "src/modules/notification/event/notification.event";
import { stripEmptyFields } from "src/common/utils/strip-empty-fields.utils";
import { toObjectId } from "src/common/utils/objectId.utils";
import { ServiceStatus, TIMEZONE } from "src/common/constants/enum";
import dayjs from "dayjs";
import { paginate } from "src/common/utils/pagination.utils";
import { UserDocument } from "src/modules/user/schemas/user.schema";

@Injectable()
export class ApartmentService {
  constructor(
    @InjectModel(Apartment.name)
    private readonly apartmentModel: Model<ApartmentDocument>,
    @InjectModel(ApartmentRating.name)
    private readonly ratingModel: Model<ApartmentRatingDocument>,
    private googleMapsService: GoogleMapsService,
    private notificationEvents: NotificationEvents,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    private readonly configService: ConfigService,
  ) { }

  private get cdnBase(): string {
    return this.configService.get<string>('do.cdnUrl') || '';
  }

  private withNormalizedImages<T extends { apartmentImages?: string[] }>(doc: T): T {
    if (!doc) return doc;
    const images = normalizeMediaUrls(doc.apartmentImages, this.cdnBase);
    return {
      ...doc,
      apartmentImages: images?.length ? [images[0]] : [],
    };
  }

  async create(createDto: CreateApartmentDto, agentId: string, images: string[]) {
    const listingAddress = await this.googleMapsService.resolveListingAddress(createDto);
    const apartment = new this.apartmentModel({
      ...createDto,
      ...listingAddress,
      agentId: toObjectId(agentId),
      apartmentImages: images,
    });
    return apartment.save();
  }

  async findAll(query: PaginationQueryDto) {
    return this.getApartment(this.apartmentModel, { status: ServiceStatus.APPROVED }, query);
  }

  async findAllAdmin(query: ServiceQueryDto) {
    const status = query.status || ServiceStatus.APPROVED;
    return this.getApartment(this.apartmentModel, { status }, query);
  }

  async findAllByOwner(agentId: string, query: PaginationQueryDto, status: ServiceStatus) {
    return this.getApartment(this.apartmentModel, { agentId: toObjectId(agentId), status }, query);
  }

  async findAllByOwnerForUser(agentId: string, query: PaginationQueryDto) {
    return this.getApartment(this.apartmentModel, { agentId: toObjectId(agentId), status: ServiceStatus.APPROVED }, query);
  }

  async findNewestApartments(query: PaginationQueryDto) {
    const since = dayjs().tz(TIMEZONE).subtract(1, "week").toDate();
    return this.getApartment(
      this.apartmentModel,
      { status: ServiceStatus.APPROVED, createdAt: { $gte: since } },
      query,
    );
  }

  async getNearbyApartments(longitude: number, latitude: number, query: PaginationQueryDto) {
    const radiusInMeters = 30000; // 30km
    const radiusInRadians = radiusInMeters / 6378137; // Earth's radius in meters

    const filter = {
      status: ServiceStatus.APPROVED,
      location: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInRadians],
        },
      },
    };

    return this.getApartment(this.apartmentModel, filter, query);
  }


  async searchApartmentWithFilters(query: SearchApartmentDto) {
    const {
      searchTerm,
      apartmentType,
      amenities,
      numberOfBedrooms,
      priceRange,
      details,
      lat,
      lng,
      radius = 10000,
    } = query;

    const filter: any = { status: ServiceStatus.APPROVED };

    const andConditions = [];

    if (searchTerm) {
      andConditions.push({
        $or: [
          { apartmentName: { $regex: searchTerm, $options: "i" } },
          { address: { $regex: searchTerm, $options: "i" } },
          { details: { $regex: searchTerm, $options: "i" } },
        ]
      });
    }

    if (details) {
      const terms = details.split(/\s+/).filter(Boolean);
      andConditions.push({
        $or: terms.map(term => ({ details: { $regex: term, $options: "i" } }))
      });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    if (apartmentType) filter.apartmentType = apartmentType;
    if (numberOfBedrooms) filter.numberOfBedrooms = +numberOfBedrooms;
    if (priceRange?.min || priceRange?.max) {
      filter.pricePerDay = {};
      if (priceRange.min) filter.pricePerDay.$gte = +priceRange.min;
      if (priceRange.max) filter.pricePerDay.$lte = +priceRange.max;
    }
    if (amenities) filter.amenities = { $all: Array.isArray(amenities) ? amenities : [amenities] };
    if (lat && lng) {
      filter.location = {
        $geoWithin: {
          $centerSphere: [[+lng, +lat], +radius / 6378137],
        },
      };
    }

    return this.getApartment(this.apartmentModel, filter, query);
  }

  async findOne(id: string) {
    const result = await this.getApartment(this.apartmentModel, { _id: toObjectId(id) });
    if (!result.apartments.length) throw new NotFoundException("Apartment not found");
    return this.withNormalizedImages(result.apartments[0]);
  }

  async updateImagesByAdmin(id: string, images: string[]) {
    const normalized = normalizeMediaUrls(images, this.cdnBase);
    if (normalized.length < 1 || normalized.length > 12) {
      throw new BadRequestException('Apartment must have between 1 and 12 images');
    }

    const apartment = await this.apartmentModel.findOneAndUpdate(
      { _id: toObjectId(id), isDeleted: { $ne: true } },
      { $set: { apartmentImages: normalized } },
      { new: true, runValidators: false },
    );

    if (!apartment) throw new NotFoundException('Apartment not found');
    return this.withNormalizedImages(apartment.toObject());
  }

  async updateApartmentStatus(apartmentId: string, newStatus: ServiceStatus) {
    const apartment = await this.apartmentModel
      .findOneAndUpdate(
        { _id: apartmentId, isDeleted: { $ne: true } },
        { status: newStatus },
        { new: true, runValidators: true }
      )
      .populate<{ agent: { user: UserDocument } }>({
        path: "agent",
        populate: { path: "user", select: "+deviceToken notificationsEnabled firstname" },
      });
    if (!apartment) throw new NotFoundException("Apartment not found");
    const agentUser = apartment.agent?.user;
    if (agentUser?.notificationsEnabled && agentUser?.deviceToken) {
      this.notificationEvents.emitNotification({
        token: agentUser.deviceToken,
        title: "Apartment Status Updated",
        body: `Your apartment "${apartment.apartmentName}" status has been updated to ${newStatus}.`,
        extras: { apartmentId: apartment._id.toString(), newStatus },
      });
    }

    return { message: `Apartment ${newStatus}`, apartment };
  }

  async update(id: string, updateApartmentDto: Partial<UpdateApartmentDto>, agentId: string) {
    const cleanedDto = stripEmptyFields(updateApartmentDto);
    if (updateApartmentDto.address !== undefined || updateApartmentDto.placeId?.trim()) {
      Object.assign(cleanedDto, await this.googleMapsService.resolveListingAddress(updateApartmentDto));
    }
    const apartment = await this.apartmentModel.findOneAndUpdate(
      { _id: toObjectId(id), agentId: toObjectId(agentId), isDeleted: { $ne: true } },
      { $set: cleanedDto },
      { new: true },
    );
    if (!apartment) throw new NotFoundException("Apartment not found or unauthorized");
    return apartment;
  }

  async countApartments() {
    return this.apartmentModel.countDocuments();
  }

  async rateApartment(
    userId: string,
    apartmentId: string,
    dto: CreateApartmentRatingDto | UpdateApartmentRatingDto,
  ) {
    const apartment = await this.apartmentModel.findById(apartmentId);
    if (!apartment) throw new NotFoundException("Apartment not found");

    const rating = await this.ratingModel.findOneAndUpdate(
      { apartmentId: toObjectId(apartmentId), userId: toObjectId(userId) },
      { $set: { rating: dto.rating, review: dto.review } },
      { upsert: true, new: true, runValidators: true },
    );

    const stats = await this.ratingModel.aggregate([
      { $match: { apartmentId: toObjectId(apartmentId) } },
      { $group: { _id: "$apartmentId", avgRating: { $avg: "$rating" } } },
    ]);

    const newAvg = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    await this.apartmentModel.findByIdAndUpdate(apartmentId, { averageRating: newAvg });

    return { message: "Rating submitted successfully", rating, averageRating: newAvg };
  }

  async getApartmentRatings(apartmentId: string, query: PaginationQueryDto) {
    const apartment = await this.apartmentModel.findById(apartmentId);
    if (!apartment) throw new NotFoundException("Apartment not found");

    return paginate({
      model: this.ratingModel,
      filter: { apartmentId: toObjectId(apartmentId) },
      params: query,
      sort: { createdAt: -1 },
      populate: [{ path: "user", model: "User" }],
    });
  }

  //<==Private Methods====>
  private async getApartment(
    model: Model<ApartmentDocument>,
    filter: any = {},
    query: any = {}
  ) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = query;

    const result = await paginate({
      model,
      filter,
      params: { page, limit },
      sort,
      select:
        'apartmentName pricePerDay averageRating apartmentType numberOfBedrooms address apartmentImages agentId status createdAt location amenities',
      populate: [
        {
          path: "agent", select: "userId serviceType"
        }
      ]
    });

    return {
      apartments: result.data.map((a) => this.withNormalizedImages(a)),
      pagination: result.pagination,
    };
  }
  async delete(apartmentId: string, agentId: string, role: string) {
    const apartment = await this.apartmentModel.findById(apartmentId);
    if (!apartment) throw new NotFoundException('Apartment not found');

    if (role !== 'admin' && apartment.agentId.toString() !== agentId.toString()) {
      throw new BadRequestException('You are not authorized to delete this apartment');
    }

    const activeBookings = await this.bookingModel.countDocuments({
      apartmentId: toObjectId(apartmentId),
      status: BookingStatus.ACCEPTED,
      endDate: { $gt: new Date() },
    });

    if (activeBookings > 0) {
      throw new BadRequestException('Cannot delete apartment with active bookings');
    }

    await this.apartmentModel.findByIdAndUpdate(apartmentId, { isDeleted: true });

    return { message: 'Apartment deleted successfully' };

  }
}

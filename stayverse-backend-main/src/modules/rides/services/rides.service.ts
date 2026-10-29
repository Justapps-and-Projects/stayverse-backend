import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { normalizeMediaUrls } from "src/common/utils/media-url.utils";
import { Model, Types } from "mongoose";
import { Ride, RideDocument } from "../schemas/rides.schema";
import { CreateRideDto, UpdateRideDto, SearchRidesDto, CreateRideRatingDto, UpdateRideRatingDto } from "../dto/rides.dto";
import { toObjectId } from "../../../common/utils/objectId.utils";
import { ServiceStatus, TIMEZONE } from "src/common/constants/enum";
import dayjs from "dayjs";
import { GoogleMapsService } from "src/common/providers/google-map.service";
import { stripEmptyFields } from "src/common/utils/strip-empty-fields.utils";
import { PaginationQueryDto } from "src/common/dtos/pagination-query.dto";
import { ServiceQueryDto } from "src/common/dtos/service-query.dto";
import { paginate } from "src/common/utils/pagination.utils";
import { RideRating, RideRatingDocument } from "../schemas/ride-rating.schema";
import { UserDocument } from "src/modules/user/schemas/user.schema";
import { NotificationEvents } from "src/modules/notification/event/notification.event";
import { Booking, BookingDocument } from "src/modules/booking/schemas/booking.schema";
import { BookingStatus } from "src/common/constants/enum";
@Injectable()
export class RidesService {
    constructor(
        @InjectModel(Ride.name) private readonly rideModel: Model<RideDocument>,
        @InjectModel(RideRating.name) private readonly ratingModel: Model<RideRatingDocument>,
        private googleMapsService: GoogleMapsService,
        private notificationEvents: NotificationEvents,
        @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
        private readonly configService: ConfigService,
    ) { }

    private get cdnBase(): string {
        return this.configService.get<string>('do.cdnUrl') || '';
    }

    private withNormalizedImages<T extends { rideImages?: string[] }>(doc: T): T {
        if (!doc) return doc;
        const images = normalizeMediaUrls(doc.rideImages, this.cdnBase);
        return {
            ...doc,
            rideImages: images?.length ? [images[0]] : [],
        };
    }

    private flattenAgent(obj: any) {
        if (obj.agentId?.userId) {
            const user = obj.agent.user;
            obj.agent = {
                _id: obj.agentId._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                phoneNumber: user.phoneNumber
            };
        }
        return obj;
    }

    async create(createRideDto: CreateRideDto, agentId: string, rideImages: string[]): Promise<Ride> {
        const listingAddress = await this.googleMapsService.resolveListingAddress(createRideDto);
        const ride = new this.rideModel({
            ...createRideDto,
            ...listingAddress,
            agentId: toObjectId(agentId),
            rideImages,
        });
        return ride.save();
    }

    private async paginateAndPopulate(filter: any, query: any) {
        const page = Math.max(1, Number(query.page ?? 1));
        const limit = Math.max(1, Number(query.limit ?? 10));
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.rideModel
                .find(filter)
                .select('rideName pricePerHour averageRating rideType rideImages address agentId status createdAt location')
                .populate({
                    path: 'agent',
                    select: 'userId serviceType',
                    populate: { path: 'user', select: 'firstname lastname email phoneNumber' }
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.rideModel.countDocuments(filter)
        ]);
        items.forEach((item: any) => {
            this.flattenAgent(item);
            Object.assign(item, this.withNormalizedImages(item));
        });

        return { items, pagination: { total, totalPages: Math.ceil(total / limit), currentPage: page } };
    }

    async updateImagesByAdmin(id: string, images: string[]) {
        const normalized = normalizeMediaUrls(images, this.cdnBase);
        if (normalized.length < 1 || normalized.length > 12) {
            throw new BadRequestException('Ride must have between 1 and 12 images');
        }

        const ride = await this.rideModel.findOneAndUpdate(
            { _id: toObjectId(id), isDeleted: { $ne: true } },
            { $set: { rideImages: normalized } },
            { new: true, runValidators: false },
        );

        if (!ride) throw new NotFoundException('Ride not found');
        return this.withNormalizedImages(ride.toObject());
    }

    async findAll(query: PaginationQueryDto) {
        const { items: rides, pagination } = await this.paginateAndPopulate({ status: ServiceStatus.APPROVED }, query);
        return { rides, pagination };
    }

    async findAllAdmin(query: ServiceQueryDto) {
        const status = query.status || ServiceStatus.APPROVED;
        const { items: rides, pagination } = await this.paginateAndPopulate({ status }, query);
        return { rides, pagination };
    }

    async findAllByOwner(agentId: string, query: PaginationQueryDto, status: ServiceStatus) {
        const filter = { agentId: toObjectId(agentId), status };
        const { items: rides, pagination } = await this.paginateAndPopulate(filter, query);
        return { rides, pagination };
    }
    async findAllByAgent(agentId: string, query: any) {
        const filter = { agentId: toObjectId(agentId), status: ServiceStatus.APPROVED };
        const { items: rides, pagination } = await this.paginateAndPopulate(filter, query);
        return { rides, pagination };
    }

    async findNewestRides(query: any) {
        const since = dayjs().tz(TIMEZONE).subtract(1, 'week').toDate();
        const filter = { createdAt: { $gte: since }, status: ServiceStatus.APPROVED };
        const { items: rides, pagination } = await this.paginateAndPopulate(filter, query);
        return { rides, pagination };
    }

    async getNearbyRides(lng: number, lat: number, query: any) {
        const filter = { location: { $geoWithin: { $centerSphere: [[lng, lat], 10000 / 6378137] } }, status: ServiceStatus.APPROVED };
        const { items: rides, pagination } = await this.paginateAndPopulate(filter, query);
        return { rides, pagination };
    }

    async searchRidesWithFilters(query: SearchRidesDto) {
        const { searchTerm, rideType, description, priceMax, priceMin, features, lat, lng, radius = 10000 } = query;
        const filter: any = { status: ServiceStatus.APPROVED };
        const andConditions = [];

        if (searchTerm) {
            andConditions.push({
                $or: [
                    { rideName: { $regex: searchTerm, $options: 'i' } },
                    { address: { $regex: searchTerm, $options: 'i' } },
                    { rideType: { $regex: searchTerm, $options: 'i' } },
                    { color: { $regex: searchTerm, $options: 'i' } },
                ]
            });
        }
        if (rideType) filter.rideType = rideType;
        if (description) {
            const terms = description.split(/\s+/).filter(Boolean);
            andConditions.push({
                $or: terms.map(term => ({
                    rideDescription: { $regex: term, $options: 'i' }
                }))
            });
        }

        if (andConditions.length > 0) {
            filter.$and = andConditions;
        }

        if (features) filter.features = { $all: Array.isArray(features) ? features : [features] };
        if (lat && lng) {
            filter.location = {
                $geoWithin: {
                    $centerSphere: [[Number(lng), Number(lat)], radius / 6378137]
                }
            };
        }

        if (priceMin) filter.pricePerHour = { $gte: priceMin };
        if (priceMax) filter.pricePerHour = { ...filter.pricePerHour, $lte: priceMax };

        const { items: rides, pagination } = await this.paginateAndPopulate(filter, query);
        return { rides, pagination };
    }

    async updateRideStatus(
        rideId: string,
        newStatus: ServiceStatus,
    ): Promise<{ message: string; ride: Ride }> {
        const ride = await this.rideModel
            .findOneAndUpdate(
                { _id: rideId, isDeleted: { $ne: true } },
                { status: newStatus },
                { new: true, runValidators: true },
            )
            .populate<{
                agent: { user: UserDocument };
            }>({
                path: 'agent',
                populate: {
                    path: 'user',
                    select: '+deviceToken notificationsEnabled firstname',
                },
            });

        if (!ride) {
            throw new NotFoundException('Ride not found');
        }

        const agentUser = ride.agent?.user;
        if (agentUser?.notificationsEnabled && agentUser?.deviceToken) {
            this.notificationEvents.emitNotification({
                token: agentUser.deviceToken,
                title: 'Ride Status Updated',
                body: `Your ride "${ride.rideName}" status has been updated to ${newStatus}.`,
                extras: { rideId: ride._id.toString(), newStatus },
            });
        }

        return {
            message: `Ride ${newStatus}`,
            ride,
        };
    }

    async findOne(id: string): Promise<any> {
        const ride = await this.rideModel
            .findById(id)
            .populate({
                path: 'agent',
                select: '-balance -__v -createdAt -updatedAt',
                populate: { path: 'user', select: 'firstname lastname email phoneNumber' }
            })
            .lean()
            .exec() as any;

        if (!ride) throw new NotFoundException('Ride not found');
        return this.withNormalizedImages(this.flattenAgent(ride));
    }
    async update(id: string, updateRideDto: UpdateRideDto, uploadedUrls: string[], agentId: string): Promise<Ride> {
        const cleanedDto = stripEmptyFields(updateRideDto);
        if (updateRideDto.address !== undefined || updateRideDto.placeId?.trim()) {
            Object.assign(cleanedDto, await this.googleMapsService.resolveListingAddress(updateRideDto));
        }
        if (uploadedUrls && uploadedUrls.length > 0) {
            cleanedDto.rideImages = uploadedUrls;
        }

        const ride = await this.rideModel.findOneAndUpdate(
            { _id: toObjectId(id), agentId: toObjectId(agentId), isDeleted: { $ne: true } },
            { $set: cleanedDto },
            { new: true }
        );

        if (!ride) {
            throw new NotFoundException("Ride not found or you're not authorized to update this ride");
        }
        return ride;
    }

    async rateRides(rideId: string, userId: string, dto: CreateRideRatingDto | UpdateRideRatingDto) {
        const ride = await this.rideModel.findById(rideId);
        if (!ride) throw new NotFoundException('Ride not found');

        await this.ratingModel.findOneAndUpdate(
            { rideId: toObjectId(rideId), userId: toObjectId(userId) },
            { rating: dto.rating, review: dto.review },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const result = await this.ratingModel.aggregate([
            { $match: { rideId: toObjectId(rideId) } },
            { $group: { _id: '$rideId', avgRating: { $avg: '$rating' } } }
        ]);

        const avg = result[0]?.avgRating || 0;
        await this.rideModel.findByIdAndUpdate(rideId, { averageRating: avg });

        return { message: 'Rating added/updated successfully', averageRating: avg };
    }

    async getRideRatings(rideId: string, query: PaginationQueryDto) {
        const ride = await this.rideModel.findById(rideId);
        if (!ride) throw new NotFoundException('Ride not found');

        const filter = { rideId: toObjectId(rideId) };

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

    async countRides(): Promise<number> {
        const count = await this.rideModel.countDocuments();
        return count;
    }

    async delete(rideId: string, agentId: string, role: string) {
        const ride = await this.rideModel.findById(rideId);
        if (!ride) throw new NotFoundException('Ride not found');

        if (role !== 'admin' && ride.agentId.toString() !== agentId.toString()) {
            throw new BadRequestException('You are not authorized to delete this ride');
        }

        const activeBookings = await this.bookingModel.countDocuments({
            rideId: toObjectId(rideId),
            status: BookingStatus.ACCEPTED,
            endDate: { $gt: new Date() },
        });

        if (activeBookings > 0) {
            throw new BadRequestException('Cannot delete ride with active bookings');
        }

        await this.rideModel.findByIdAndUpdate(rideId, { isDeleted: true });

        return { message: 'Ride deleted successfully' };
    }
}

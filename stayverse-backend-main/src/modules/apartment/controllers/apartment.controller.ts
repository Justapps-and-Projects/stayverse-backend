import { ApartmentUploadPipe, MAX_APARTMENT_VIDEO_BYTES } from '../../../common/pipes/apartment-upload.pipe';
import {
    Controller,
    Get,
    Post,
    Put,
    Param,
    Body,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFiles,
    Logger,
    Patch,
    BadRequestException,
    Query,
    InternalServerErrorException,
    Delete,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiParam,
    ApiBearerAuth,
    ApiConsumes,
    ApiQuery
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApartmentService } from '../services/apartment.service';
import { CreateApartmentDto, CreateApartmentRatingDto, SearchApartmentDto, UpdateApartmentDto, UpdateApartmentStatusDto } from '../dto/apartment.dto';
import { AuthGuard, Public } from '../../../common/guards/auth.guard';
import { RolesGuard, Role, ServiceTypeGuard } from '../../../common/guards/roles.guard';
import { BookedStatus, Roles, ServiceStatus, ServiceType } from '../../../common/constants/enum';
import { FileUploadPipe } from 'src/common/pipes/file-upload.pipe';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { ServiceQueryDto } from 'src/common/dtos/service-query.dto';
import { AuthenticatedRequest } from 'src/common/types/app.interface';
import { DOUploadService } from 'src/common/providers/digiital-ocean.service';
import { AdminUpdateGalleryImagesDto } from 'src/common/dtos/admin-update-images.dto';

@ApiTags('Apartments')
@Controller('apartment')
@UseGuards(AuthGuard, RolesGuard)
@Role(Roles.ADMIN, Roles.AGENT)
export class ApartmentController {
    private readonly logger = new Logger(ApartmentController.name);

    constructor(private readonly apartmentService: ApartmentService, private readonly uploadService: DOUploadService) { }

    @Post()
    @ServiceTypeGuard(ServiceType.APARTMENT)
    @UseInterceptors(FileFieldsInterceptor([{ name: 'apartmentImages', maxCount: 12 }, { name: 'apartmentVideo', maxCount: 1 }], { limits: { fileSize: MAX_APARTMENT_VIDEO_BYTES, files: 13 } }))
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Create a new apartment listing',
        description: 'Allows agent to create a new apartment listing.',
    })
    @ApiConsumes('multipart/form-data')
    async create(
        @Body() createApartmentDto: CreateApartmentDto,
        @Request() req,
        @UploadedFiles(new ApartmentUploadPipe()) files: Record<string, Express.Multer.File[]> & { videoDurationSeconds?: number }
    ) {
        const apartmentImages = files?.apartmentImages || [];

        if (apartmentImages.length < 2 || apartmentImages.length > 12) {
            throw new BadRequestException(
                'Apartment Images must be between 2 and 12 files.',
            );
        }

        const agentId = req.user.agent;
        const uploadedUrls = await this.uploadService.uploadFiles(apartmentImages, 'apartments');
        const videoUrls = files.apartmentVideo?.length
            ? await this.uploadService.uploadFiles(files.apartmentVideo, 'apartments/videos') : [];
        return await this.apartmentService.create(createApartmentDto, agentId, uploadedUrls,
            videoUrls[0] ? { videoUrl: videoUrls[0], videoDurationSeconds: files.videoDurationSeconds } : undefined);
    }

    @Public()
    @Get()
    @ApiOperation({
        summary: 'Get all apartments',
        description: 'Retrieves a list of all apartments.',
    })
    async findAll(@Query() query: PaginationQueryDto) {
        return this.apartmentService.findAll(query);
    }

    @Get('admin/all')
    @Role(Roles.ADMIN)
    @ApiOperation({
        summary: 'Get all apartments (Admin only)',
        description: 'Allows an admin to retrieve a list of all apartments with status filtering.',
    })
    async findAllAdmin(@Query() query: ServiceQueryDto) {
        return this.apartmentService.findAllAdmin(query);
    }
    @Public()
    @Get('newest')
    @ApiOperation({
        summary: 'Get latest apartment just posted',
        description: 'Returns the apartment posted within the last 24 hours .',
    })
    async findNewestApartments(@Query() query: PaginationQueryDto) {
        return this.apartmentService.findNewestApartments(query);
    }

    @Public()
    @Get('recommended')
    @ApiOperation({
        summary: 'Get nearby apartments',
        description: 'Returns apartment within a 10 km radius of the specified coordinates.',
    })
    async getNearbyApartments(
        @Query('lng') lng: string,
        @Query('lat') lat: string,
        @Query() query: PaginationQueryDto
    ) {
        if (!lng || !lat) {
            throw new BadRequestException('Longitude and latitude are required.');
        }

        const longitude = parseFloat(lng);
        const latitude = parseFloat(lat);

        if (isNaN(longitude) || isNaN(latitude)) {
            throw new BadRequestException('Invalid coordinates.');
        }
        const apartments = await this.apartmentService.getNearbyApartments(longitude, latitude, query);
        return apartments;
    }
    @Public()
    @Get('search')
    async searchApartments(@Query() query: SearchApartmentDto) {
        return this.apartmentService.searchApartmentWithFilters(query);
    }

    @Get('owner')
    @Role(Roles.AGENT, Roles.ADMIN)
    @ServiceTypeGuard(ServiceType.APARTMENT)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get all apartments posted by an agent (admin must provide agentId)',
        description: 'Admins can specify an agentId; others will use their own ID.',
    })
    @ApiQuery({
        name: 'agentId',
        required: false,
        type: String,
        description: 'Agent ID (required for admins)',
        example: '6836a8ad6addf634650112a6',
    })
    @ApiQuery({
        name: 'status',
        required: true,
        type: String,
        description: '[approved, cancelled, pending]',
        example: 'approved',
    })
    async findAllMyApartments(
        @Request() req: AuthenticatedRequest,
        @Query() query: PaginationQueryDto & { agentId?: string; status?: ServiceStatus }
    ) {
        const user = req.user;

        let ownerId: string;

        if (user.role === Roles.ADMIN) {
            if (!query.agentId) {
                throw new BadRequestException('agentId is required for admin users');
            }
            ownerId = query.agentId;
        } else {
            ownerId = user.agent;
        }

        return this.apartmentService.findAllByOwner(ownerId, query, query.status);
    }

    @Get('agents/:agentId')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'users get all apartments  posted by a specific agent',
        description: 'Retrieves a list of all apartment posted by a specific agent.',
    })
    @ApiParam({ name: 'agentId', required: true, description: 'ID of the agent whose apartments to retrieve.' })
    async findAllByAgent(
        @Param('agentId') agentId: string,
        @Query() query: PaginationQueryDto
    ) {
        return this.apartmentService.findAllByOwnerForUser(agentId, query);
    }
    @Patch(':id/status')
    @Role(Roles.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Change the status of an apartment',
        description: 'Allows an admin to change the status of an apartment listing.',
    })
    async changeStatus(
        @Param('id') id: string,
        @Body() dto: UpdateApartmentStatusDto,
    ) {
        return this.apartmentService.updateApartmentStatus(id, dto.status);
    }

    @Patch(':id/images')
    @Role(Roles.ADMIN)
    @UseInterceptors(FileFieldsInterceptor([{ name: 'apartmentImages', maxCount: 12 }]))
    @ApiBearerAuth()
    @ApiConsumes('multipart/form-data')
    @ApiOperation({
        summary: 'Admin: update apartment gallery images',
        description: 'Keep selected URLs and upload new images. Replaces the full gallery.',
    })
    async updateImagesAdmin(
        @Param('id') id: string,
        @Body() body: AdminUpdateGalleryImagesDto,
        @UploadedFiles(new FileUploadPipe()) files: Record<string, Express.Multer.File[]>,
    ) {
        let keepImages: string[] = [];
        if (body.keepImages) {
            try {
                const parsed = JSON.parse(body.keepImages);
                if (!Array.isArray(parsed)) {
                    throw new BadRequestException('keepImages must be a JSON array');
                }
                keepImages = parsed.filter((u) => typeof u === 'string' && u.trim());
            } catch {
                throw new BadRequestException('keepImages must be valid JSON');
            }
        }

        const newFiles = files?.apartmentImages || [];
        const uploadedUrls = newFiles.length
            ? await this.uploadService.uploadFiles(newFiles, 'apartments')
            : [];

        return this.apartmentService.updateImagesByAdmin(id, [...keepImages, ...uploadedUrls]);
    }

    @Delete(':id')
    @Role(Roles.ADMIN, Roles.AGENT)
    @ApiOperation({
        summary: 'Delete an apartment',
        description: 'Allows an admin or agent to delete an apartment. Agent can only delete their own apartment.',
    })
    async delete(@Param('id') id: string, @Request() req) {
        return this.apartmentService.delete(id, req.user.agent, req.user.role);
    }

    @Post(':id/rating')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Add or update apartment rating',
        description:
            'Allows a logged-in user to rate an apartment (between 1 and 5) and optionally add a review.',
    })
    async addOrUpdateRating(
        @Param('id') apartmentId: string,
        @Body() dto: CreateApartmentRatingDto,
        @Request() req: AuthenticatedRequest,
    ) {
        const userId = req.user.sub;
        return this.apartmentService.rateApartment(userId, apartmentId, dto);
    }

    @Public()
    @Get(':id/ratings')
    @ApiOperation({
        summary: 'Get all ratings for a specific apartment',
        description: 'Retrieves paginated ratings and reviews for the specified apartment.',
    })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 10 })
    async getApartmentzs(
        @Param('id') apartmentId: string,
        @Query() query: PaginationQueryDto,
    ) {
        return this.apartmentService.getApartmentRatings(apartmentId, query);
    }

    @Get('count')
    @Role(Roles.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get the total number of apartments',
        description: 'Returns the total count of apartments in the database.',
    })
    async countApartments() {
        return this.apartmentService.countApartments();
    }

    @Get(':id')
    @Public()
    @ApiOperation({
        summary: 'Get a single apartment by ID',
        description: 'Retrieves details of a specific apartment. ',
    })
    @ApiParam({ name: 'id', required: true, description: 'ID of the apartment to retrieve.' })
    async findOne(@Param('id') id: string) {
        return this.apartmentService.findOne(id);
    }

    @Put(':id')
    @ServiceTypeGuard(ServiceType.APARTMENT)
    @Role(Roles.AGENT)
    @UseInterceptors(FileFieldsInterceptor([{ name: 'apartmentImages', maxCount: 12 }]))
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Update a apartment listing',
        description: 'Allows an admin or agent to update an existing apartment listing. Images are optional.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiParam({ name: 'id', required: true, description: 'ID of the apartment to update.' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateApartmentDto,
        @Request() req,
        @UploadedFiles() files: Record<string, Express.Multer.File[]>,
    ) {
        const agentId = req.user.agent;
        const apartmentImages = files?.apartmentImages || [];

        if (apartmentImages.length > 0 && (apartmentImages.length < 2 || apartmentImages.length > 12)) {
            throw new BadRequestException('Apartment Images must be between 2 and 12 files if provided.');
        }

        let uploadedImages: string[] | undefined;

        if (apartmentImages.length > 0) {
            try {
                uploadedImages = await this.uploadService.uploadFiles(apartmentImages, 'apartments');
            } catch (error) {
                throw new InternalServerErrorException('File upload failed');
            }
        }
        const updatePayload: Partial<UpdateApartmentDto> = {
            ...dto,
            ...(uploadedImages && { apartmentImages: uploadedImages }),
        };

        return this.apartmentService.update(id, updatePayload, agentId);
    }

}
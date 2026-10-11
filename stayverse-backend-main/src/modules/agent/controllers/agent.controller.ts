import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards, HttpCode, Query, UseInterceptors, UploadedFile, Patch } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard, Public } from '../../../common/guards/auth.guard';
import { AgentService } from '../services/agent.service';
import { CreateAgentDto, LoginAgentDto, ForgotPasswordResetDto } from '../dto/agent.dto';
import { UpdateDeviceTokenAndNotificationDto, UpdatePasswordDto, UpdateProfilePicture, UpdateUserDto, VerifyNinSelfieDto, DeleteAccountDto, SocialLoginDto } from 'src/modules/user/dto/user.dto';
import { VerifyEmailTokenDto } from '../../../common/dtos/verify-email-token.dto';
import { ResendVerificationEmailDto } from '../../../common/dtos/resend-verification-email.dto';
import { Role, RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/constants/enum';
import { FilterAgentsDto } from '../dto/filter-agents.dto';
import { GetAgentApartmentsDto } from '../dto/get-agent-apartments.dto';
import { GetAgentRidesDto } from '../dto/get-agent-rides.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from 'src/common/types/app.interface';
import { UserService } from 'src/modules/user/services/user.service';
import { FileUploadPipe } from 'src/common/pipes/file-upload.pipe';
import { DOUploadService } from 'src/common/providers/digiital-ocean.service';


@Controller('agents')
@UseGuards(RolesGuard, AuthGuard)
@ApiTags('Agents')
export class AgentController {
    constructor(private agentService: AgentService,
        private usersService: UserService,
        private readonly uploadService: DOUploadService
    ) { }

    /**
     * Public Endpoints
     */

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register a new agent', description: 'Creates a new agent account and returns a success message.' })
    @ApiBody({ type: CreateAgentDto })
    @ApiResponse({ status: 201, description: 'Registration successful', example: { message: 'Agent created successfully' } })
    async register(@Body() createAgentDto: CreateAgentDto) {
        return await this.agentService.register(createAgentDto);
    }

    @Delete('me')
    @ApiBearerAuth()
    @UseGuards(AuthGuard, RolesGuard)
    @Role(Roles.AGENT)
    @ApiOperation({ summary: 'Delete current agent profile' })
    @ApiBody({ type: DeleteAccountDto })
    @ApiResponse({ status: 200, description: 'Agent profile deleted successfully' })
    async deleteMyAgentProfile(@Req() req, @Body() dto: DeleteAccountDto) {
        return await this.agentService.softDeleteAgent(req.user.agent, dto.password);
    }

    @Public()
    @Post('login')
    @HttpCode(200)
    @ApiOperation({ summary: 'Agent login', description: 'Authenticates an agent and returns an access token upon successful login.' })
    @ApiBody({ type: LoginAgentDto })
    @ApiResponse({ status: 200, description: 'Login successful', example: { accessToken: 'jwt_token_here' } })
    async login(@Body() loginDto: LoginAgentDto) {
        return await this.agentService.login(loginDto.email, loginDto.password);
    }

    @Public()
    @Post('auth/social')
    @HttpCode(200)
    @ApiOperation({ summary: 'Agent sign in with Google or Apple' })
    @ApiBody({ type: SocialLoginDto })
    async socialLogin(@Body() dto: SocialLoginDto) {
        return await this.agentService.loginWithSocial(dto);
    }

    @Public()
    @Post('verify-token')
    @ApiOperation({ summary: 'Verify email token', description: 'Verifies the OTP sent to the agent\'s email address.' })
    @ApiBody({ type: VerifyEmailTokenDto })
    @ApiResponse({ status: 200, description: 'Token verified successfully', example: { message: 'Email verified successfully' } })
    async verifyEmailToken(@Body() verifyEmailTokenDto: VerifyEmailTokenDto) {
        return await this.agentService.verifyEmailToken(verifyEmailTokenDto.email, verifyEmailTokenDto.otp);
    }

    @Public()
    @Post('send-token')
    @ApiOperation({ summary: 'Resend verification token', description: 'Sends a new OTP to the agent\'s email address.' })
    @ApiBody({ type: ResendVerificationEmailDto })
    @ApiResponse({ status: 200, description: 'OTP sent successfully', example: { message: 'Verification pin sent successfully.' } })
    async sendTokenPost(@Body() dto: ResendVerificationEmailDto) {
        return this.resendVerificationToken(dto.email);
    }

    @Public()
    @Get('send-token/:email')
    @ApiOperation({ summary: 'Resend verification token (legacy)', description: 'Sends a new OTP to the agent\'s email address.' })
    @ApiResponse({ status: 200, description: 'OTP sent successfully', example: { message: 'Verification pin sent successfully.' } })
    async sendToken(@Param('email') email: string) {
        return this.resendVerificationToken(email);
    }

    private async resendVerificationToken(email: string) {
        if (!this.isValidEmail(email)) {
            throw new BadRequestException('Invalid email format.');
        }

        const result = await this.agentService.resendVerificationPin(email);
        return {
            message: result.emailDelivered
                ? 'Verification pin sent successfully.'
                : 'Verification code generated. Check your email or use the code provided in the app.',
            emailDelivered: result.emailDelivered,
            otp: result.otp,
        };
    }
    @Role(Roles.AGENT)
    @ApiBearerAuth()
    @Put('update-password')
    @ApiOperation({
        summary: 'Update password',
        description: 'Allows an authenticated agent to change their password by providing the current and new passwords.',
    })
    @ApiBody({ type: UpdatePasswordDto })
    @ApiResponse({
        status: 200,
        description: 'Password updated successfully',
        example: { message: 'Password updated successfully' },
    })
    @ApiResponse({ status: 400, description: 'Invalid password or other error' })
    async updatePassword(@Req() req: AuthenticatedRequest, @Body() dto: UpdatePasswordDto) {
        return await this.agentService.updatePassword(req.user.sub, dto.oldPassword, dto.newPassword);
    }

    @ApiBearerAuth()
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Update agent profile picture' })
    @ApiBody({
        description: 'Upload a new profile picture',
        type: UpdateProfilePicture,
    })
    @Patch('profile-picture')
    @UseInterceptors(FileInterceptor('profilePicture'))
    async updateProfilePicture(
        @Body() updateProfilePicture: UpdateProfilePicture,
        @Req() req: AuthenticatedRequest,
        @UploadedFile(new FileUploadPipe()) file: Express.Multer.File
    ) {
        const userId = req.user.sub;

        if (!file) {
            throw new BadRequestException('Profile picture is required.');
        }

        const uploadedUrl = await this.uploadService.uploadFile(file, 'agents');

        updateProfilePicture.profilePicture = uploadedUrl;

        return this.usersService.updateProfilePicture(userId, updateProfilePicture);
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

        return await this.agentService.forgotPassword(email);
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
        return await this.agentService.resetForgottenPassword(
            forgotPasswordDto
        );
    }

    /**
     * Protected Endpoints
     */
    @UseGuards(AuthGuard)
    @Role(Roles.AGENT)
    @ApiBearerAuth()
    @Put('profile')
    @ApiOperation({
        summary: 'Update agent profile',
        description: 'Allows an authenticated agent to update their profile information.',
    })
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({ status: 200, description: 'Profile updated successfully', example: { message: 'Profile updated' } })
    @ApiResponse({ status: 400, description: 'Invalid data format' })
    async createProfile(@Req() req: AuthenticatedRequest, @Body() updateUserDto: UpdateUserDto) {
        return await this.agentService.updateProfile(req.user.sub, updateUserDto);
    }
    @Role(Roles.ADMIN)
    @ApiBearerAuth()
    @Get('all')
    @ApiOperation({
        summary: 'Get all agents',
        description: 'Fetch all agents with optional filtering options',
    })
    @ApiResponse({
        status: 200,
        description: 'Returns paginated list of agents',
    })
    async getAllAgents(@Query() query: FilterAgentsDto) {
        return await this.agentService.findAllAgents(query);
    }

    @Get(':agentId/apartments')
    @Role(Roles.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get apartments for an agent',
        description: 'Retrieve all apartments belonging to a specific agent with optional status filtering.',
    })
    @ApiParam({ name: 'agentId', required: true, description: 'ID of the agent to retrieve apartments for.' })
    async getAgentApartments(
        @Param('agentId') agentId: string,
        @Query() query: GetAgentApartmentsDto
    ) {
        return await this.agentService.findAgentApartments(agentId, query);
    }

    @Get('me')
    @Role(Roles.AGENT)
    @ApiBearerAuth()
    async currentUser(@Req() req: AuthenticatedRequest) {
        return this.agentService.currentUser(req.user.agent);
    }

    @Post('kyc')
    @Role(Roles.AGENT, Roles.ADMIN)
    @ApiBearerAuth()
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

    @Get(':agentId/rides')
    @Role(Roles.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get rides for an agent',
        description: 'Retrieve all rides belonging to a specific agent with optional status filtering.',
    })
    @ApiParam({ name: 'agentId', required: true, description: 'ID of the agent to retrieve rides for.' })
    async getAgentRides(
        @Param('agentId') agentId: string,
        @Query() query: GetAgentRidesDto
    ) {
        return await this.agentService.findAgentRides(agentId, query);
    }

    @Patch('notifications/device-token')
    @Role(Roles.AGENT)
    @ApiOperation({ summary: 'Enable or disable notifications with device token' })
    @ApiBody({ type: UpdateDeviceTokenAndNotificationDto })
    @ApiResponse({ status: 200, description: 'Notification preference updated successfully' })
    async updateNotificationPreference(
        @Req() req,
        @Body() dto: UpdateDeviceTokenAndNotificationDto,
    ) {
        return await this.usersService.updateNotificationPreference(req.user.sub, dto);
    }

    @Role(Roles.AGENT, Roles.ADMIN)
    @ApiBearerAuth()
    @Get('metrics/:agentId')
    @ApiParam({
        name: 'agentId',
        required: false,
        description: 'Agent ID',
    })
    @ApiOperation({
        summary: 'Get agent metrics',
        description: 'Fetches the metrics for the authenticated agent.',
    })
    @ApiResponse({
        status: 200,
        description: 'Returns agent metrics',
        example: {
            totalBookings: 10,
            totalEarnings: 5000,
            bookings: 8,
            request: 2,
            favorites: 2,
        },
    })
    async getAgentMetrics(@Req() req: AuthenticatedRequest) {
        const { role, agent } = req.user;
        const agentId = role === Roles.ADMIN
            ? (req.query.agentId as string | undefined)
            : agent;

        if (role === Roles.ADMIN && !agentId) {
            throw new BadRequestException('agentId is required for admin users.');
        }
        return this.agentService.getAgentMetrics(agentId);
    }

    @Role(Roles.ADMIN)
    @ApiBearerAuth()
    @Get(':agentId')
    @ApiOperation({
        summary: 'Get agent by ID',
        description: 'Fetch a single agent by ID, including the populated user details.',
    })
    @ApiParam({
        name: 'agentId',
        required: true,
        description: 'The ID of the agent to retrieve',
    })
    @ApiResponse({
        status: 200,
        description: 'Agent retrieved successfully',
        example: {
            _id: '65123abcde4567f890123456',
            serviceType: 'apartment',
            userId: {
                _id: '65123abcde4567f890123457',
                firstname: 'John',
                lastname: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+1234567890',
                profilePicture: 'https://example.com/profile.jpg',
                balance: 150.5,
                isEmailVerified: true,
                role: 'AGENT'
            }
        }
    })
    async getAgentById(@Param('agentId') agentId: string) {
        return await this.agentService.getAgentById(agentId);
    }



    @Delete(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Role(Roles.ADMIN)
    @ApiOperation({ summary: 'Delete an agent profile (Admin only)' })
    @ApiParam({ name: 'id', description: 'Agent ID to delete' })
    @ApiResponse({ status: 200, description: 'Agent profile deleted successfully' })
    async deleteAgent(@Param('id') agentId: string) {
        return await this.agentService.softDeleteAgentById(agentId);
    }

    /**
     * Utility Methods
     */

    private isValidEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}
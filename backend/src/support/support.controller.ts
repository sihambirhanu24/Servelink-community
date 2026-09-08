import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SuspensionGuard } from '../suspension/guards/suspension.guard';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { QuerySupportRequestDto } from './dto/query-support-request.dto';
import { QueryProvidersDto } from './dto/query-providers.dto';
import { CreateRatingDto } from './dto/create-rating.dto';
import { CreateFinancialSupportRequestDto } from './dto/create-financial-support.dto';
import { ContributeFinancialSupportDto } from './dto/contribute-financial-support.dto';
import { FinancialSupportService } from './financial-support.service';

@ApiTags('Support')
@Controller('support')
@UseGuards(JwtAuthGuard, SuspensionGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly financialSupportService: FinancialSupportService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // PROVIDER PROFILE
  // ─────────────────────────────────────────────────────────────────────────

  @Post('provider-profile')
  @ApiOperation({ summary: 'Create or update provider profile' })
  async createOrUpdateProviderProfile(
    @CurrentUser() user: any,
    @Body() dto: CreateProviderProfileDto,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.supportService.createOrUpdateProviderProfile(teacherId, dto);
  }

  @Patch('provider-profile')
  @ApiOperation({ summary: 'Update provider profile' })
  async updateProviderProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProviderProfileDto,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.supportService.createOrUpdateProviderProfile(teacherId, dto);
  }

  @Get('provider-profile/me')
  @ApiOperation({ summary: 'Get my provider profile' })
  async getMyProviderProfile(@CurrentUser() user: any) {
    const teacherId = user.sub ?? user.id;
    return this.supportService.getMyProviderProfile(teacherId);
  }

  @Get('provider-profile/:teacherId')
  @ApiOperation({ summary: 'Get provider profile by teacher ID' })
  async getProviderProfile(@Param('teacherId') teacherId: string) {
    return this.supportService.getProviderProfile(teacherId);
  }

  @Get('providers')
  @ApiOperation({ summary: 'Discover support providers' })
  async discoverProviders(@Query() query: QueryProvidersDto) {
    return this.supportService.discoverProviders(query);
  }

  @Get('provider-stats')
  @ApiOperation({ summary: 'Get my provider statistics' })
  async getProviderStats(@CurrentUser() user: any) {
    const teacherId = user.sub ?? user.id;
    return this.supportService.getProviderStats(teacherId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SUPPORT REQUESTS
  // ─────────────────────────────────────────────────────────────────────────

  @Post('requests')
  @ApiOperation({ summary: 'Create a support request' })
  async createSupportRequest(
    @CurrentUser() user: any,
    @Body() dto: CreateSupportRequestDto,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.supportService.createSupportRequest(teacherId, dto);
  }

  @Get('requests/my-requests')
  @ApiOperation({ summary: 'Get my support requests (as requester)' })
  async getMySupportRequests(
    @CurrentUser() user: any,
    @Query() query: QuerySupportRequestDto,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.supportService.getMySupportRequests(teacherId, query);
  }

  @Get('requests/provider-requests')
  @ApiOperation({ summary: 'Get requests assigned to me (as provider)' })
  async getProviderRequests(
    @CurrentUser() user: any,
    @Query() query: QuerySupportRequestDto,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.supportService.getProviderRequests(teacherId, query);
  }

  @Get('requests/:requestId')
  @ApiOperation({ summary: 'Get support request details' })
  async getSupportRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: any,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.supportService.getSupportRequest(requestId, teacherId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REQUEST STATUS MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  @Patch('requests/:requestId/accept')
  @ApiOperation({ summary: 'Accept a support request (provider only)' })
  async acceptRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: any,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.supportService.acceptRequest(requestId, teacherId);
  }

  @Patch('requests/:requestId/decline')
  @ApiOperation({ summary: 'Decline a support request (provider only)' })
  async declineRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: any,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.supportService.declineRequest(requestId, teacherId);
  }

  @Patch('requests/:requestId/start')
  @ApiOperation({ summary: 'Start providing support (provider only)' })
  async startSupport(
    @Param('requestId') requestId: string,
    @CurrentUser() user: any,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.supportService.startSupport(requestId, teacherId);
  }

  @Patch('requests/:requestId/complete')
  @ApiOperation({ summary: 'Mark support as completed (provider only)' })
  async completeRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: any,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.supportService.completeRequest(requestId, teacherId);
  }

  @Patch('requests/:requestId/cancel')
  @ApiOperation({ summary: 'Cancel support request (requester only)' })
  async cancelRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: any,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.supportService.cancelRequest(requestId, teacherId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RATING
  // ─────────────────────────────────────────────────────────────────────────

  @Post('requests/:requestId/rate')
  @ApiOperation({ summary: 'Rate completed support (requester only)' })
  async rateProvider(
    @Param('requestId') requestId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateRatingDto,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.supportService.rateProvider(requestId, teacherId, dto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHAT INTEGRATION
  // ─────────────────────────────────────────────────────────────────────────

  @Get('requests/:requestId/chat')
  @ApiOperation({ summary: 'Get chat room for support request' })
  async getSupportChatRoom(
    @Param('requestId') requestId: string,
    @CurrentUser() user: any,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.supportService.getSupportChatRoom(requestId, teacherId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATISTICS
  // ─────────────────────────────────────────────────────────────────────────

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats() {
    return this.supportService.getDashboardStats();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FINANCIAL SUPPORT
  // ─────────────────────────────────────────────────────────────────────────

  @Post('financial-requests')
  @ApiOperation({ summary: 'Create a financial support request' })
  async createFinancialSupportRequest(
    @CurrentUser() user: any,
    @Body() dto: CreateFinancialSupportRequestDto,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.financialSupportService.createFinancialSupportRequest(teacherId, dto);
  }

  @Get('financial-requests')
  @ApiOperation({ summary: 'Get all financial support requests (with filters)' })
  async getFinancialSupportRequests(
    @Query('status') status?: string,
    @Query('requesterId') requesterId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.financialSupportService.getFinancialSupportRequests({
      status: status as any,
      requesterId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('financial-requests/:requestId')
  @ApiOperation({ summary: 'Get financial support request details' })
  async getFinancialSupportRequestById(@Param('requestId') requestId: string) {
    return this.financialSupportService.getFinancialSupportRequestById(requestId);
  }

  @Post('financial-requests/contribute')
  @ApiOperation({ summary: 'Contribute to a financial support request' })
  async contributeToFinancialSupport(
    @CurrentUser() user: any,
    @Body() dto: ContributeFinancialSupportDto,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.financialSupportService.contributeToFinancialSupport(teacherId, dto);
  }

  @Patch('financial-requests/:requestId/cancel')
  @ApiOperation({ summary: 'Cancel a financial support request' })
  async cancelFinancialSupportRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: any,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.financialSupportService.cancelFinancialSupportRequest(requestId, teacherId);
  }

  @Get('financial-contributions/my-contributions')
  @ApiOperation({ summary: 'Get my contribution history' })
  async getMyContributions(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const teacherId = user.sub ?? user.id;
    return this.financialSupportService.getTeacherContributions(
      teacherId,
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
    );
  }
}

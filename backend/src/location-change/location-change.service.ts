import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationEvent } from '../notification/notification.types';
import { LocationChangeStatus, Teacher } from '@prisma/client';
import { CreateLocationChangeDto } from './dto/create-location-change.dto';
import { RejectLocationChangeDto } from './dto/reject-location-change.dto';
import * as fs from 'fs';

@Injectable()
export class LocationChangeService {
  private readonly logger = new Logger(LocationChangeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async getAvailableSchools() {
    // Get unique schools along with their woreda, zone, and region
    const schools = await this.prisma.community.findMany({
      where: { type: 'SCHOOL' },
      select: {
        school: true,
        woreda: true,
        zone: true,
        region: true,
      },
      distinct: ['school'],
      orderBy: { school: 'asc' },
    });

    return schools.filter(s => s.school);
  }

  async getMyRequests(teacherId: string) {
    return this.prisma.teacherLocationChangeRequest.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async submitRequest(
    teacherId: string,
    dto: CreateLocationChangeDto,
    file?: Express.Multer.File,
  ) {
    // Check if there is an existing PENDING request
    const existing = await this.prisma.teacherLocationChangeRequest.findFirst({
      where: {
        teacherId,
        status: LocationChangeStatus.PENDING,
      },
    });

    if (existing) {
      throw new BadRequestException('You already have a pending location change request.');
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return this.prisma.teacherLocationChangeRequest.create({
      data: {
        teacherId,
        currentSchool: teacher.school || null,
        currentWoreda: teacher.woreda || null,
        currentZone: teacher.zone || null,
        currentRegion: teacher.region || null,
        currentSubject: teacher.subject || null,
        requestedSchool: dto.requestedSchool || null,
        requestedWoreda: dto.requestedWoreda || null,
        requestedZone: dto.requestedZone || null,
        requestedRegion: dto.requestedRegion || null,
        requestedSubject: dto.requestedSubject || null,
        reason: dto.reason,
        fileName: file?.originalname,
        filePath: file ? file.path.replace(/\\/g, '/') : null,
        mimeType: file?.mimetype,
        fileSize: file?.size,
        status: LocationChangeStatus.PENDING,
      },
    });
  }

  async cancelRequest(requestId: string, teacherId: string) {
    const request = await this.prisma.teacherLocationChangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.teacherId !== teacherId) {
      throw new ForbiddenException('You can only cancel your own requests');
    }

    if (request.status !== LocationChangeStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    return this.prisma.teacherLocationChangeRequest.update({
      where: { id: requestId },
      data: { status: LocationChangeStatus.CANCELLED },
    });
  }

  async getAllRequests(status?: LocationChangeStatus) {
    return this.prisma.teacherLocationChangeRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            level: true,
            subject: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRequestById(id: string) {
    const request = await this.prisma.teacherLocationChangeRequest.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            level: true,
            subject: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return request;
  }

  async approveRequest(id: string, adminId: string) {
    const request = await this.prisma.teacherLocationChangeRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== LocationChangeStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark request as approved
      const updatedRequest = await tx.teacherLocationChangeRequest.update({
        where: { id },
        data: {
          status: LocationChangeStatus.APPROVED,
          adminId,
          reviewedAt: new Date(),
        },
      });

      // 2. Create history record
      await tx.teacherLocationHistory.create({
        data: {
          teacherId: request.teacherId,
          school: request.currentSchool,
          woreda: request.currentWoreda,
          zone: request.currentZone,
          region: request.currentRegion,
          subject: request.currentSubject,
          startedAt: new Date(), // We don't track the exact start time in Teacher yet
          endedAt: new Date(),
          changeRequestId: request.id,
        },
      });

      // 3. Update teacher location
      const updateData: any = {};
      if (request.requestedSchool !== null) updateData.school = request.requestedSchool;
      if (request.requestedWoreda !== null) updateData.woreda = request.requestedWoreda;
      if (request.requestedZone !== null) updateData.zone = request.requestedZone;
      if (request.requestedRegion !== null) updateData.region = request.requestedRegion;
      if (request.requestedSubject !== null) updateData.subject = request.requestedSubject;

      if (Object.keys(updateData).length > 0) {
        await tx.teacher.update({
          where: { id: request.teacherId },
          data: updateData,
        });
      }

      // 4. Remove teacher from all geographic communities they joined
      await tx.communityMember.deleteMany({
        where: {
          teacherId: request.teacherId,
          community: {
            type: { not: 'NATIONAL' },
          },
        },
      });

      // 5. Notify teacher
      this.notificationService
        .create({
          receiverId: request.teacherId,
          title: 'Location Change Approved',
          message: `Your request to transfer to ${request.requestedSchool} has been approved.`,
          type: NotificationEvent.SYSTEM,
        })
        .catch((err) =>
          this.logger.error(`Failed to send approval notification: ${err.message}`),
        );

      return updatedRequest;
    });
  }

  async rejectRequest(id: string, adminId: string, dto: RejectLocationChangeDto) {
    const request = await this.prisma.teacherLocationChangeRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== LocationChangeStatus.PENDING) {
      throw new BadRequestException('Request is not pending');
    }

    const updatedRequest = await this.prisma.teacherLocationChangeRequest.update({
      where: { id },
      data: {
        status: LocationChangeStatus.REJECTED,
        adminId,
        adminComment: dto.reason,
        reviewedAt: new Date(),
      },
    });

    // Notify teacher
    this.notificationService
      .create({
        receiverId: request.teacherId,
        title: 'Location Change Rejected',
        message: `Your request to transfer to ${request.requestedSchool} was rejected. Reason: ${dto.reason}`,
        type: NotificationEvent.SYSTEM,
      })
      .catch((err) =>
        this.logger.error(`Failed to send rejection notification: ${err.message}`),
      );

    return updatedRequest;
  }

  async getDocument(requestId: string, requesterId: string, isAdmin: boolean) {
    const request = await this.prisma.teacherLocationChangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (!isAdmin && request.teacherId !== requesterId) {
      throw new ForbiddenException('You do not have permission to view this document');
    }

    if (!request.filePath || !fs.existsSync(request.filePath)) {
      throw new NotFoundException('Document file not found on server');
    }

    return {
      request,
      filePath: request.filePath,
    };
  }
}

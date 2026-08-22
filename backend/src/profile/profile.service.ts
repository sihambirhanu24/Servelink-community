import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class ProfileService {
    constructor(
    private prisma: PrismaService,
){}

        async myPosts(
teacherId:string,
){

return this.prisma.communityPost.findMany({
  where: {
    teacherId,
  },
  include: {
    teacher: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        level: true,
        verified: true,
      },
    },
    community: true,
    category: true,
    communityLikes: true,
    comments: true,
    attachments: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
});

}

  async getProfile(id: string) {
    return this.prisma.teacher.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profileImage: true,
        level: true,
        subject: true,
        department: true,
        verified: true,
        school: true,
        woreda: true,
        zone: true,
        region: true,
        gender: true,
        dateOfBirth: true,
        bio: true,
        phone: true,
        profession: true,
        specialization: true,
        skills: true,
        gradeLevel: true,
        yearsOfExperience: true,
        schoolType: true,
        city: true,
        schoolLocation: true,
        verificationStatus: true,
      },
    });
  }

  async updateProfilePhoto(teacherId: string, filename: string) {
    const profileImage = `uploads/profile/${filename}`; // Store without leading slash
    const updated = await this.prisma.teacher.update({
      where: { id: teacherId },
      data: { profileImage },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
      },
    });
    return {
      success: true,
      profileImage: updated.profileImage,
    };
  }

async updateProfile(
  teacherId: string,
  dto: UpdateProfileDto,
) {
  return this.prisma.teacher.update({
    where: {
      id: teacherId,
    },
    data: {
      firstName: dto.firstName,
      lastName: dto.lastName,
      school: dto.school,
      region: dto.region,
      woreda: dto.woreda,
      zone: dto.zone,
      subject: dto.subject,
      department: dto.department,
      profileImage: dto.profileImage,
      // Personal
      gender: dto.gender,
      bio: dto.bio,
      phone: dto.phone,
      // Professional
      profession: dto.profession,
      specialization: dto.specialization,
      skills: dto.skills,
      gradeLevel: dto.gradeLevel,
      yearsOfExperience: dto.yearsOfExperience,
      // School
      schoolType: dto.schoolType,
      city: dto.city,
      schoolLocation: dto.schoolLocation,
    },
  });
}
        async changePassword(
  teacherId: string,
  oldPassword: string,
  newPassword: string,
) {

  const teacher =
    await this.prisma.teacher.findUnique({
      where: {
        id: teacherId,
      },
    });

  if (!teacher)
    throw new Error('Teacher not found');

  const valid =
    await bcrypt.compare(
      oldPassword,
      teacher.password,
    );

  if (!valid)
    throw new Error(
      'Old password incorrect',
    );

  const hashed =
    await bcrypt.hash(newPassword, 10);

  return this.prisma.teacher.update({
    where: {
      id: teacherId,
    },
    data: {
      password: hashed,
    },
  });
}
    
    async myCommunities(
teacherId:string,
){

return this.prisma.communityMember.findMany({

where:{
teacherId,
},

include:{
community:true,
},

orderBy:{
createdAt:'desc',
},

});

}
async myBookmarks(
  teacherId: string,
) {
  return this.prisma.communityBookmark.findMany({
    where: { teacherId },
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              level: true,
              verified: true,
            },
          },
          community: true,
          category: true,
          attachments: true,
          communityLikes: true,
          comments: true,
        },
      },
    },
  });
}

}

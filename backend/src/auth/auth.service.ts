import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';



import { PrismaService } from '../prisma/prisma.service';
import { MailService } from "../mail/mail.service";
import { RegisterDto } from '../auth/dto/register.dto';
import { LoginDto } from '../auth/dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
private mailService: MailService,
) {}

 
  async register(registerDto: RegisterDto) {
    const { email, password, ...teacherData } = registerDto;

    const existingTeacher = await this.prisma.teacher.findUnique({
      where: {
        email,
      },
    });

    if (existingTeacher) {
      throw new ConflictException('Email already exists');
    }

  
    const hashedPassword = await bcrypt.hash(password, 10);


    const teacher = await this.prisma.teacher.create({
  data: {
    firstName: registerDto.firstName,
    lastName: registerDto.lastName,
    email: registerDto.email,
    password: hashedPassword,
    school: registerDto.school,
    woreda: registerDto.woreda,
    zone: registerDto.zone,
    region: registerDto.region,
    subject: registerDto.subject,

    level: "LEVEL_1", //level0
     },

  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    level: true, 
    school: true,
    woreda: true,
    zone: true,
    region: true,
    createdAt: true,
    updatedAt: true,
  },
});

    const accessToken = await this.jwtService.signAsync({
      sub: teacher.id,
      email: teacher.email,
      // Key MUST be 'teacherLevel' — RolesGuard reads user.teacherLevel,
      // not user.level. Changing this here without changing the guard
      // (or vice versa) breaks admin access silently.
      teacherLevel: teacher.level,
      isAdmin: false,
    });

    return {
      accessToken,
      teacher,
    };
  }

  
  async login(loginDto: LoginDto) {
    // 1. Try teacher table first
    const teacher = await this.prisma.teacher.findUnique({
      where: { email: loginDto.email },
    });

    if (teacher) {
      const isPasswordValid = await bcrypt.compare(loginDto.password, teacher.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const payload = {
        sub: teacher.id,
        email: teacher.email,
        teacherLevel: teacher.level,
        isAdmin: false,
      };
      const accessToken = await this.jwtService.signAsync(payload);
      return {
        accessToken,
        teacher: {
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          profileImage: teacher.profileImage,
          subject: teacher.subject,
          verified: teacher.verified,
          level: teacher.level,
          school: teacher.school,
          woreda: teacher.woreda,
          zone: teacher.zone,
          region: teacher.region,
        },
      };
    }

    // 2. Fall through to admin table
    const admin = await this.prisma.admin.findUnique({
      where: { email: loginDto.email },
    });

    if (admin) {
      const isPasswordValid = await bcrypt.compare(loginDto.password, admin.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const payload = {
        sub: admin.id,
        email: admin.email,
        teacherLevel: 'ADMIN',
        isAdmin: true,
      };
      const accessToken = await this.jwtService.signAsync(payload);
      return {
        accessToken,
        // 'admin' key signals the frontend to redirect to /admin
        admin: { id: admin.id, name: admin.name, email: admin.email },
      };
    }

    // 3. Neither found
    throw new UnauthorizedException('Invalid email or password');
  }
 async me(id: string) {
  return this.prisma.teacher.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImage: true,
      verified: true,
      level: true,
      school: true,
      woreda: true,
      zone: true,
      region: true,
    },
  });
}

async forgotPassword(email: string) {
  try {
    

    const teacher = await this.prisma.teacher.findUnique({
      where: { email },
    });

    console.log("Teacher:", teacher);

    if (!teacher) {
      console.log("Teacher not found");
      return {
        message: "If the email exists, a reset link has been sent.",
      };
    }

    const token = this.jwtService.sign(
      {
        sub: teacher.id,
      },
      {
        expiresIn: "15m",
      },
    );

   

  

  await this.mailService.sendResetEmail(
  email,
  token,
);
    console.log("Email sent successfully");

    return {
      message: "Reset email sent.",
    };
  } catch (error) {
    console.error("Forgot Password Error");
    console.error(error);
    console.error(error.stack);

    throw error;
  }
}

async resetPassword(token: string, password: string) {
  console.log("=== resetPassword ===");
  console.log("Token:", token);
  console.log("Password:", password);

  const payload = this.jwtService.verify(token);
  console.log("Payload:", payload);

  const hashed = await bcrypt.hash(password, 10);
  console.log("Hashed");

  await this.prisma.teacher.update({
    where: { id: payload.sub },
    data: { password: hashed },
  });

  console.log("Password updated");

  return {
    message: "Password updated successfully",
  };
}

  async adminLogin(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      throw new UnauthorizedException('Invalid admin email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin email or password');
    }

    const payload = {
      sub: admin.id,
      email: admin.email,
      // 'ADMIN' is the role the RolesGuard checks for on every admin route.
      // Issued only from this path, authenticating against the Admin table.
      teacherLevel: 'ADMIN',
      isAdmin: true,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    };
  }
}
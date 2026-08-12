import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * DatabaseService seeds only stable, non-geographic data at startup.
 *
 * Communities are NOT seeded here anymore. They are auto-created on-demand
 * by ChatService.ensureTeacherCommunities() the first time a teacher
 * accesses their chat groups. This prevents stale hardcoded records
 * (e.g. "Test School", "Addis Ababa Woreda") from masking real teacher data.
 */
@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly CATEGORIES = [
    'Lesson Plans',
    'Teaching Strategies',
    'Learning Activities',
    'Assessments & Exams',
    'Teaching Resources',
    'Curriculum & Syllabus',
    'Classroom Management',
    'Educational Technology',
    'Student Support',
    'Professional Development',
    'STEM & Innovation',
    'Best Practices',
    'Discussion & Questions',
    'Announcements',
    'General',
  ];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.seedCategories();
    } catch (error) {
      console.error('Failed to seed database:', error);
    }
  }

  private async seedCategories() {
    let created = 0;
    let skipped = 0;

    for (const name of this.CATEGORIES) {
      const existing = await this.prisma.category.findUnique({ where: { name } });
      if (existing) {
        skipped++;
      } else {
        await this.prisma.category.create({ data: { name } });
        created++;
      }
    }

    if (created > 0 || skipped > 0) {
      console.log(
        `✓ Categories: ${created} created, ${skipped} skipped, ${this.CATEGORIES.length} total`,
      );
    }
  }
}

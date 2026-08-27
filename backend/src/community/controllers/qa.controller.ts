import {
  Body, Controller, Delete, Get, Param, Post, Query,
  Request, UseGuards, DefaultValuePipe, ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VerifiedTeacherGuard } from '../../verification/guards/verified-teacher.guard';
import { QaService } from '../services/qa.service';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// ─── Simple inline DTOs ───────────────────────────────────────────────────────

class CreateQuestionBodyDto {
  @IsString() @IsNotEmpty() communityType: string;
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() description: string;
  @IsString() @IsNotEmpty() categoryId: string;
  @IsNotEmpty() deadline: number | string;
}

class SubmitAnswerBodyDto {
  @IsString() @IsNotEmpty() content: string;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Q&A')
@ApiBearerAuth()
@Controller('community/questions')
@UseGuards(JwtAuthGuard)
export class QaController {
  constructor(private readonly qaService: QaService) {}

  /** GET /community/questions — list with filters */
  @ApiOperation({ summary: 'List questions with filters/sorting' })
  @Get()
  listQuestions(
    @Request() req: any,
    @Query('status')  status?: string,
    @Query('sort')    sort?: string,
    @Query('search')  search?: string,
    @Query('mine')    mine?: string,
    @Query('communityType') communityType?: string,
    @Query('page',    new DefaultValuePipe(1),  ParseIntPipe) page: number = 1,
    @Query('limit',   new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    return this.qaService.getQuestions(req.user.sub, {
      status:  status as any,
      sort:    sort as any,
      search,
      mine:    mine === 'true',
      communityType,
      page,
      limit,
    });
  }

  /** POST /community/questions — create a new question */
  @ApiOperation({ summary: 'Create a question' })
  @Post()
  @UseGuards(VerifiedTeacherGuard)
  createQuestion(@Request() req: any, @Body() dto: CreateQuestionBodyDto) {
    console.log('[QaController] createQuestion called:', { userSub: req.user?.sub, dto });
    return this.qaService.createQuestion(req.user.sub, dto);
  }

  /** GET /community/questions/:id — question detail */
  @ApiOperation({ summary: 'Get question detail' })
  @Get(':id')
  getQuestion(@Param('id') id: string, @Request() req: any) {
    return this.qaService.getQuestion(id, req.user.sub);
  }

  /** GET /community/questions/:id/answers — answers (blind-enforced) */
  @ApiOperation({ summary: 'Get answers (blind-period enforced server-side)' })
  @Get(':id/answers')
  getAnswers(@Param('id') id: string, @Request() req: any) {
    return this.qaService.getAnswers(id, req.user.sub);
  }

  /** POST /community/questions/:id/answers — submit an answer */
  @ApiOperation({ summary: 'Submit an answer' })
  @Post(':id/answers')
  @UseGuards(VerifiedTeacherGuard)
  submitAnswer(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: SubmitAnswerBodyDto,
  ) {
    return this.qaService.submitAnswer(id, req.user.sub, dto);
  }

  /** DELETE /community/questions/:id/answers/:answerId — delete own answer */
  @ApiOperation({ summary: 'Delete own answer (only while question is OPEN)' })
  @Delete(':id/answers/:answerId')
  deleteAnswer(
    @Param('id') questionId: string,
    @Param('answerId') answerId: string,
    @Request() req: any,
  ) {
    return this.qaService.deleteAnswer(questionId, answerId, req.user.sub);
  }

  /** POST /community/questions/:id/best-answer/:answerId — select best answer */
  @ApiOperation({ summary: 'Select best answer (asker only, after question closes)' })
  @Post(':id/best-answer/:answerId')
  @UseGuards(VerifiedTeacherGuard)
  selectBestAnswer(
    @Param('id') questionId: string,
    @Param('answerId') answerId: string,
    @Request() req: any,
  ) {
    return this.qaService.selectBestAnswer(questionId, answerId, req.user.sub);
  }

  /** POST /community/answers/:answerId/helpful — toggle helpful */
  @ApiOperation({ summary: 'Toggle helpful on an answer (only after question closes)' })
  @Post('/answers/:answerId/helpful')
  @UseGuards(VerifiedTeacherGuard)
  toggleHelpful(@Param('answerId') answerId: string, @Request() req: any) {
    return this.qaService.toggleHelpful(answerId, req.user.sub);
  }

  /** DELETE /community/answers/:answerId/helpful — remove helpful */
  @ApiOperation({ summary: 'Remove helpful vote' })
  @Delete('/answers/:answerId/helpful')
  removeHelpful(@Param('answerId') answerId: string, @Request() req: any) {
    return this.qaService.toggleHelpful(answerId, req.user.sub);
  }
}

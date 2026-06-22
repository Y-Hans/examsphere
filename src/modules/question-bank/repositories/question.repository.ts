import { prisma } from '@/server/infrastructure/prisma/client';
import { TenantAwareRepository } from '@/server/infrastructure/prisma/base-repository';
import { QuestionQueryInput } from '../dto/question.dto';
import { getPaginationParams } from '@/server/shared/pagination';

export class QuestionRepository extends TenantAwareRepository<any> {
  constructor() {
    super(prisma.question as any);
  }

  async createWithVersion(data: any, creatorId: string) {
    return prisma.$transaction(async (tx) => {
      const question = await tx.question.create({
        data: {
          tenantId: data.tenantId,
          type: data.type,
          status: 'DRAFT',
          difficulty: data.difficulty,
          sourceType: data.sourceType,
          examId: data.examId,
          subjectId: data.subjectId,
          createdBy: creatorId,
          currentVersion: 1,
        },
      });

      const version = await tx.questionVersion.create({
        data: {
          questionId: question.id,
          versionNo: 1,
          statement: data.statement,
          optionA: data.optionA,
          optionB: data.optionB,
          optionC: data.optionC,
          optionD: data.optionD,
          correctOptions: data.correctOptions,
          solution: data.solution,
          hintLevel1: data.hintLevel1,
          hintLevel2: data.hintLevel2,
          hintLevel3: data.hintLevel3,
          marksCorrect: data.marksCorrect,
          marksWrong: data.marksWrong,
          pyqYear: data.pyqYear,
          pyqExamSession: data.pyqExamSession,
          pyqShift: data.pyqShift,
          estTimeSec: data.estTimeSec,
          changeSummary: 'Initial creation',
          createdBy: creatorId,
        },
      });

      if (data.topicIds && data.topicIds.length > 0) {
        await tx.questionTopic.createMany({
          data: data.topicIds.map((topicId: string) => ({ questionId: question.id, topicId })),
        });
      }

      if (data.tagIds && data.tagIds.length > 0) {
        await tx.questionTag.createMany({
          data: data.tagIds.map((tagId: string) => ({ questionId: question.id, tagId })),
        });
      }

      return { question, version };
    });
  }

  async updateWithVersion(questionId: string, data: any, updaterId: string) {
    return prisma.$transaction(async (tx) => {
      const question = await tx.question.findUniqueOrThrow({ where: { id: questionId } });
      
      // Update metadata
      await tx.question.update({
        where: { id: questionId },
        data: {
          type: data.metadata.type || question.type,
          difficulty: data.metadata.difficulty || question.difficulty,
          sourceType: data.metadata.sourceType || question.sourceType,
          examId: data.metadata.examId || question.examId,
          subjectId: data.metadata.subjectId || question.subjectId,
          currentVersion: { increment: 1 },
          status: 'DRAFT', // Revert to draft on edit
        },
      });

      const newVersionNo = question.currentVersion + 1;

      const version = await tx.questionVersion.create({
        data: {
          questionId: questionId,
          versionNo: newVersionNo,
          statement: data.content.statement,
          optionA: data.content.optionA,
          optionB: data.content.optionB,
          optionC: data.content.optionC,
          optionD: data.content.optionD,
          correctOptions: data.content.correctOptions,
          solution: data.content.solution,
          hintLevel1: data.content.hintLevel1,
          hintLevel2: data.content.hintLevel2,
          hintLevel3: data.content.hintLevel3,
          marksCorrect: data.content.marksCorrect,
          marksWrong: data.content.marksWrong,
          pyqYear: data.content.pyqYear,
          pyqExamSession: data.content.pyqExamSession,
          pyqShift: data.content.pyqShift,
          estTimeSec: data.content.estTimeSec,
          changeSummary: data.content.changeSummary || `Updated to version ${newVersionNo}`,
          createdBy: updaterId,
        },
      });

      // Update topics if provided
      if (data.metadata.topicIds) {
        await tx.questionTopic.deleteMany({ where: { questionId } });
        await tx.questionTopic.createMany({
          data: data.metadata.topicIds.map((topicId: string) => ({ questionId, topicId })),
        });
      }

      return version;
    });
  }

  async findWithLatestVersion(id: string) {
    const question = await prisma.question.findUniqueOrThrow({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNo: 'desc' },
          take: 1,
        },
        topics: true,
        tags: true,
      },
    });
    return question;
  }

  async listQuestions(query: QuestionQueryInput) {
    const { skip, take, page, pageSize } = getPaginationParams(query);
    
    const where = {
      examId: query.examId,
      subjectId: query.subjectId,
      difficulty: query.difficulty,
      status: query.status,
      topics: query.topicId ? { some: { topicId: query.topicId } } : undefined,
      OR: query.search ? [
        { versions: { some: { statement: { contains: query.search, insensitive: true } } } }
      ] : undefined,
    };

    const [data, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          versions: {
            orderBy: { versionNo: 'desc' },
            take: 1,
            select: { statement: true, versionNo: true }
          },
          topics: { include: { topic: true } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.question.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}

export const questionRepository = new QuestionRepository();
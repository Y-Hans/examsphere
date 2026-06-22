import { prisma } from '@/server/infrastructure/prisma/client';
import { TenantAwareRepository } from '@/server/infrastructure/prisma/base-repository';
import { CreateTestTemplateInput } from '../dto/exam.dto';

export class ExamRepository extends TenantAwareRepository<any> {
  constructor() {
    super(prisma.testTemplate as any);
  }

  async createTemplateWithSections(data: CreateTestTemplateInput & { tenantId: string, createdBy: string }) {
    return prisma.$transaction(async (tx) => {
      const template = await tx.testTemplate.create({
        data: {
          tenantId: data.tenantId,
          name: data.name,
          type: data.type,
          examId: data.examId,
          durationMin: data.durationMin,
          totalMarks: data.totalMarks,
          scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : null,
          scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : null,
          status: 'PUBLISHED',
          createdBy: data.createdBy,
        },
      });

      for (const sectionData of data.sections) {
        const section = await tx.testSection.create({
          data: {
            templateId: template.id,
            subjectId: sectionData.subjectId,
            name: sectionData.name,
            questionCount: sectionData.questionCount,
            marksCorrect: sectionData.marksCorrect,
            marksWrong: sectionData.marksWrong,
            durationMin: sectionData.durationMin,
            orderNo: sectionData.orderNo,
          },
        });

        await tx.testSectionQuestion.createMany({
          data: sectionData.questionIds.map((qId, index) => ({
            sectionId: section.id,
            questionId: qId,
            orderNo: index + 1,
          })),
        });
      }

      return template;
    });
  }

  async getTemplateDetails(templateId: string) {
    return prisma.testTemplate.findUnique({
      where: { id: templateId },
      include: {
        sections: {
          orderBy: { orderNo: 'asc' },
          include: {
            questions: {
              orderBy: { orderNo: 'asc' },
              include: {
                question: {
                  include: {
                    versions: {
                      orderBy: { versionNo: 'desc' },
                      take: 1,
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  async startSession(templateId: string, userId: string, tenantId: string) {
    return prisma.$transaction(async (tx) => {
      const template = await tx.testTemplate.findUnique({
        where: { id: templateId },
        include: { sections: { include: { questions: true } } }
      });

      if (!template) throw new Error('Template not found');

      const session = await tx.testSession.create({
        data: {
          templateId,
          userId,
          tenantId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      // Snapshot questions into test_responses to lock the test state
      for (const section of template.sections) {
        for (const sq of section.questions) {
          await tx.testResponse.create({
            data: {
              sessionId: session.id,
              questionId: sq.questionId,
              sectionId: section.id,
              status: 'NOT_VISITED',
              isCorrect: false,
              marksAwarded: 0,
            }
          });
        }
      }

      return session;
    });
  }

  async saveResponse(data: any) {
    const existing = await prisma.testResponse.findFirst({
      where: { sessionId: data.sessionId, questionId: data.questionId }
    });

    if (!existing) throw new Error('Response record not found');

    const updateData: any = {
      responseValue: data.responseValue,
      status: data.status,
      timeSpentSec: { increment: data.timeSpentSec },
    };

    if (data.status === 'VISITED' && !existing.visitedAt) {
      updateData.visitedAt = new Date();
    }
    if (data.status === 'ANSWERED' || data.status === 'ANSWERED_REVIEW') {
      updateData.answeredAt = new Date();
    }

    return prisma.testResponse.update({
      where: { id: existing.id },
      data: updateData,
    });
  }

  async getSessionForGrading(sessionId: string) {
    return prisma.testSession.findUnique({
      where: { id: sessionId },
      include: {
        template: {
          include: {
            sections: true
          }
        },
        responses: {
          include: {
            question: {
              include: {
                versions: {
                  orderBy: { versionNo: 'desc' },
                  take: 1
                }
              }
            }
          }
        }
      }
    });
  }

  async updateSessionResults(sessionId: string, data: { totalScore: number, status: string, submittedAt: Date, responses: any[] }) {
    return prisma.$transaction(async (tx) => {
      await tx.testSession.update({
        where: { id: sessionId },
        data: {
          totalScore: data.totalScore,
          status: data.status,
          submittedAt: data.submittedAt,
        },
      });

      // Update individual response grades
      for (const response of data.responses) {
        await tx.testResponse.update({
          where: { id: response.id },
          data: {
            isCorrect: response.isCorrect,
            marksAwarded: response.marksAwarded,
          },
        });
      }
    });
  }

  async getActiveSession(userId: string, templateId: string) {
    return prisma.testSession.findFirst({
      where: {
        userId,
        templateId,
        status: 'IN_PROGRESS'
      }
    });
  }
}

export const examRepository = new ExamRepository();
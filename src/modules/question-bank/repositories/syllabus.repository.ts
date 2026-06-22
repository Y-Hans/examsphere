import { prisma } from '@/server/infrastructure/prisma/client';
import { TenantAwareRepository } from '@/server/infrastructure/prisma/base-repository';
import { TenantContext } from '@/server/shared/tenant-context';
import { NotFoundError } from '@/server/shared/errors';

export class SyllabusRepository extends TenantAwareRepository<any> {
  constructor() {
    super(prisma.subject as any); // Base delegate, though we handle multiple models
  }

  async getTree(examId: string) {
    const subjects = await prisma.subject.findMany({
      where: { examId, OR: [{ tenantId: null }, { tenantId: TenantContext.getTenantId() }] },
      include: {
        units: {
          include: {
            chapters: {
              include: {
                topics: {
                  include: {
                    concepts: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return subjects;
  }

  async createNode(level: 'UNIT' | 'CHAPTER' | 'TOPIC' | 'CONCEPT', name: string, parentId: string) {
    const tenantId = TenantContext.getTenantId();
    
    if (level === 'UNIT') {
      const subject = await prisma.subject.findFirst({ where: { id: parentId, OR: [{ tenantId: null }, { tenantId }] } });
      if (!subject) throw new NotFoundError('Subject', parentId);
      return prisma.unit.create({ data: { name, subjectId: parentId } });
    }
    if (level === 'CHAPTER') {
      const unit = await prisma.unit.findUnique({ where: { id: parentId } });
      if (!unit) throw new NotFoundError('Unit', parentId);
      return prisma.chapter.create({ data: { name, unitId: parentId } });
    }
    if (level === 'TOPIC') {
      const chapter = await prisma.chapter.findUnique({ where: { id: parentId } });
      if (!chapter) throw new NotFoundError('Chapter', parentId);
      return prisma.topic.create({ data: { name, chapterId: parentId } });
    }
    if (level === 'CONCEPT') {
      const topic = await prisma.topic.findUnique({ where: { id: parentId } });
      if (!topic) throw new NotFoundError('Topic', parentId);
      return prisma.concept.create({ data: { name, topicId: parentId } });
    }
    throw new Error('Invalid level');
  }
}

export const syllabusRepository = new SyllabusRepository();
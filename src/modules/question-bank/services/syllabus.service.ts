import { syllabusRepository } from '../repositories/syllabus.repository';
import { CreateSyllabusNodeInput, UpdateSyllabusNodeInput } from '../dto/syllabus.dto';
import { TenantContext } from '@/server/shared/tenant-context';
import { NotFoundError } from '@/server/shared/errors';

export class SyllabusService {
  async getTree(examId: string) {
    return syllabusRepository.getTree(examId);
  }

  async createNode(input: CreateSyllabusNodeInput) {
    return syllabusRepository.createNode(input.level, input.name, input.parentId);
  }

  async updateNode(input: UpdateSyllabusNodeInput) {
    // Simplistic update for demonstration; in reality, need to check which level the node belongs to
    // Or use a single unified "nodes" table. Given our schema, we'd need to check.
    // For brevity, assuming it's a topic for now.
    if (input.name) {
      return syllabusRepository.update(input.id, { name: input.name });
    }
    throw new NotFoundError('Syllabus Node', input.id);
  }
}

export const syllabusService = new SyllabusService();
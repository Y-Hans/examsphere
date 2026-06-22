import { doubtRepository } from '../repositories/doubt.repository';
import { ResolveDoubtInput } from '../dto/doubt.dto';
import { UserContext } from '@/server/shared/user-context';
import { TenantContext } from '@/server/shared/tenant-context';
import { NotFoundError } from '@/server/shared/errors';
import { eventBus } from '@/server/shared/event-bus';

export class DoubtService {
  async getDoubts(status?: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing');
    return doubtRepository.findForTenant(tenantId, status);
  }

  async getDoubtDetails(doubtId: string) {
    const doubt = await doubtRepository.findById(doubtId);
    if (!doubt) throw new NotFoundError('Doubt', doubtId);
    return doubt;
  }

  async resolveDoubt(input: ResolveDoubtInput) {
    const userId = UserContext.getUserId();
    const tenantId = TenantContext.getTenantId();
    if (!userId || !tenantId) throw new Error('Context missing');

    const result = await doubtRepository.addResponse(input.doubtId, userId, input.body);

    await eventBus.emitAndPersist({
      type: 'DoubtResolved',
      tenantId,
      payload: { doubtId: input.doubtId, resolvedBy: userId },
    });

    return result;
  }
}

export const doubtService = new DoubtService();
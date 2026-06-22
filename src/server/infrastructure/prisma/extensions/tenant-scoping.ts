import { Prisma } from '@prisma/client';
import { TenantContext } from '@/server/shared/tenant-context';

const TENANT_SCOPED_MODELS = [
  'User', 'Role', 'Subject', 'Question', 'TestTemplate', 'TestSession', 
  'PracticeSession', 'AnalyticsSnapshot', 'WeakTopic', 'Doubt', 'Subscription', 'Notification'
];

export const tenantScopingExtension = Prisma.defineExtension({
  name: 'tenantScoping',
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        const tenantId = TenantContext.getTenantId();
        if (tenantId && TENANT_SCOPED_MODELS.includes(model)) {
          args.where = { ...args.where, tenantId };
        }
        return query(args);
      },
      async findFirst({ model, args, query }) {
        const tenantId = TenantContext.getTenantId();
        if (tenantId && TENANT_SCOPED_MODELS.includes(model)) {
          args.where = { ...args.where, tenantId };
        }
        return query(args);
      },
      async findUnique({ model, args, query }) {
        const tenantId = TenantContext.getTenantId();
        if (tenantId && TENANT_SCOPED_MODELS.includes(model)) {
          if (!args.where) args.where = {};
          args.where = { ...args.where, tenantId };
        }
        return query(args);
      },
      async count({ model, args, query }) {
        const tenantId = TenantContext.getTenantId();
        if (tenantId && TENANT_SCOPED_MODELS.includes(model)) {
          args.where = { ...args.where, tenantId };
        }
        return query(args);
      },
      async create({ model, args, query }) {
        const tenantId = TenantContext.getTenantId();
        if (tenantId && TENANT_SCOPED_MODELS.includes(model)) {
          args.data = { ...args.data, tenantId };
        }
        return query(args);
      },
      async createMany({ model, args, query }) {
        const tenantId = TenantContext.getTenantId();
        if (tenantId && TENANT_SCOPED_MODELS.includes(model)) {
          if (Array.isArray(args.data)) {
            args.data = args.data.map(item => ({ ...item, tenantId }));
          } else {
            args.data = { ...args.data, tenantId };
          }
        }
        return query(args);
      },
      async update({ model, args, query }) {
        const tenantId = TenantContext.getTenantId();
        if (tenantId && TENANT_SCOPED_MODELS.includes(model)) {
          args.where = { ...args.where, tenantId };
        }
        return query(args);
      },
      async updateMany({ model, args, query }) {
        const tenantId = TenantContext.getTenantId();
        if (tenantId && TENANT_SCOPED_MODELS.includes(model)) {
          args.where = { ...args.where, tenantId };
        }
        return query(args);
      },
      async delete({ model, args, query }) {
        const tenantId = TenantContext.getTenantId();
        if (tenantId && TENANT_SCOPED_MODELS.includes(model)) {
          args.where = { ...args.where, tenantId };
        }
        return query(args);
      },
      async deleteMany({ model, args, query }) {
        const tenantId = TenantContext.getTenantId();
        if (tenantId && TENANT_SCOPED_MODELS.includes(model)) {
          args.where = { ...args.where, tenantId };
        }
        return query(args);
      },
    },
  },
});
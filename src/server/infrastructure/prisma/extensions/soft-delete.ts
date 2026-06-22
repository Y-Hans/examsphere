import { Prisma } from '@prisma/client';

const SOFT_DELETE_MODELS = [
  'Tenant', 'User', 'Role', 'Subject', 'Unit', 'Chapter', 'Topic', 'Concept',
  'Question', 'TestTemplate', 'TestSession', 'Doubt', 'Subscription'
];

export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (!SOFT_DELETE_MODELS.includes(model)) return query(args);
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findUnique({ model, args, query }) {
        if (!SOFT_DELETE_MODELS.includes(model)) return query(args);
        if (args.where && 'deletedAt' in args.where) return query(args);
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ model, args, query }) {
        if (!SOFT_DELETE_MODELS.includes(model)) return query(args);
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async count({ model, args, query }) {
        if (!SOFT_DELETE_MODELS.includes(model)) return query(args);
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async delete({ model, args, query }) {
        if (!SOFT_DELETE_MODELS.includes(model)) return query(args);
        return (query as any)({
          ...args,
          data: { deletedAt: new Date() },
        });
      },
      async deleteMany({ model, args, query }) {
        if (!SOFT_DELETE_MODELS.includes(model)) return query(args);
        return (query as any)({
          ...args,
          data: { deletedAt: new Date() },
        });
      },
    },
  },
});
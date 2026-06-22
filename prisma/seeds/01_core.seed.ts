import { PrismaClient, TenantType, TenantStatus, UserStatus, QuestionType, QuestionStatus, Difficulty, QuestionSourceType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding core data...');

  // 1. Create Base Exams
  const jeeMain = await prisma.exam.upsert({
    where: { code: 'JEE_MAIN' },
    update: {},
    create: { code: 'JEE_MAIN', name: 'JEE Main' }
  });

  const jeeAdv = await prisma.exam.upsert({
    where: { code: 'JEE_ADVANCED' },
    update: {},
    create: { code: 'JEE_ADVANCED', name: 'JEE Advanced' }
  });

  const neet = await prisma.exam.upsert({
    where: { code: 'NEET' },
    update: {},
    create: { code: 'NEET', name: 'NEET' }
  });

  // 2. Create Base Subjects
  await prisma.subject.upsert({
    where: { id: 'physics-jee-main' },
    update: {},
    create: { id: 'physics-jee-main', examId: jeeMain.id, name: 'Physics' }
  });

  await prisma.subject.upsert({
    where: { id: 'chemistry-jee-main' },
    update: {},
    create: { id: 'chemistry-jee-main', examId: jeeMain.id, name: 'Chemistry' }
  });

  await prisma.subject.upsert({
    where: { id: 'mathematics-jee-main' },
    update: {},
    create: { id: 'mathematics-jee-main', examId: jeeMain.id, name: 'Mathematics' }
  });

  await prisma.subject.upsert({
    where: { id: 'physics-neet' },
    update: {},
    create: { id: 'physics-neet', examId: neet.id, name: 'Physics' }
  });

  await prisma.subject.upsert({
    where: { id: 'chemistry-neet' },
    update: {},
    create: { id: 'chemistry-neet', examId: neet.id, name: 'Chemistry' }
  });

  await prisma.subject.upsert({
    where: { id: 'biology-neet' },
    update: {},
    create: { id: 'biology-neet', examId: neet.id, name: 'Biology' }
  });

  // 3. Create Base Plans
  await prisma.plan.upsert({
    where: { code: 'FREE' },
    update: {},
    create: {
      code: 'FREE',
      name: 'Free',
      priceInr: 0,
      billingCycle: 'LIFETIME',
      features: { mockTests: 3, practiceQuestions: 100, analytics: 'BASIC' },
      isActive: true
    }
  });

  await prisma.plan.upsert({
    where: { code: 'PREMIUM' },
    update: {},
    create: {
      code: 'PREMIUM',
      name: 'Premium',
      priceInr: 2999,
      billingCycle: 'YEARLY',
      features: { mockTests: -1, practiceQuestions: -1, analytics: 'ADVANCED', aiTutor: true },
      isActive: true
    }
  });

  await prisma.plan.upsert({
    where: { code: 'PREMIUM_PLUS' },
    update: {},
    create: {
      code: 'PREMIUM_PLUS',
      name: 'Premium Plus',
      priceInr: 4999,
      billingCycle: 'YEARLY',
      features: { mockTests: -1, practiceQuestions: -1, analytics: 'ADVANCED', aiTutor: true, aiPlanner: true, doubtSupport: true },
      isActive: true
    }
  });

  await prisma.plan.upsert({
    where: { code: 'ENTERPRISE' },
    update: {},
    create: {
      code: 'ENTERPRISE',
      name: 'Enterprise',
      priceInr: 99999,
      billingCycle: 'YEARLY',
      features: { whiteLabel: true, sso: true, dedicatedSupport: true, unlimitedEverything: true },
      isActive: true
    }
  });

  // 4. Create Super Admin Tenant & User
  const adminTenant = await prisma.tenant.upsert({
    where: { subdomain: 'examsphere' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'ExamSphere Super Admin',
      subdomain: 'examsphere',
      type: TenantType.ENTERPRISE,
      status: TenantStatus.ACTIVE,
      branding: { primaryColor: '#0f172a' }
    }
  });

  const superAdminRole = await prisma.role.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      tenantId: adminTenant.id,
      name: 'SUPER_ADMIN',
      scope: 'GLOBAL'
    }
  });

  const adminPasswordHash = await bcrypt.hash('Examsphere@123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@examsphere.com' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      tenantId: adminTenant.id,
      email: 'admin@examsphere.com',
      passwordHash: adminPasswordHash,
      status: UserStatus.ACTIVE
    }
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdmin.id, roleId: superAdminRole.id } },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: superAdminRole.id
    }
  });

  // 5. Seed Base Permissions
  const resources = ['user', 'tenant', 'question', 'test_template', 'test_session', 'doubt', 'subscription', 'analytics'];
  const actions = ['create', 'read', 'update', 'delete', 'manage'];

  for (const resource of resources) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: { id: `${resource}-${action}` },
        update: {},
        create: {
          id: `${resource}-${action}`,
          resource,
          action
        }
      });
    }
  }

  console.log('Core data seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
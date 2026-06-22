import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding feature flags...');

  await prisma.featureFlag.upsert({
    where: { key: 'AI_TUTOR_ACCESS' },
    update: {},
    create: { key: 'AI_TUTOR_ACCESS', description: 'Access to AI Tutor chat', defaultEnabled: false },
  });

  await prisma.featureFlag.upsert({
    where: { key: 'AI_PLANNER_ACCESS' },
    update: {},
    create: { key: 'AI_PLANNER_ACCESS', description: 'Access to AI Study Planner', defaultEnabled: false },
  });

  await prisma.featureFlag.upsert({
    where: { key: 'AI_TEST_GENERATOR_ACCESS' },
    update: {},
    create: { key: 'AI_TEST_GENERATOR_ACCESS', description: 'Access to AI Test Generator', defaultEnabled: false },
  });

  await prisma.featureFlag.upsert({
    where: { key: 'ADAPTIVE_PRACTICE' },
    update: {},
    create: { key: 'ADAPTIVE_PRACTICE', description: 'Enables adaptive practice engine logic', defaultEnabled: true },
  });

  await prisma.featureFlag.upsert({
    where: { key: 'RANK_PREDICTION' },
    update: {},
    create: { key: 'RANK_PREDICTION', description: 'Allows students to see predicted JEE/NEET ranks', defaultEnabled: true },
  });

  console.log('Feature flags seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
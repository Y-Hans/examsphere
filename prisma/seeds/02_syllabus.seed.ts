import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding JEE/NEET syllabus hierarchy...');

  const jeeMain = await prisma.exam.findUnique({ where: { code: 'JEE_MAIN' } });
  const neet = await prisma.exam.findUnique({ where: { code: 'NEET' } });

  if (!jeeMain || !neet) throw new Error('Exams not found. Run core seed first.');

  // JEE Main Physics
  const phys = await prisma.subject.findFirst({ where: { examId: jeeMain.id, name: 'Physics' } });
  if (phys) {
    const mechanics = await prisma.unit.create({ data: { subjectId: phys.id, name: 'Mechanics' } });
    const kinematics = await prisma.chapter.create({ data: { unitId: mechanics.id, name: 'Kinematics' } });
    await prisma.topic.create({ data: { chapterId: kinematics.id, name: 'Motion in a Straight Line' } });
    await prisma.topic.create({ data: { chapterId: kinematics.id, name: 'Motion in a Plane' } });
    
    const lawsMotion = await prisma.chapter.create({ data: { unitId: mechanics.id, name: 'Laws of Motion' } });
    await prisma.topic.create({ data: { chapterId: lawsMotion.id, name: "Newton's Laws of Motion" } });
    await prisma.topic.create({ data: { chapterId: lawsMotion.id, name: 'Friction' } });
  }

  // JEE Main Chemistry
  const chem = await prisma.subject.findFirst({ where: { examId: jeeMain.id, name: 'Chemistry' } });
  if (chem) {
    const physChem = await prisma.unit.create({ data: { subjectId: chem.id, name: 'Physical Chemistry' } });
    const atomicStruct = await prisma.chapter.create({ data: { unitId: physChem.id, name: 'Atomic Structure' } });
    await prisma.topic.create({ data: { chapterId: atomicStruct.id, name: 'Bohr Model' } });
    await prisma.topic.create({ data: { chapterId: atomicStruct.id, name: 'Quantum Mechanical Model' } });
  }

  // JEE Main Math
  const math = await prisma.subject.findFirst({ where: { examId: jeeMain.id, name: 'Mathematics' } });
  if (math) {
    const calc = await prisma.unit.create({ data: { subjectId: math.id, name: 'Calculus' } });
    const diffCalc = await prisma.chapter.create({ data: { unitId: calc.id, name: 'Differential Calculus' } });
    await prisma.topic.create({ data: { chapterId: diffCalc.id, name: 'Limits' } });
    await prisma.topic.create({ data: { chapterId: diffCalc.id, name: 'Continuity' } });
    await prisma.topic.create({ data: { chapterId: diffCalc.id, name: 'Differentiability' } });
  }

  console.log('Syllabus seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
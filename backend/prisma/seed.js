const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const adminHash = await bcrypt.hash("Admin@123", 10);
  const memberHash = await bcrypt.hash("Member@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@taskmanager.com" },
    update: {},
    create: {
      name: "Alice Admin",
      email: "admin@taskmanager.com",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  const member1 = await prisma.user.upsert({
    where: { email: "bob@taskmanager.com" },
    update: {},
    create: {
      name: "Bob Member",
      email: "bob@taskmanager.com",
      passwordHash: memberHash,
      role: "MEMBER",
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: "carol@taskmanager.com" },
    update: {},
    create: {
      name: "Carol Member",
      email: "carol@taskmanager.com",
      passwordHash: memberHash,
      role: "MEMBER",
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "seed-project-1" },
    update: {},
    create: {
      id: "seed-project-1",
      name: "Website Redesign",
      description: "Redesign the company website with modern UI/UX",
      ownerId: admin.id,
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: admin.id } },
    update: {},
    create: { projectId: project.id, userId: admin.id, role: "ADMIN" },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: member1.id } },
    update: {},
    create: { projectId: project.id, userId: member1.id, role: "MEMBER" },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: member2.id } },
    update: {},
    create: { projectId: project.id, userId: member2.id, role: "MEMBER" },
  });

  const tasks = [
    { title: "Design mockups", status: "DONE", priority: "HIGH", assigneeId: member1.id },
    { title: "Set up CI/CD pipeline", status: "IN_PROGRESS", priority: "URGENT", assigneeId: member2.id },
    { title: "Write unit tests", status: "TODO", priority: "MEDIUM", assigneeId: member1.id },
    {
      title: "Deploy to staging",
      status: "TODO",
      priority: "HIGH",
      assigneeId: member2.id,
      dueDate: new Date(Date.now() - 86400000),
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({
      data: { ...task, projectId: project.id, creatorId: admin.id },
    });
  }

  console.log("✅ Seed complete!");
  console.log("  Admin:  admin@taskmanager.com / Admin@123");
  console.log("  Member: bob@taskmanager.com   / Member@123");
  console.log("  Member: carol@taskmanager.com / Member@123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

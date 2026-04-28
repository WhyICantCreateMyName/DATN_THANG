import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({ take: 1 });
    console.log('Valid User:', users[0]);
}

main().finally(() => prisma.$disconnect());

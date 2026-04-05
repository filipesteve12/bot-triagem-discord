import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main(){ await prisma.user.create({ data:{ name:"admin" }}); }
main().catch(console.error).finally(()=>prisma.$disconnect());

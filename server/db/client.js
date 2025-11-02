import path from "path";
import { PrismaClient } from "@prisma/client";

if (process.env.DATABASE_URL?.startsWith("file:")) {
  const rawPath = process.env.DATABASE_URL.replace(/^file:/, "");
  if (!path.isAbsolute(rawPath)) {
    const absolute = path.resolve(process.cwd(), rawPath);
    process.env.DATABASE_URL = `file:${absolute}`;
  }
}

export const prisma = new PrismaClient();

export async function disconnectPrisma() {
  await prisma.$disconnect();
}

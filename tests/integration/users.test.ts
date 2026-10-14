import { beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/services/db";

async function probeDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

const dbAvailable = await probeDatabase();

describe.skipIf(!dbAvailable)("users — database integration", () => {
  beforeAll(async () => {
    // Isolated test database (DATABASE_URL is pointed at DATABASE_URL_TEST in
    // vitest.config.ts). Reset only auth tables.
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "Session", "Account", "User" RESTART IDENTITY CASCADE',
    );
  });

  it("creates and updates a user", async () => {
    const created = await prisma.user.create({
      data: { name: "Ada", email: "ada@example.com" },
    });
    expect(created.email).toBe("ada@example.com");
    expect(created.id).toBeTruthy();

    const updated = await prisma.user.update({
      where: { id: created.id },
      data: { name: "Ada Lovelace" },
    });
    expect(updated.name).toBe("Ada Lovelace");

    await prisma.user.delete({ where: { id: created.id } });
  });

  it("enforces unique emails", async () => {
    await prisma.user.create({ data: { email: "unique@example.com" } });
    await expect(prisma.user.create({ data: { email: "unique@example.com" } })).rejects.toThrow();
    await prisma.user.deleteMany({ where: { email: "unique@example.com" } });
  });

  it("deletes sessions and accounts when a user is deleted (cascade)", async () => {
    const user = await prisma.user.create({
      data: {
        email: "cascade@example.com",
        accounts: {
          create: {
            type: "oauth",
            provider: "github",
            providerAccountId: "12345",
          },
        },
        sessions: {
          create: {
            sessionToken: "session-token-1",
            expires: new Date(Date.now() + 1000 * 60 * 60),
          },
        },
      },
    });

    await prisma.user.delete({ where: { id: user.id } });

    const session = await prisma.session.findUnique({ where: { sessionToken: "session-token-1" } });
    const account = await prisma.account.findFirst({ where: { providerAccountId: "12345" } });
    expect(session).toBeNull();
    expect(account).toBeNull();
  });
});

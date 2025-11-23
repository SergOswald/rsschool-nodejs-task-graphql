import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

function makeOneToOneLoader<T extends { id: string }>(
  fn: (ids: string[], prisma: PrismaClient) => Promise<T[]>,
  prisma: PrismaClient
) {
  return new DataLoader<string, T | null>(async (keys) => {
    const rows = await fn(keys as string[], prisma);
    const map = new Map(rows.map((r) => [r.id, r]));
    return keys.map((k) => map.get(k) || null);
  });
}

export const createLoaders = (prisma: PrismaClient) => ({
  members: makeOneToOneLoader(
    async (ids, prisma) =>
      prisma.member.findMany({
        where: { id: { in: ids } },
      }),
    prisma
  ),

  posts: makeOneToOneLoader(
    async (ids, prisma) =>
      prisma.post.findMany({
        where: { id: { in: ids } },
      }),
    prisma
  ),

  profiles: makeOneToOneLoader(
    async (ids, prisma) =>
      prisma.profile.findMany({
        where: { id: { in: ids } },
      }),
    prisma
  ),

  stats: makeOneToOneLoader(
    async (ids, prisma) =>
      prisma.stats.findMany({
        where: { id: { in: ids } },
      }),
    prisma
  ),
});

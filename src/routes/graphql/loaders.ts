import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

export const createLoaders = (prisma: PrismaClient) => ({
  usersById: new DataLoader(async (ids: readonly string[]) => {
    const rows = await prisma.user.findMany({
      where: { id: { in: [...ids] } },
    });

    const map = new Map(rows.map((u) => [u.id, u]));
    return ids.map((id) => map.get(id) ?? null);
  }),

  postsByUser: new DataLoader(async (userIds: readonly string[]) => {
    const rows = await prisma.post.findMany({
      where: { authorId: { in: [...userIds] } },
    });

    // ручная группировка
    const grouped: Record<string, any[]> = {};
    for (const r of rows) {
      if (!grouped[r.authorId]) grouped[r.authorId] = [];
      grouped[r.authorId].push(r);
    }

    return userIds.map((id) => grouped[id] ?? []);
  }),

  profileByUser: new DataLoader(async (userIds: readonly string[]) => {
    const rows = await prisma.profile.findMany({
      where: { userId: { in: [...userIds] } },
    });

    const map = new Map(rows.map((p) => [p.userId, p]));
    return userIds.map((id) => map.get(id) ?? null);
  }),

  memberTypeByProfile: new DataLoader(async (ids: readonly string[]) => {
    const rows = await prisma.memberType.findMany({
      where: { id: { in: [...ids] } },
    });

    const map = new Map(rows.map((mt) => [mt.id, mt]));
    return ids.map((id) => map.get(id) ?? null);
  }),
});

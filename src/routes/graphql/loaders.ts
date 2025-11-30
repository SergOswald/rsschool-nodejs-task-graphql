import DataLoader from 'dataloader';
import type { PrismaClient } from '@prisma/client';

/**
 * createLoaders(prisma) -> { userById, subsByAuthor }
 *
 * - userById: batched findMany by id
 * - subsByAuthor: batched findMany on SubscribersOnAuthors where authorId IN (...) with include subscriber
 *
 * Important: we return exact arrays aligned with keys to satisfy DataLoader contract.
 */
export const createLoaders = (prisma: PrismaClient) => {
  const userById = new DataLoader<string, any>(async (ids) => {
    const rows = await prisma.user.findMany({
      where: { id: { in: [...ids] } },
    });
    const map = new Map(rows.map((r) => [r.id, r]));
    return ids.map((id) => map.get(id) ?? null);
  });

  const subsByAuthor = new DataLoader<string, any[]>(async (authorIds) => {
    // single findMany for all authorIds — include subscriber to get User objects
    const rows = await prisma.subscribersOnAuthors.findMany({
      where: { authorId: { in: [...authorIds] } },
      include: { subscriber: true },
    });

    const grouped: Record<string, any[]> = {};
    for (const r of rows) {
      if (!grouped[r.authorId]) grouped[r.authorId] = [];
      // r.subscriber is a User (because of include)
      grouped[r.authorId].push(r.subscriber);
    }

    return authorIds.map((id) => grouped[id] ?? []);
  });

  return {
    userById,
    subsByAuthor,
  };
};

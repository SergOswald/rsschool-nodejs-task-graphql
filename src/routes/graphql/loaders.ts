import DataLoader from 'dataloader';
import type { PrismaClient } from '@prisma/client';

/**
 * createLoaders(prisma) -> объект loader'ов
 *
 * loaders:
 *  - userById: DataLoader для получения пользователей по id (один findMany)
 *  - subsByAuthor: DataLoader для получения подписчиков (модель SubscribersOnAuthors) для набора authorId (один findMany)
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
    // получаем записи SubscribersOnAuthors вместе с сущностями subscriber
    const rows = await prisma.subscribersOnAuthors.findMany({
      where: { authorId: { in: [...authorIds] } },
      include: { subscriber: true },
    });

    // сгруппируем по authorId
    const grouped: Record<string, any[]> = {};
    for (const r of rows) {
      if (!grouped[r.authorId]) grouped[r.authorId] = [];
      grouped[r.authorId].push(r.subscriber);
    }

    return authorIds.map((id) => grouped[id] ?? []);
  });

  return {
    userById,
    subsByAuthor,
  };
};

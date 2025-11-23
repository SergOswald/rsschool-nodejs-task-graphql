import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';

/**
 * Универсальный loader для сущностей типа { id: string }
 * Выполняет ОДИН вызов prisma.findMany({ where: { id: { in: keys } } })
 */
function createByIdLoader<T extends { id: string }>(
  prisma: PrismaClient,
  modelFindMany: (keys: string[], prisma: PrismaClient) => Promise<T[]>
) {
  return new DataLoader<string, T | null>(async (keys) => {
    // единый findMany
    const rows = await modelFindMany(keys as string[], prisma);
    const map = new Map(rows.map((r) => [r.id, r]));
    return keys.map((k) => map.get(k) ?? null);
  });
}

/**
 * Специальный loader, который возвращает для каждого userId массив подписчиков/subs.
 * Предполагаемая реализация в prisma: у User есть поле parentId (или аналог)
 */
function createSubsLoader(prisma: PrismaClient) {
  return new DataLoader<string, any[]>(async (userIds) => {
    // получаем всех пользователей, у которых parentId in userIds
    const subs = await prisma.user.findMany({
      where: { parentId: { in: userIds as string[] } },
    });

    // сгруппируем по parentId
    const groups = new Map<string, any[]>();
    for (const s of subs) {
      const parentId = (s as any).parentId as string;
      if (!groups.has(parentId)) groups.set(parentId, []);
      groups.get(parentId)!.push(s);
    }

    return userIds.map((id) => groups.get(id) ?? []);
  });
}

export const createLoaders = (prisma: PrismaClient) => {
  return {
    userById: createByIdLoader(prisma, async (keys, prismaClient) =>
      prismaClient.user.findMany({ where: { id: { in: keys } } })
    ),
    postById: createByIdLoader(prisma, async (keys, prismaClient) =>
      prismaClient.post.findMany({ where: { id: { in: keys } } })
    ),
    profileById: createByIdLoader(prisma, async (keys, prismaClient) =>
      prismaClient.profile.findMany({ where: { id: { in: keys } } })
    ),
    statsById: createByIdLoader(prisma, async (keys, prismaClient) =>
      prismaClient.stats.findMany({ where: { id: { in: keys } } })
    ),

    // loader для массива подписчиков (subs)
    subsForUserId: createSubsLoader(prisma),
  };
};

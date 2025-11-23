import { parseResolveInfo } from 'graphql-parse-resolve-info';
import { GraphQLResolveInfo } from 'graphql';

export const Query = {
  users: async (_: any, __: any, ctx: any, info: GraphQLResolveInfo) => {
    const { prisma, loaders } = ctx;

    // Разбор GraphQLResolveInfo, чтобы понять — запрошено ли поле subs
    let wantsSubs = false;
    try {
      const parsed: any = parseResolveInfo(info) || {};
      // Простейшая проверка: может быть parsed.fieldsByTypeName.User.subs
      wantsSubs =
        !!(
          parsed &&
          parsed.fieldsByTypeName &&
          parsed.fieldsByTypeName.User &&
          parsed.fieldsByTypeName.User.subs
        );
    } catch (e) {
      wantsSubs = false;
    }

    // Если subs ожидают — сделаем include, иначе без include.
    const users = await prisma.user.findMany(
      wantsSubs
        ? { include: { subs: true } as any } // include подписчиков 
        : {}
    );

    // Prime the userById loader cache: чтобы при вызове loaders.userById.load(id) не было лишних запросов
    for (const u of users) {
      loaders.userById.clear(u.id);
      loaders.userById.prime(u.id, u);
    }

    // Если subs были включены, то предварительно зальём в cache и для subs
    if (wantsSubs) {
      // Каждый subs — это пользователь. Prime-им их тоже в userById
      for (const u of users) {
        if ((u as any).subs && Array.isArray((u as any).subs)) {
          for (const s of (u as any).subs) {
            loaders.userById.prime(s.id, s);
          }
        }
      }
    }

    return users;
  },

  user: async (_: any, { id }: any, ctx: any, info: GraphQLResolveInfo) => {
    const { prisma, loaders } = ctx;
    // пробуем сначала через loader (кэш)
    const fromCache = await loaders.userById.load(id);
    if (fromCache) return fromCache;

    const user = await prisma.user.findUnique({ where: { id } });
    if (user) loaders.userById.prime(user.id, user);
    return user;
  },
};

export const Mutation = {
  createUser: async (_: any, { name, email }: any, ctx: any) => {
    const { prisma, loaders } = ctx;
    const u = await prisma.user.create({ data: { name, email } });
    // prime
    loaders.userById.prime(u.id, u);
    return u;
  },

  updateUser: async (_: any, { id, ...data }: any, ctx: any) => {
    const { prisma, loaders } = ctx;
    const u = await prisma.user.update({ where: { id }, data });
    loaders.userById.prime(u.id, u);
    return u;
  },

  deleteUser: async (_: any, { id }: any, ctx: any) => {
    const { prisma, loaders } = ctx;
    await prisma.user.delete({ where: { id } });
    // clear cache
    loaders.userById.clear(id);
    return true;
  },
};

export const Types = {
  User: {
    posts: (parent: any, _args: any, ctx: any) => {
      const { prisma } = ctx;
      return prisma.post.findMany({ where: { authorId: parent.id } });
    },

    profile: async (parent: any, _args: any, ctx: any) => {
      const { loaders, prisma } = ctx;
      // Предпочтительно — сначала попытаться через loader
      const cached = await loaders.profileById.load(parent.id).catch(() => null);
      if (cached) return cached;
      const profile = await prisma.profile.findUnique({ where: { userId: parent.id } });
      if (profile) loaders.profileById.prime(parent.id, profile);
      return profile;
    },

    stats: async (parent: any, _args: any, ctx: any) => {
      const { loaders, prisma } = ctx;
      const cached = await loaders.statsById.load(parent.id).catch(() => null);
      if (cached) return cached;
      const stat = await prisma.stats.findUnique({ where: { userId: parent.id } });
      if (stat) loaders.statsById.prime(parent.id, stat);
      return stat;
    },

    subs: async (parent: any, _args: any, ctx: any) => {
      const { loaders, prisma } = ctx;
      // Если при предыдущем запросе users мы уже сделали include subs и prime'или их —
      // то subs уже находятся в userById cache. Но мы используем специальный loader
      // subsForUserId, который возвращает массив подписчиков одним findMany.
      return loaders.subsForUserId.load(parent.id);
    },
  },
};

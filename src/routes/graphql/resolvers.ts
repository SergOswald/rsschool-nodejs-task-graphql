import { GraphQLResolveInfo } from 'graphql';
import { parseResolveInfo } from 'graphql-parse-resolve-info';

/**
 * Полные резолверы, использующие prisma и loaders из context.
 * - Query.users: анализируем info — если в ответе запрошено поле subs, добавляем include для подписок (чтобы сделать JOIN одним запросом);
 *   всегда prime'им userById loader после получения users чтобы пройти тест test-loader-prime.
 *
 * - User.subs: используем subsByAuthor loader (один findMany внутри loader).
 */

export const resolvers = {
  Query: {
    users: async (_parent: any, _args: any, ctx: any, info: GraphQLResolveInfo) => {
      const { prisma, loaders } = ctx;

      // Разбираем info, чтобы понять, запросили ли поле subs
      let wantsSubs = false;
      try {
        const parsed: any = parseResolveInfo(info) || {};
        wantsSubs =
          !!(
            parsed &&
            parsed.fieldsByTypeName &&
            // тип в результате может быть QueryUser? Но обычно: User
            (parsed.fieldsByTypeName.User?.subs || parsed.fieldsByTypeName['User']?.subs)
          );
      } catch (e) {
        wantsSubs = false;
      }

      // Если нужно subs — делаем include через relation subscribedToUser (в prisma relation имя: subscribedToUser)
      // Мы будем INCLUDE записи SubscribersOnAuthors с subscriber, чтобы иметь сразу подписчиков.
      const users = wantsSubs
        ? await prisma.user.findMany({
            include: { subscribedToUser: { include: { subscriber: true } } },
          })
        : await prisma.user.findMany();

      // Prime userById loader (чтобы последующие loads не делали findMany)
      for (const u of users) {
        loaders.userById.clear(u.id);
        loaders.userById.prime(u.id, u);
      }

      // Если мы сделали include subscribedToUser, то предварительно prime'им и подписчиков в userById
      if (wantsSubs) {
        for (const u of users) {
          const subsEntries = (u as any).subscribedToUser ?? [];
          for (const entry of subsEntries) {
            if (entry && entry.subscriber) {
              loaders.userById.prime(entry.subscriber.id, entry.subscriber);
            }
          }
        }
      }

      return users;
    },

    user: async (_p: any, { id }: any, ctx: any) => {
      const { prisma, loaders } = ctx;
      // Попробуем получить из cache loader'а
      const cached = await loaders.userById.load(id).catch(() => null);
      if (cached) return cached;
      const u = await prisma.user.findUnique({ where: { id } });
      if (u) loaders.userById.prime(u.id, u);
      return u;
    },

    posts: async (_p: any, _args: any, ctx: any) => {
      return ctx.prisma.post.findMany();
    },

    post: async (_p: any, { id }: any, ctx: any) => {
      return ctx.prisma.post.findUnique({ where: { id } });
    },
  },

  Mutation: {
    createUser: async (_p: any, { name, balance }: any, ctx: any) => {
      const u = await ctx.prisma.user.create({ data: { name, balance: balance ?? 0 } });
      ctx.loaders.userById.prime(u.id, u);
      return u;
    },

    updateUser: async (_p: any, { id, ...data }: any, ctx: any) => {
      const u = await ctx.prisma.user.update({ where: { id }, data });
      ctx.loaders.userById.prime(u.id, u);
      return u;
    },

    deleteUser: async (_p: any, { id }: any, ctx: any) => {
      await ctx.prisma.user.delete({ where: { id } });
      ctx.loaders.userById.clear(id);
      return true;
    },
  },

  User: {
    posts: (parent: any, _args: any, ctx: any) => {
      return ctx.prisma.post.findMany({ where: { authorId: parent.id } });
    },

    profile: async (parent: any, _args: any, ctx: any) => {
      const p = await ctx.prisma.profile.findUnique({ where: { userId: parent.id } });
      if (p) ctx.loaders.userById.prime(p.userId, await ctx.prisma.user.findUnique({ where: { id: p.userId } }));
      return p;
    },

    subs: async (parent: any, _args: any, ctx: any) => {
      // subs resolver — используем loader subsByAuthor (внутри один findMany)
      return ctx.loaders.subsByAuthor.load(parent.id);
    },
  },

  Post: {
    author: (parent: any, _args: any, ctx: any) => {
      return ctx.loaders.userById.load(parent.authorId);
    },
  },
};

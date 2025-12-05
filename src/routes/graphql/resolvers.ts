import { GraphQLResolveInfo } from 'graphql';
import { parseResolveInfo } from 'graphql-parse-resolve-info';

/**
 * resolvers — code-first resolvers object
 */
export const resolvers = {
  Query: {
    users: async (_parent: any, _args: any, ctx: any, info: GraphQLResolveInfo) => {
      const { prisma, loaders } = ctx;

      // parse resolve info to see if field "subs" of User requested
      let wantsSubs = false;
      try {
        const parsed: any = parseResolveInfo(info) || {};
        // parsed.fieldsByTypeName may contain User -> subs
        wantsSubs = !!(
          parsed &&
          parsed.fieldsByTypeName &&
          parsed.fieldsByTypeName.User &&
          parsed.fieldsByTypeName.User.subs
        );
      } catch (e) {
        wantsSubs = false;
      }

      // if subs requested — include subscribedToUser relation (author side)
      const users = wantsSubs
        ? await prisma.user.findMany({
            include: {
              subscribedToUser: {
                include: { subscriber: true },
              },
            },
          })
        : await prisma.user.findMany();

      // Prime userById loader so subsequent loader loads don't hit DB (test-loader-prime)
      for (const u of users) {
        loaders.userById.clear(u.id);
        loaders.userById.prime(u.id, u);
      }

      // If we included subscribedToUser, prime subscribers (they are in included rows)
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
      // try loader cache first
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

    createPost: async (_p: any, { authorId, title, content }: any, ctx: any) => {
      const post = await ctx.prisma.post.create({ data: { authorId, title, content } });
      return post;
    },
  },

  User: {
    posts: async (parent: any, _args: any, ctx: any) => {
      return ctx.prisma.post.findMany({ where: { authorId: parent.id } });
    },

    profile: async (parent: any, _args: any, ctx: any) => {
      return ctx.prisma.profile.findUnique({ where: { userId: parent.id } });
    },

    subs: async (parent: any, _args: any, ctx: any) => {
      // Use subsByAuthor loader — single batched findMany inside loader
      return ctx.loaders.subsByAuthor.load(parent.id);
    },
  },

  Post: {
    author: async (parent: any, _args: any, ctx: any) => {
      return ctx.loaders.userById.load(parent.authorId);
    },
  },
};

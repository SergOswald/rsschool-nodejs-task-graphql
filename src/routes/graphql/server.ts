import { FastifyInstance } from 'fastify';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { graphql } from 'graphql';
import depthLimit from 'graphql-depth-limit';
import mercurius from 'mercurius';

import { typeDefs } from './schemas.js';
import { loadResolvers } from './index.js';
import { createLoaders } from './loaders.js';
import { PrismaClient } from '@prisma/client';

export default async function gqlServer(fastify: FastifyInstance) {
  const prisma = new PrismaClient();

  const resolvers = loadResolvers();
  const loaders = createLoaders(prisma);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  fastify.register(mercurius, {
    schema,
    graphiql: false,
    context: (req) => ({
      prisma,
      loaders,
      userId: req.headers['x-user-id'] ?? null,
    }),
    validationRules: [depthLimit(5)],
  });
}

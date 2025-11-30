import { FastifyInstance } from 'fastify';
import mercurius from 'mercurius';
import depthLimit from 'graphql-depth-limit';

import { typeDefs } from './schemas.js';
import { resolvers } from './resolvers.js';
import { createLoaders } from './loaders.js';

export default async function graphql(fastify: FastifyInstance) {
  await fastify.register(mercurius as any, {
    schema: typeDefs,
    resolvers,
    graphiql: false,
    path: '/graphql',
    validationRules: [depthLimit(5)],
    context: (request, reply) => {
      const prisma = (fastify as any).prisma;
      return {
        prisma,
        loaders: createLoaders(prisma),
      };
    },
  });
}

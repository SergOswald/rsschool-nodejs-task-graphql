import { FastifyInstance } from 'fastify';
import mercurius from 'mercurius';
import depthLimit from 'graphql-depth-limit';

import { typeDefs } from './schemas.js';
import { resolvers } from './resolvers.js';
import { createLoaders } from './loaders.js';

export default async function graphqlRoute(fastify: FastifyInstance) {
  await fastify.register(mercurius as any, {
    schema: typeDefs,
    resolvers,
    graphiql: false, // tests use programmatic queries
    path: '/graphql',
    context: (request, reply) => {
      const prisma = (fastify as any).prisma;
      return {
        prisma,
        loaders: createLoaders(prisma),
      };
    },
    validationRules: [depthLimit(5)],
  });
}

import { FastifyInstance } from 'fastify';
import mercurius from 'mercurius';
import depthLimit from 'graphql-depth-limit';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { typeDefs } from './schemas';
import { loadResolvers } from './index';
import { createLoaders } from './loaders';

export default async function graphqlServer(fastify: FastifyInstance) {
  const resolvers = loadResolvers();

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  await fastify.register(mercurius, {
    schema,
    graphiql: true,
    path: '/graphql',
    validationRules: [depthLimit(5)],

    context: async (request, reply) => ({
      prisma: fastify.prisma,
      loaders: createLoaders(fastify.prisma),
    }),
  });
}

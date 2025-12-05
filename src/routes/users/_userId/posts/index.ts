import { FastifyInstance } from 'fastify';
import { postSchema } from '../../../posts/schemas.js';

export default async function (app: FastifyInstance) {
  app.get<{
    Params: { userId: string }
  }>('/', {
    schema: {
      summary: 'Get posts for user',
      tags: ['users'],
      params: {
        type: 'object',
        properties: { userId: { type: 'string' } },
        required: ['userId'],
      },
      response: {
        200: {
          type: 'array',
          items: postSchema,
        },
      },
    },
  }, async (req, reply) => {

    const userId = req.params.userId; // already string

    const posts = await app.db.post.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        content: true,
        authorId: true,
      },
    });

    return posts;
  });
}

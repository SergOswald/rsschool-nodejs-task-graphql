import { FastifyInstance } from 'fastify';
import { profileSchema } from '../../../profiles/schemas.js';

export default async function (app: FastifyInstance) {
  app.get<{
    Params: { userId: string }
  }>('/', {
    schema: {
      summary: 'Get profile for user',
      tags: ['users'],
      params: {
        type: 'object',
        properties: { userId: { type: 'string' } },
        required: ['userId'],
      },
      response: {
        200: profileSchema,
      },
    },
  }, async (req, reply) => {

    const userId = req.params.userId;

    const profile = await app.db.profile.findUnique({
      where: { userId },
      select: {
        id: true,
        isMale: true,
        yearOfBirth: true,
        userId: true,
        memberTypeId: true,
      },
    });

    return profile;
  });
}

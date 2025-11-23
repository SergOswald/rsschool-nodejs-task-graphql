import * as memberResolvers from './member-types';
import * as postResolvers from './posts';
import * as profilesResolvers from './profiles';
import * as statsResolvers from './stats';
import * as usersResolvers from './users';

export const loadResolvers = () => ({
  Query: {
    ...(memberResolvers.Query || {}),
    ...(postResolvers.Query || {}),
    ...(profilesResolvers.Query || {}),
    ...(statsResolvers.Query || {}),
    ...(usersResolvers.Query || {}),
  },
  Mutation: {
    ...(memberResolvers.Mutation || {}),
    ...(postResolvers.Mutation || {}),
    ...(profilesResolvers.Mutation || {}),
    ...(statsResolvers.Mutation || {}),
    ...(usersResolvers.Mutation || {}),
  },
  // Типы (field resolvers)
  ...(memberResolvers.Types || {}),
  ...(postResolvers.Types || {}),
  ...(profilesResolvers.Types || {}),
  ...(statsResolvers.Types || {}),
  ...(usersResolvers.Types || {}),
});

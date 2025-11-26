import { gql } from 'graphql-tag';

import member from './member-types/schemas.js';
import posts from './posts/schemas.js';
import profiles from './profiles/schemas.js';
import stats from './stats/schemas.js';
import users from './users/schemas.js';

export const typeDefs = gql`
  ${member}
  ${posts}
  ${profiles}
  ${stats}
  ${users}
`;

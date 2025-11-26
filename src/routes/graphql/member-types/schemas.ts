import member from './member-types/schemas.js.js';
import posts from './posts/schemas.js.js';
import profiles from './profiles/schemas.js.js';
import stats from './stats/schemas.js.js';
import users from './users/schemas.js.js';

export const typeDefs = `
  ${member}
  ${posts}
  ${profiles}
  ${stats}
  ${users}
`;

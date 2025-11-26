import * as member from './member-types/index.js';
import * as posts from './posts/index.js';
import * as profiles from './profiles/index.js';
import * as stats from './stats/index.js';
import * as users from './users/index.js';

export function loadResolvers() {
  return [
    member.resolvers,
    posts.resolvers,
    profiles.resolvers,
    stats.resolvers,
    users.resolvers,
  ];
}

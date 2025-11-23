import { gql } from 'mercurius';

export const typeDefs = gql`
  ################################################
  # Root
  ################################################
  type Query {
    users: [User!]!
    user(id: ID!): User

    posts: [Post!]!
    post(id: ID!): Post

    profiles: [Profile!]!
    profile(id: ID!): Profile

    stats: [Stats!]!
    stat(id: ID!): Stats
  }

  type Mutation {
    createUser(name: String!, email: String): User!
    updateUser(id: ID!, name: String, email: String): User!
    deleteUser(id: ID!): Boolean!

    createPost(authorId: ID!, title: String!): Post!
    updatePost(id: ID!, title: String): Post!
    deletePost(id: ID!): Boolean!
  }

  ################################################
  # Domain types
  ################################################
  type User {
    id: ID!
    name: String!
    email: String
    posts: [Post!]
    profile: Profile
    stats: Stats
    subs: [User!]       # подписчики / подчинённые (depends on your prisma schema)
  }

  type Post {
    id: ID!
    title: String!
    content: String
    author: User!
  }

  type Profile {
    id: ID!
    bio: String
    user: User!
  }

  type Stats {
    id: ID!
    rating: Int
    user: User!
  }
`;

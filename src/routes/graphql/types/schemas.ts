import { gql } from 'mercurius';

export const typeDefs = gql`
  type Query {
    members: [Member!]!
    member(id: ID!): Member

    posts: [Post!]!
    post(id: ID!): Post

    profiles: [Profile!]!
    profile(id: ID!): Profile

    stats: [Stats!]!
  }

  type Mutation {
    createMember(name: String!): Member!
    updateMember(id: ID!, name: String!): Member!
    deleteMember(id: ID!): Boolean!

    createPost(authorId: ID!, title: String!): Post!
    updatePost(id: ID!, title: String!): Post!
    deletePost(id: ID!): Boolean!
  }

  # TYPES
  type Member {
    id: ID!
    name: String!
    posts: [Post!]
    profile: Profile
    stats: Stats
  }

  type Post {
    id: ID!
    title: String!
    author: Member!
  }

  type Profile {
    id: ID!
    bio: String
    member: Member!
  }

  type Stats {
    id: ID!
    rating: Int
    member: Member!
  }
`;

export const typeDefs = `
  type Query {
    users: [User!]!
    user(id: ID!): User

    posts: [Post!]!
    post(id: ID!): Post
  }

  type Mutation {
    createUser(name: String!, balance: Float): User!
    updateUser(id: ID!, name: String, balance: Float): User!
    deleteUser(id: ID!): Boolean!
    createPost(authorId: ID!, title: String!, content: String): Post!
  }

  type User {
    id: ID!
    name: String!
    balance: Float!
    profile: Profile
    posts: [Post!]!
    subs: [User!]!           # подписчики (users, у которых author == this user)
  }

  type Post {
    id: ID!
    title: String!
    content: String
    author: User!
  }

  type Profile {
    id: ID!
    isMale: Boolean!
    yearOfBirth: Int!
    user: User!
    memberType: MemberType!
  }

  type MemberType {
    id: ID!
    discount: Float!
    postsLimitPerMonth: Int!
  }
`;

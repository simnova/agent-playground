import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Query {
    hello: String!
    messages: [Message!]!
  }

  type Mutation {
    addMessage(text: String!): Message!
  }

  type Message {
    id: ID!
    text: String!
  }
`;

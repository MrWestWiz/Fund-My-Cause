import { buildSchema } from 'graphql';

export const schema = buildSchema(`
  type Campaign {
    id: ID!
    creatorAddress: String!
    contractAddress: String!
    tokenAddress: String!
    title: String!
    description: String
    goal: BigInt!
    totalRaised: BigInt!
    status: CampaignStatus!
    deadline: Int!
    minContribution: BigInt!
    contributorCount: Int!
    contributions(first: Int, after: String): ContributionConnection!
    progress: Float!
    createdAt: String!
    updatedAt: String!
  }

  enum CampaignStatus {
    ACTIVE
    SUCCEEDED
    FAILED
  }

  type Contribution {
    id: ID!
    contributorAddress: String!
    amount: BigInt!
    tokenAmount: BigInt!
    contributedAt: String!
    txHash: String
  }

  type ContributionConnection {
    edges: [ContributionEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ContributionEdge {
    cursor: String!
    node: Contribution!
  }

  type PageInfo {
    endCursor: String
    hasNextPage: Boolean!
  }

  type Stats {
    totalCampaigns: Int!
    activeCampaigns: Int!
    succeededCampaigns: Int!
    totalRaised: BigInt!
    totalContributors: Int!
    avgRaisedPerCampaign: Float!
  }

  type Query {
    campaign(id: ID!): Campaign
    campaigns(first: Int, after: String, status: CampaignStatus): CampaignConnection!
    stats: Stats!
  }

  type CampaignConnection {
    edges: [CampaignEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type CampaignEdge {
    cursor: String!
    node: Campaign!
  }

  scalar BigInt
`);

export interface GraphQLContext {
  pool: any;
  loaders: any;
}

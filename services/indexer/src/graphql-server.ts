import express, { Express } from 'express';
import { graphqlHTTP } from 'express-graphql';
import { parse, validate } from 'graphql';
import { schema } from './graphql-resolvers.js';
import { analyzeQueryComplexity } from './graphql-complexity.js';
import { getPool } from './db/index.js';
import { createLogger } from './logger.js';

const logger = createLogger('graphql-server');

export function setupGraphQL(app: Express) {
  app.use(
    '/graphql',
    graphqlHTTP(async (req) => ({
      schema,
      context: {
        pool: getPool(),
        req
      },
      rootValue: {},
      customFormatErrorFn: (error) => {
        logger.error('GraphQL error', error);
        return {
          message: error.message,
          locations: error.locations,
          path: error.path
        };
      },
      graphiql: process.env.NODE_ENV !== 'production'
    }))
  );

  // Complexity analysis middleware
  app.post('/graphql', express.json(), (req, res, next) => {
    try {
      const query = req.body.query;
      if (query) {
        const document = parse(query);
        const { complexity, depth } = analyzeQueryComplexity(document);
        logger.info(`Query complexity: ${complexity}, depth: ${depth}`);
      }
    } catch (err) {
      logger.error('Query analysis error', err);
    }
    next();
  });
}

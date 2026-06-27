import { RequestInfo, RequestInit } from 'undici';
import { GraphQLError } from 'graphql';

const MAX_QUERY_COMPLEXITY = 1000;
const MAX_QUERY_DEPTH = 10;

export interface ComplexityEstimate {
  complexity: number;
  depth: number;
}

export function analyzeQueryComplexity(document: any): ComplexityEstimate {
  let complexity = 0;
  let maxDepth = 0;

  function traverse(node: any, depth: number = 0): number {
    maxDepth = Math.max(maxDepth, depth);

    if (depth > MAX_QUERY_DEPTH) {
      throw new GraphQLError(`Query depth exceeds maximum allowed depth of ${MAX_QUERY_DEPTH}`);
    }

    if (!node) return 0;

    let nodeComplexity = 1;

    if (node.selectionSet) {
      for (const selection of node.selectionSet.selections) {
        if (selection.name?.value === 'contributions' || selection.name?.value === 'campaigns') {
          nodeComplexity += 5;
        }
        nodeComplexity += traverse(selection, depth + 1);
      }
    }

    return nodeComplexity;
  }

  if (document.definitions) {
    for (const definition of document.definitions) {
      if (definition.operation === 'query' || !definition.operation) {
        complexity += traverse(definition);
      }
    }
  }

  if (complexity > MAX_QUERY_COMPLEXITY) {
    throw new GraphQLError(
      `Query complexity ${complexity} exceeds maximum allowed complexity of ${MAX_QUERY_COMPLEXITY}`
    );
  }

  return { complexity, depth: maxDepth };
}

/*
 * Convex React Hooks
 * Wrapper hooks for Convex queries and mutations
 */

import { useQuery, useMutation } from 'convex/react';
import type { FunctionReference } from 'convex/server';

/**
 * Hook for Convex queries
 * @param query - The Convex query function reference
 * @param args - Arguments to pass to the query
 * @returns Query result with data, isLoading, and error
 */
export function useConvexQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  args?: Query['_args']
) {
  const result = useQuery(query, args as any);
  
  return {
    data: result,
    isLoading: result === undefined,
    error: null, // Convex doesn't expose errors this way, but we keep the API consistent
  };
}

/**
 * Hook for Convex mutations
 * @param mutation - The Convex mutation function reference
 * @returns Mutation function and loading state
 */
export function useConvexMutation<Mutation extends FunctionReference<'mutation'>>(
  mutation: Mutation
) {
  const mutate = useMutation(mutation);
  
  return {
    mutate: async (args?: Mutation['_args']) => {
      return await mutate(args as any);
    },
    isLoading: false, // Convex mutations are async but don't expose loading state
  };
}


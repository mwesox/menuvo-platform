/**
 * Service points queries and mutations using tRPC
 *
 * Custom hooks have been removed - use direct tRPC patterns in components:
 * const trpc = useTRPC();
 * const create = useMutation({
 *   ...trpc.store.servicePoints.create.mutationOptions(),
 *   onSuccess: () => { ... },
 * });
 */

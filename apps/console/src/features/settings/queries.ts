/**
 * Settings queries and mutations using tRPC
 *
 * Custom hooks have been removed - use direct tRPC patterns in components:
 * const trpc = useTRPC();
 * const update = useMutation({
 *   ...trpc.merchant.updateGeneral.mutationOptions(),
 *   onSuccess: () => { ... },
 * });
 */

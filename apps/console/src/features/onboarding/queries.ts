/**
 * Onboarding queries and mutations using tRPC
 *
 * Custom hooks have been removed - use direct tRPC patterns in components:
 * const trpc = useTRPC();
 * const onboard = useMutation({
 *   ...trpc.auth.onboard.mutationOptions(),
 *   mutationFn: async (input) => { ... },
 *   onSuccess: () => { ... },
 * });
 */

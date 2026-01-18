/**
 * Console order queries and mutations using tRPC
 *
 * Custom hooks have been removed - use direct tRPC patterns in components:
 * const trpc = useTRPC();
 * const refund = useMutation({
 *   ...trpc.order.createRefund.mutationOptions(),
 *   onSuccess: () => { ... },
 * });
 */

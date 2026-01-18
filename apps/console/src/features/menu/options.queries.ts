/**
 * Menu options (option groups & choices) queries and mutations using tRPC
 *
 * Custom hooks have been removed - use direct tRPC patterns in components:
 * const trpc = useTRPC();
 * const saveGroup = useMutation({
 *   ...trpc.menu.options.saveGroupWithChoices.mutationOptions(),
 *   onSuccess: () => { ... },
 * });
 */

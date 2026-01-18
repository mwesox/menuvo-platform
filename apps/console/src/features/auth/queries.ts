/**
 * Auth queries and mutations using tRPC
 *
 * Note: Login/register are handled externally (e.g., OAuth, SSO).
 * This module only handles session queries and logout.
 *
 * Custom hooks have been removed - use direct tRPC patterns in components:
 * const trpc = useTRPC();
 * const logout = useMutation({
 *   ...trpc.auth.logout.mutationOptions(),
 *   onSuccess: () => { ... },
 * });
 */

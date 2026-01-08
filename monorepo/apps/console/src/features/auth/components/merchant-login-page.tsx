import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { Building2, Mail, Plus, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@menuvo/ui/button";
import { Card, CardDescription, CardHeader } from "@menuvo/ui/card";
import { LinkCard } from "@menuvo/ui/link-card";
import { Logo } from "@menuvo/ui/logo";
import { authQueries } from "../queries";

export function MerchantLoginPage() {
	const router = useRouter();

	const { data: merchants } = useSuspenseQuery(authQueries.allMerchants);

	const loginMutation = useMutation({
		mutationFn: async (_merchantId: string): Promise<void> => {
			// TODO: Implement dev login via API route
			// This requires a dev-only API endpoint that sets the session cookie
			// e.g., POST /api/dev/login with { merchantId }
			toast.error("Dev login not implemented - need API route");
			throw new Error("Dev login not implemented via tRPC");
		},
		onSuccess: async () => {
			// Invalidate router to re-run beforeLoad with new cookie
			await router.invalidate();
			router.navigate({ to: "/console" });
		},
	});

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-3xl px-4 py-12">
				<div className="mb-8 text-center">
					<h1 className="flex items-center justify-center gap-2 font-bold text-3xl tracking-tight">
						Developer Login
						<Logo height={66} />
					</h1>
					<p className="mt-2 text-muted-foreground">
						Select a merchant account to continue
					</p>
				</div>

				{merchants.length === 0 ? (
					<Card>
						<CardHeader className="text-center">
							<CardDescription>
								No merchants found.{" "}
								<Link to="/onboarding" className="text-primary hover:underline">
									Create one first
								</Link>
							</CardDescription>
						</CardHeader>
					</Card>
				) : (
					<div className="grid gap-4">
						{merchants.map((merchant) => (
							<LinkCard
								key={merchant.id}
								icon={Building2}
								title={merchant.name}
								onClick={() => loginMutation.mutate(merchant.id)}
								disabled={loginMutation.isPending}
								showChevron
								description={
									<span className="flex flex-wrap items-center gap-4">
										<span className="flex items-center gap-1">
											<User className="size-4" />
											{merchant.ownerName}
										</span>
										<span className="flex items-center gap-1">
											<Mail className="size-4" />
											{merchant.email}
										</span>
										{merchant.stores[0] && (
											<span className="flex items-center gap-1">
												<Building2 className="size-4" />
												{merchant.stores[0].name}
											</span>
										)}
									</span>
								}
							/>
						))}

						<Card className="border-dashed">
							<CardHeader className="text-center">
								<Link to="/onboarding">
									<Button variant="ghost" className="gap-2">
										<Plus className="size-4" />
										Create new merchant
									</Button>
								</Link>
							</CardHeader>
						</Card>
					</div>
				)}
			</div>
		</div>
	);
}

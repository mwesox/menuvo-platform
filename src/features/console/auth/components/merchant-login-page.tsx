import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { Building2, Mail, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { authQueries } from "../queries";
import { loginAsMerchant } from "../server/fake-auth.functions";

export function MerchantLoginPage() {
	const router = useRouter();
	const queryClient = useQueryClient();

	const { data: merchants } = useSuspenseQuery(authQueries.allMerchants);

	const loginMutation = useMutation({
		mutationFn: (merchantId: number) =>
			loginAsMerchant({ data: { merchantId } }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["current-merchant"] });
			router.navigate({ to: "/console" });
		},
	});

	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
			<div className="mx-auto max-w-3xl px-4 py-12">
				<div className="mb-8 text-center">
					<h1 className="flex items-center justify-center gap-2 text-3xl font-bold tracking-tight">
						Developer Login
						<Logo height={66} />
					</h1>
					<p className="mt-2 text-zinc-600 dark:text-zinc-400">
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
							<Card
								key={merchant.id}
								className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent/50"
								onClick={() => loginMutation.mutate(merchant.id)}
							>
								<CardHeader className="pb-4">
									<div className="flex items-center justify-between">
										<CardTitle className="text-lg">{merchant.name}</CardTitle>
										<Button size="sm" disabled={loginMutation.isPending}>
											{loginMutation.isPending ? "Logging in..." : "Login"}
										</Button>
									</div>
									<CardDescription className="flex flex-wrap items-center gap-4 pt-2">
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
									</CardDescription>
								</CardHeader>
							</Card>
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

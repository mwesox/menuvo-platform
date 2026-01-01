import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { storeQueries } from "@/features/stores/queries";

export const Route = createFileRoute("/")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(storeQueries.list());
	},
	component: DiscoveryPage,
});

function DiscoveryPage() {
	const { t } = useTranslation("common");
	const { data: stores } = useSuspenseQuery(storeQueries.list());
	const [selectedCity, setSelectedCity] = useState<string>("all");

	const cities = useMemo(() => {
		const uniqueCities = [
			...new Set(
				stores.map((s) => s.city).filter((c): c is string => Boolean(c)),
			),
		];
		return uniqueCities.sort();
	}, [stores]);

	const filteredStores = useMemo(() => {
		if (selectedCity === "all") return stores;
		return stores.filter((s) => s.city === selectedCity);
	}, [stores, selectedCity]);

	return (
		<div className="min-h-screen bg-muted/30">
			<div className="mx-auto max-w-4xl px-4 py-8">
				<header className="mb-8 text-center">
					<img
						src="/menuvo-logo.svg"
						alt="Menuvo"
						className="mx-auto h-10 w-auto"
					/>
					<p className="mt-2 text-muted-foreground">{t("home.tagline")}</p>
				</header>

				<div className="mb-6 flex items-center gap-3">
					<MapPin className="size-4 text-muted-foreground" />
					<Select value={selectedCity} onValueChange={setSelectedCity}>
						<SelectTrigger className="w-[200px]">
							<SelectValue placeholder={t("misc.select")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t("home.allCities")}</SelectItem>
							{cities.map((city) => (
								<SelectItem key={city} value={city}>
									{city}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{filteredStores.length === 0 ? (
					<div className="py-12 text-center text-muted-foreground">
						{t("home.noRestaurants")}
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{filteredStores.map((store) => (
							<Card
								key={store.id}
								className="transition-shadow hover:shadow-md"
							>
								<CardHeader className="pb-2">
									<CardTitle className="text-lg">{store.name}</CardTitle>
									<CardDescription className="flex items-center gap-1">
										<MapPin className="size-3" />
										{store.city}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<Button asChild variant="outline" size="sm">
										<Link to="/console/menu" search={{ storeId: store.id }}>
											<Settings className="size-4" />
											{t("home.console")}
										</Link>
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

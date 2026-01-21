import {
	Box,
	Center,
	Circle,
	Flex,
	Image,
	SimpleGrid,
	VStack,
} from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { useQuery } from "@tanstack/react-query";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { useTranslation } from "react-i18next";
import { LuSearch, LuStore } from "react-icons/lu";
import { useTRPC } from "../../../lib/trpc";
import {
	ShopButton,
	ShopHeading,
	ShopMutedText,
} from "../../shared/components/ui";
import { useStoreDiscovery } from "../hooks/use-store-discovery";
import { DiscoveryEmptyState } from "./discovery-empty-state";
import { StoreCard } from "./store-card";
import { StoreCardSkeletonGrid } from "./store-card-skeleton";
import { StoreSearch } from "./store-search";

type RouterOutput = inferRouterOutputs<AppRouter>;
type FeaturedStores = RouterOutput["store"]["getFeaturedStores"];

export function DiscoveryPage() {
	const { t } = useTranslation("discovery");
	const trpc = useTRPC();
	const { data } = useQuery({
		...trpc.store.getFeaturedStores.queryOptions({ limit: 20 }),
		staleTime: 1000 * 60 * 5,
	});

	// Type assertion - the API returns stores matching the hook's expected shape
	const stores: FeaturedStores = (data ?? []) as FeaturedStores;

	const {
		cities,
		filteredStores,
		searchQuery,
		setSearchQuery,
		selectedCity,
		setSelectedCity,
		clearFilters,
		hasActiveFilters,
	} = useStoreDiscovery({ stores });

	return (
		<Box minH="100vh">
			{/* Hero section */}
			<Box px={{ base: "4", sm: "6", lg: "8" }} pt={{ base: "12", sm: "14" }}>
				<Box maxW="3xl" mx="auto" textAlign="center">
					{/* Brand logo */}
					<Flex
						justify="center"
						mb={{ base: "4", sm: "5" }}
						animation="fadeIn 0.5s ease-out, scaleIn 0.5s ease-out"
						css={{
							"@keyframes fadeIn": {
								from: { opacity: 0 },
								to: { opacity: 1 },
							},
							"@keyframes scaleIn": {
								from: { transform: "scale(0.95)" },
								to: { transform: "scale(1)" },
							},
						}}
					>
						<Image
							src="/menuvo-logo-horizontal.svg"
							alt="Menuvo"
							h={{ base: "10", sm: "11" }}
						/>
					</Flex>

					{/* Main headline */}
					<ShopHeading
						as="h1"
						size="2xl"
						fontSize={{ base: "2xl", sm: "3xl" }}
						lineHeight="1.15"
						letterSpacing="tight"
						textWrap="balance"
						animation="fadeIn 0.5s ease-out 0.1s both, slideUp 0.5s ease-out 0.1s both"
						css={{
							"@keyframes slideUp": {
								from: { transform: "translateY(8px)" },
								to: { transform: "translateY(0)" },
							},
						}}
					>
						{t("page.title")}
					</ShopHeading>

					{/* Search */}
					<Box
						mt={{ base: "4", sm: "5" }}
						animation="fadeIn 0.5s ease-out 0.2s both, slideUp 0.5s ease-out 0.2s both"
					>
						<StoreSearch
							cities={cities}
							selectedCity={selectedCity}
							searchQuery={searchQuery}
							onCityChange={setSelectedCity}
							onSearchChange={setSearchQuery}
						/>
					</Box>
				</Box>
			</Box>

			{/* Store grid */}
			<Box
				px={{ base: "4", sm: "6", lg: "8" }}
				pt={{ base: "5", sm: "6" }}
				pb="16"
			>
				<Box maxW="6xl" mx="auto">
					{filteredStores.length === 0 ? (
						<DiscoveryEmptyState
							hasFilters={hasActiveFilters}
							onClearFilters={clearFilters}
						/>
					) : (
						<SimpleGrid
							columns={{ base: 1, sm: 2, lg: 3 }}
							gap={{ base: "5", sm: "6", lg: "7" }}
						>
							{filteredStores.map((store, index) => (
								<StoreCard
									key={store.id}
									store={store}
									style={{ animationDelay: `${index * 60}ms` }}
								/>
							))}
						</SimpleGrid>
					)}
				</Box>
			</Box>
		</Box>
	);
}

export function DiscoveryPageSkeleton() {
	const { t } = useTranslation("discovery");

	return (
		<Box minH="100vh">
			{/* Hero section */}
			<Box px={{ base: "4", sm: "6", lg: "8" }} pt={{ base: "12", sm: "14" }}>
				<Box maxW="3xl" mx="auto" textAlign="center">
					{/* Brand logo */}
					<Flex justify="center" mb={{ base: "4", sm: "5" }}>
						<Image
							src="/menuvo-logo-horizontal.svg"
							alt="Menuvo"
							h={{ base: "10", sm: "11" }}
						/>
					</Flex>

					<ShopHeading
						as="h1"
						size="2xl"
						fontSize={{ base: "2xl", sm: "3xl" }}
						lineHeight="1.15"
						letterSpacing="tight"
						textWrap="balance"
					>
						{t("page.title")}
					</ShopHeading>

					{/* Search placeholder */}
					<VStack mt={{ base: "4", sm: "5" }} gap="4">
						<Flex
							h="14"
							align="center"
							gap="3"
							rounded="xl"
							bg="bg.panel"
							px="5"
							shadow="lg"
							borderWidth="1px"
							borderColor="border.muted"
						>
							<Box as={LuSearch} boxSize="5" color="fg.muted" opacity={0.6} />
							<ShopMutedText opacity={0.5}>
								{t("loading.searchPlaceholder")}
							</ShopMutedText>
						</Flex>
					</VStack>
				</Box>
			</Box>

			{/* Store grid skeleton */}
			<Box
				px={{ base: "4", sm: "6", lg: "8" }}
				pt={{ base: "5", sm: "6" }}
				pb="16"
			>
				<Box maxW="6xl" mx="auto">
					<StoreCardSkeletonGrid />
				</Box>
			</Box>
		</Box>
	);
}

export function DiscoveryPageError({ reset }: ErrorComponentProps) {
	const { t } = useTranslation("discovery");

	return (
		<Center minH="60vh" px="4" textAlign="center">
			<VStack gap="4">
				<Circle size="16" bg="bg.muted">
					<Box as={LuStore} boxSize="8" color="fg.muted" />
				</Circle>
				<ShopHeading as="h2" size="lg">
					{t("error.title")}
				</ShopHeading>
				<ShopMutedText maxW="sm" mt="-2">
					{t("error.description")}
				</ShopMutedText>
				<ShopButton variant="primary" size="md" onClick={reset}>
					{t("error.tryAgain")}
				</ShopButton>
			</VStack>
		</Center>
	);
}

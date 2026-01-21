import { Card, HStack, SimpleGrid, Skeleton, VStack } from "@chakra-ui/react";
import {
	CardFormSkeleton,
	PageActionBarSkeleton,
} from "@/components/layout/skeletons";

/**
 * Skeleton for a single store card matching store-card.tsx layout.
 */
export function StoreCardSkeleton() {
	return (
		<Card.Root h="full" overflow="hidden">
			<Card.Header pb="4">
				<HStack align="flex-start" gap="4">
					{/* Icon */}
					<Skeleton h="12" w="12" flexShrink="0" rounded="lg" />
					<VStack flex="1" gap="2" align="stretch">
						{/* Store name */}
						<Skeleton h="6" w="3/4" />
						{/* Address */}
						<HStack align="flex-start" gap="1.5">
							<Skeleton mt="0.5" h="4" w="4" flexShrink="0" rounded="full" />
							<VStack gap="1" align="stretch">
								<Skeleton h="4" w="40" />
								<Skeleton h="4" w="32" />
							</VStack>
						</HStack>
					</VStack>
				</HStack>
			</Card.Header>
			<Card.Body pt="0">
				<SimpleGrid columns={2} gap="4">
					<HStack align="center" gap="2">
						<Skeleton h="4" w="4" rounded="full" />
						<Skeleton h="4" w="24" />
					</HStack>
					<HStack align="center" gap="2">
						<Skeleton h="4" w="4" rounded="full" />
						<Skeleton h="4" w="32" />
					</HStack>
				</SimpleGrid>
			</Card.Body>
		</Card.Root>
	);
}

/**
 * Skeleton for the stores list page.
 */
export function StoresPageSkeleton() {
	return (
		<VStack gap="6" align="stretch">
			<PageActionBarSkeleton />

			<SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
				<StoreCardSkeleton />
				<StoreCardSkeleton />
				<StoreCardSkeleton />
				<StoreCardSkeleton />
			</SimpleGrid>
		</VStack>
	);
}

/**
 * Skeleton for the store detail/edit page.
 * Matches the layout of $storeId.tsx with tabs and form sections.
 */
export function StoreDetailSkeleton() {
	return (
		<VStack gap="6" align="stretch">
			<PageActionBarSkeleton withTabs />
			<StoreDetailContentSkeleton />
		</VStack>
	);
}

/**
 * Skeleton for the store detail content area only (without PageActionBar/tabs).
 * Used when tabs should remain visible during loading.
 */
export function StoreDetailContentSkeleton() {
	return (
		<VStack gap="6" align="stretch" mt="6">
			{/* Active Status Toggle */}
			<HStack
				justify="space-between"
				align="center"
				rounded="lg"
				borderWidth="1px"
				p="4"
			>
				<VStack gap="1" align="stretch">
					<Skeleton h="5" w="24" />
					<Skeleton h="4" w="48" />
				</VStack>
				<Skeleton h="6" w="11" rounded="full" />
			</HStack>

			{/* Store form card */}
			<CardFormSkeleton rows={5} />

			{/* Image fields card */}
			<Card.Root>
				<Card.Header>
					<VStack gap="1" align="stretch">
						<Skeleton h="6" w="32" />
						<Skeleton h="4" w="56" />
					</VStack>
				</Card.Header>
				<Card.Body>
					<Skeleton h="32" w="32" rounded="lg" />
				</Card.Body>
			</Card.Root>
		</VStack>
	);
}

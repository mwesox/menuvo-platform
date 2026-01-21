import { Card, HStack, SimpleGrid, Skeleton, VStack } from "@chakra-ui/react";
import {
	CardFormSkeleton,
	PageActionBarSkeleton,
} from "@/components/layout/skeletons";

/**
 * Skeleton for a status card (used in payments).
 */
function StatusCardSkeleton() {
	return (
		<Card.Root>
			<Card.Header>
				<HStack justify="space-between" align="center">
					<VStack gap="2" align="stretch">
						<Skeleton h="5" w="24" />
						<Skeleton h="4" w="40" />
					</VStack>
					<Skeleton h="6" w="20" rounded="full" />
				</HStack>
			</Card.Header>
			<Card.Body>
				<VStack gap="3" align="stretch">
					<HStack justify="space-between" align="center">
						<Skeleton h="4" w="32" />
						<Skeleton h="4" w="24" />
					</HStack>
					<HStack justify="space-between" align="center">
						<Skeleton h="4" w="28" />
						<Skeleton h="4" w="20" />
					</HStack>
				</VStack>
			</Card.Body>
		</Card.Root>
	);
}

/**
 * Skeleton for the payments settings page.
 * @deprecated Use inline skeleton in settings index route
 */
export function PaymentsPageSkeleton() {
	return (
		<VStack gap="6" align="stretch">
			<PageActionBarSkeleton />

			<VStack gap="6" align="stretch">
				<StatusCardSkeleton />

				{/* Action buttons */}
				<HStack gap="3">
					<Skeleton h="10" w="40" />
					<Skeleton h="10" w="32" />
				</HStack>
			</VStack>
		</VStack>
	);
}

/**
 * Skeleton for the merchant settings page (tabs + form cards).
 * @deprecated Use inline skeleton in settings index route
 */
export function MerchantSettingsPageSkeleton() {
	return (
		<VStack gap="6" align="stretch">
			<PageActionBarSkeleton withTabs />

			<VStack gap="6" align="stretch" mt="6">
				<CardFormSkeleton rows={4} />
				<CardFormSkeleton rows={3} />
			</VStack>
		</VStack>
	);
}

/**
 * Skeleton for the settings hub page (grid of nav cards).
 * @deprecated Settings now uses sidebar layout
 */
export function SettingsHubPageSkeleton() {
	return (
		<VStack gap="6" align="stretch">
			<PageActionBarSkeleton />

			<SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
				<SettingsNavCardSkeleton />
				<SettingsNavCardSkeleton />
				<SettingsNavCardSkeleton />
				<SettingsNavCardSkeleton />
			</SimpleGrid>
		</VStack>
	);
}

/**
 * Skeleton for a settings navigation card.
 * @deprecated Settings now uses sidebar layout
 */
function SettingsNavCardSkeleton() {
	return (
		<Card.Root>
			<Card.Body p="6">
				<HStack align="flex-start" gap="4">
					<Skeleton h="10" w="10" rounded="lg" />
					<VStack flex="1" gap="2" align="stretch">
						<Skeleton h="5" w="32" />
						<Skeleton h="4" w="48" />
					</VStack>
				</HStack>
			</Card.Body>
		</Card.Root>
	);
}

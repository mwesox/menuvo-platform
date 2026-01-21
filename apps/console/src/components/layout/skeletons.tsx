import { Card, HStack, Skeleton, VStack } from "@chakra-ui/react";

// Pre-generated stable keys for skeleton items (skeletons are static, never reorder)
const MASTER_LIST_KEYS = ["ml-1", "ml-2", "ml-3", "ml-4", "ml-5"] as const;
const DETAIL_PANEL_KEYS = ["dp-1", "dp-2", "dp-3", "dp-4"] as const;

interface PageActionBarSkeletonProps {
	withTabs?: boolean;
}

export function PageActionBarSkeleton({
	withTabs = false,
}: PageActionBarSkeletonProps) {
	return (
		<VStack gap="4" align="stretch">
			<HStack justify="space-between" align="center">
				<Skeleton h="8" w="48" />
				<Skeleton h="10" w="32" />
			</HStack>
			{withTabs && (
				<HStack gap="2">
					<Skeleton h="9" w="24" />
					<Skeleton h="9" w="24" />
					<Skeleton h="9" w="24" />
				</HStack>
			)}
		</VStack>
	);
}

interface CardFormSkeletonProps {
	rows?: number;
}

export function CardFormSkeleton({ rows = 3 }: CardFormSkeletonProps) {
	// Generate stable keys based on row count (skeleton rows are static, never reorder)
	const rowKeys = Array.from({ length: rows }, (_, i) => `form-row-${i}`);

	return (
		<Card.Root>
			<Card.Header>
				<VStack gap="1" align="stretch">
					<Skeleton h="6" w="40" />
					<Skeleton h="4" w="64" />
				</VStack>
			</Card.Header>
			<Card.Body>
				<VStack gap="4" align="stretch">
					{rowKeys.map((key) => (
						<VStack key={key} gap="2" align="stretch">
							<Skeleton h="4" w="24" />
							<Skeleton h="10" w="full" />
						</VStack>
					))}
					<Skeleton mt="4" h="10" w="28" />
				</VStack>
			</Card.Body>
		</Card.Root>
	);
}

export function MasterListSkeleton() {
	return (
		<VStack gap="3" align="stretch">
			{MASTER_LIST_KEYS.map((key) => (
				<HStack
					key={key}
					align="center"
					gap="4"
					rounded="lg"
					borderWidth="1px"
					p="4"
				>
					<Skeleton h="10" w="10" rounded="md" />
					<VStack flex="1" gap="2" align="stretch">
						<Skeleton h="4" w="32" />
						<Skeleton h="3" w="24" />
					</VStack>
				</HStack>
			))}
		</VStack>
	);
}

export function DetailPanelSkeleton() {
	return (
		<VStack gap="6" align="stretch">
			<HStack align="center" gap="4">
				<Skeleton h="16" w="16" rounded="lg" />
				<VStack gap="2" align="stretch">
					<Skeleton h="6" w="40" />
					<Skeleton h="4" w="24" />
				</VStack>
			</HStack>
			<VStack gap="4" align="stretch">
				{DETAIL_PANEL_KEYS.map((key) => (
					<VStack key={key} gap="2" align="stretch">
						<Skeleton h="4" w="20" />
						<Skeleton h="5" w="full" />
					</VStack>
				))}
			</VStack>
		</VStack>
	);
}

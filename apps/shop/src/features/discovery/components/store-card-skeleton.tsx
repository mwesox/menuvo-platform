import {
	Box,
	HStack,
	SimpleGrid,
	Skeleton,
	SkeletonCircle,
} from "@chakra-ui/react";

export function StoreCardSkeleton() {
	return (
		<Box
			overflow="hidden"
			rounded="xl"
			bg="bg.panel"
			borderWidth="1px"
			borderColor="border.muted"
		>
			{/* Image skeleton - 16:10 aspect ratio to match card */}
			<Skeleton aspectRatio="16 / 10" rounded="none" />

			{/* Content */}
			<Box p={{ base: "4", sm: "5" }}>
				{/* Store name skeleton */}
				<Skeleton height="6" width="75%" />

				{/* Address skeleton */}
				<HStack mt="2" gap="1.5">
					<SkeletonCircle size="3.5" />
					<Skeleton height="4" width="40" />
				</HStack>
			</Box>
		</Box>
	);
}

export function StoreCardSkeletonGrid() {
	return (
		<SimpleGrid
			columns={{ base: 1, sm: 2, lg: 3 }}
			gap={{ base: "5", sm: "6", lg: "7" }}
		>
			<StoreCardSkeleton />
			<StoreCardSkeleton />
			<StoreCardSkeleton />
			<StoreCardSkeleton />
			<StoreCardSkeleton />
			<StoreCardSkeleton />
		</SimpleGrid>
	);
}

import { Box, Flex, HStack, Skeleton, Stack, VStack } from "@chakra-ui/react";

export function MenuItemSkeleton() {
	return (
		<Flex gap="3" rounded="xl" bg="bg.panel" p="3">
			{/* Image skeleton */}
			<Skeleton h="80px" w="80px" flexShrink={0} rounded="lg" />

			{/* Content skeleton */}
			<Flex minW="0" flex="1" direction="column" justify="space-between">
				<VStack align="stretch" gap="1.5">
					{/* Title */}
					<Skeleton h="5" w="66%" />
					{/* Description */}
					<Skeleton h="4" w="full" />
					<Skeleton h="4" w="75%" />
				</VStack>

				{/* Bottom row */}
				<HStack mt="2" justify="space-between">
					<Skeleton h="5" w="16" />
					<Skeleton h="8" w="20" rounded="lg" />
				</HStack>
			</Flex>
		</Flex>
	);
}

export function CategorySkeleton() {
	return (
		<Box mb="8">
			{/* Category header skeleton */}
			<Skeleton mb="3" h="7" w="40" />

			{/* Items skeleton */}
			<Stack gap="3">
				<MenuItemSkeleton />
				<MenuItemSkeleton />
				<MenuItemSkeleton />
			</Stack>
		</Box>
	);
}

export function StorePageSkeleton() {
	return (
		<Box minH="100vh" pb="24">
			{/* Hero skeleton */}
			<Box
				position="relative"
				h="48"
				bgGradient="to-br"
				gradientFrom="yellow.100"
				gradientTo="orange.50"
			>
				<Box position="absolute" insetX="0" bottom="0" p="4">
					<Skeleton
						mb="2"
						h="8"
						w="48"
						css={{ "--start-color": "rgba(255,255,255,0.3)" }}
					/>
					<Skeleton
						h="4"
						w="64"
						css={{ "--start-color": "rgba(255,255,255,0.2)" }}
					/>
				</Box>
			</Box>

			{/* Category nav skeleton */}
			<Box
				position="sticky"
				top="14"
				zIndex="30"
				borderBottomWidth="1px"
				borderColor="border"
				bg="bg"
			>
				<HStack gap="2" px="4" py="3">
					<Skeleton h="8" w="24" rounded="lg" />
					<Skeleton h="8" w="20" rounded="lg" />
					<Skeleton h="8" w="28" rounded="lg" />
					<Skeleton h="8" w="24" rounded="lg" />
				</HStack>
			</Box>

			{/* Menu sections skeleton */}
			<Box px="4" py="4">
				<CategorySkeleton />
				<CategorySkeleton />
			</Box>
		</Box>
	);
}

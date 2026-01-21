import { Box, Flex, HStack, Skeleton, VStack } from "@chakra-ui/react";

/**
 * Skeleton shown while store data is loading during navigation.
 * Prevents flickering by showing a consistent layout structure.
 */
export function ShopLayoutSkeleton() {
	return (
		<Flex direction="column" minH="100vh" bg="bg">
			{/* Header skeleton */}
			<Box
				as="header"
				position="sticky"
				top="0"
				zIndex="50"
				borderBottomWidth="1px"
				borderColor="border"
				bg="bg/95"
				backdropFilter="blur(8px)"
			>
				<Flex h="14" align="center" gap="4" px="4">
					{/* Back link skeleton */}
					<HStack gap="1" flexShrink="0">
						<Skeleton h="4" w="4" />
						<Skeleton h="8" w="24" display={{ base: "none", sm: "block" }} />
					</HStack>

					{/* Store info skeleton - center */}
					<Flex minW="0" flex="1" justify="center">
						<Skeleton h="5" w="32" />
					</Flex>

					{/* Search + Cart skeleton - right */}
					<HStack gap="2" flexShrink="0">
						<Skeleton
							h="9"
							w="64"
							rounded="lg"
							display={{ base: "none", md: "block" }}
						/>
						<Skeleton h="9" w="9" rounded="md" />
					</HStack>
				</Flex>
			</Box>

			{/* Main content skeleton */}
			<Box as="main" flex="1">
				<Box minH="100vh" pb="24">
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
						</HStack>
					</Box>

					{/* Menu items skeleton */}
					<Box px="4" py="4">
						<Skeleton h="7" w="40" mb="3" />
						<VStack gap="3" align="stretch">
							{/* Item skeleton 1 */}
							<Flex gap="3" rounded="xl" bg="bg.panel" p="3">
								<Skeleton h="20" w="20" flexShrink="0" rounded="lg" />
								<Flex
									direction="column"
									justify="space-between"
									flex="1"
									minW="0"
								>
									<Box>
										<Skeleton h="5" w="2/3" />
										<Skeleton h="4" w="full" mt="1.5" />
									</Box>
									<Flex align="center" justify="space-between" mt="2">
										<Skeleton h="5" w="16" />
										<Skeleton h="8" w="20" rounded="lg" />
									</Flex>
								</Flex>
							</Flex>
							{/* Item skeleton 2 */}
							<Flex gap="3" rounded="xl" bg="bg.panel" p="3">
								<Skeleton h="20" w="20" flexShrink="0" rounded="lg" />
								<Flex
									direction="column"
									justify="space-between"
									flex="1"
									minW="0"
								>
									<Box>
										<Skeleton h="5" w="1/2" />
										<Skeleton h="4" w="3/4" mt="1.5" />
									</Box>
									<Flex align="center" justify="space-between" mt="2">
										<Skeleton h="5" w="16" />
										<Skeleton h="8" w="20" rounded="lg" />
									</Flex>
								</Flex>
							</Flex>
						</VStack>
					</Box>
				</Box>
			</Box>
		</Flex>
	);
}

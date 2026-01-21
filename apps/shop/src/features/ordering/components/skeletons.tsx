import { Box, Flex, HStack, Skeleton, Stack, VStack } from "@chakra-ui/react";

/**
 * Skeleton for the ordering page.
 * Matches the warm shop theme.
 */
export function OrderingPageSkeleton() {
	return (
		<Box minH="100vh" bg="bg">
			<Box maxW="lg" mx="auto" px="4" py="6">
				{/* Header */}
				<Skeleton h="8" w="32" mb="6" />

				<Stack gap="6">
					{/* Order Type Selection Card */}
					<Box rounded="xl" bg="bg.panel" p="4">
						<Stack gap="4">
							<Skeleton h="5" w="24" />
							<Stack gap="3">
								<HStack gap="3">
									<Skeleton boxSize="4" rounded="full" />
									<Skeleton h="4" w="20" />
								</HStack>
								<HStack gap="3">
									<Skeleton boxSize="4" rounded="full" />
									<Skeleton h="4" w="24" />
								</HStack>
								<HStack gap="3">
									<Skeleton boxSize="4" rounded="full" />
									<Skeleton h="4" w="20" />
								</HStack>
							</Stack>
						</Stack>
					</Box>

					{/* Customer Name Card */}
					<Box rounded="xl" bg="bg.panel" p="4">
						<Stack gap="3">
							<Skeleton h="5" w="24" />
							<Skeleton h="10" w="full" rounded="md" />
						</Stack>
					</Box>

					{/* Order Summary Card */}
					<Box rounded="xl" bg="bg.panel" p="4">
						<Stack gap="4">
							<Skeleton h="5" w="32" />
							<Stack gap="3">
								<Flex justify="space-between">
									<Skeleton boxSize="40" />
									<Skeleton h="4" w="12" />
								</Flex>
								<Flex justify="space-between">
									<Skeleton h="4" w="32" />
									<Skeleton h="4" w="12" />
								</Flex>
							</Stack>
							<Box borderTopWidth="1px" borderColor="border" pt="3">
								<Flex justify="space-between">
									<Skeleton h="5" w="16" />
									<Skeleton h="5" w="16" />
								</Flex>
							</Box>
						</Stack>
					</Box>

					{/* Submit Button */}
					<Skeleton h="12" w="full" rounded="lg" />
				</Stack>
			</Box>
		</Box>
	);
}

/**
 * Skeleton for the order confirmation page.
 */
export function OrderConfirmationPageSkeleton() {
	return (
		<Box minH="100vh" bg="bg">
			<Box maxW="lg" mx="auto" px="4" py="6">
				{/* Success icon placeholder */}
				<VStack gap="4" mb="6">
					<Skeleton boxSize="16" rounded="full" />
					<Skeleton h="8" w="48" />
					<Skeleton h="4" w="64" />
				</VStack>

				{/* Order details card */}
				<Box rounded="xl" bg="bg.panel" p="4">
					<Stack gap="4">
						<Flex align="center" justify="space-between">
							<Skeleton h="5" w="20" />
							<Skeleton h="6" w="16" rounded="lg" />
						</Flex>
						<Stack gap="3">
							<Flex justify="space-between">
								<Skeleton h="4" w="32" />
								<Skeleton h="4" w="12" />
							</Flex>
							<Flex justify="space-between">
								<Skeleton h="4" w="28" />
								<Skeleton h="4" w="12" />
							</Flex>
						</Stack>
						<Box borderTopWidth="1px" borderColor="border" pt="3">
							<Flex justify="space-between">
								<Skeleton h="5" w="12" />
								<Skeleton h="5" w="16" />
							</Flex>
						</Box>
					</Stack>
				</Box>

				{/* Back to menu button */}
				<Skeleton h="12" w="full" rounded="lg" mt="6" />
			</Box>
		</Box>
	);
}

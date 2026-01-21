import {
	Box,
	Button,
	Card,
	Link as ChakraLink,
	Container,
	EmptyState,
	Heading,
	HStack,
	Icon,
	Text,
	VStack,
} from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { Building2, ChevronRight, Mail, Plus, User } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useTRPC } from "@/lib/trpc";

type RouterOutput = inferRouterOutputs<AppRouter>;
type MerchantList = RouterOutput["auth"]["devListMerchants"];

export function MerchantLoginPage() {
	const router = useRouter();
	const trpc = useTRPC();

	const { data: merchantsData = [] } = useQuery({
		...trpc.auth.devListMerchants.queryOptions(),
	});
	const merchants = merchantsData as MerchantList;

	const loginMutation = useMutation({
		...trpc.auth.devLogin.mutationOptions(),
		onSuccess: async () => {
			// Invalidate router to re-run queries with new cookie
			await router.invalidate();
			router.navigate({ to: "/" });
		},
	});

	return (
		<Box minH="100vh" bg="bg" py={{ base: "8", md: "12" }}>
			<Container maxW="3xl" px={{ base: "4", sm: "6" }}>
				<VStack gap="8" align="stretch">
					{/* Header */}
					<VStack gap="2" textAlign="center">
						<HStack gap="2" justify="center" align="center">
							<Heading
								as="h1"
								fontWeight="bold"
								textStyle="3xl"
								letterSpacing="tight"
							>
								Developer Login
							</Heading>
							<Logo height={66} />
						</HStack>
						<Text color="fg.muted" textStyle="md">
							Select a merchant account to continue
						</Text>
					</VStack>

					{merchants.length === 0 ? (
						<Card.Root>
							<Card.Body>
								<EmptyState.Root>
									<EmptyState.Content>
										<EmptyState.Indicator>
											<Icon fontSize="2xl" color="fg.muted">
												<Building2 style={{ height: "2rem", width: "2rem" }} />
											</Icon>
										</EmptyState.Indicator>
										<VStack textAlign="center" gap="2">
											<EmptyState.Title>No merchants found</EmptyState.Title>
											<EmptyState.Description>
												<Text>
													No merchants found.{" "}
													<ChakraLink
														asChild
														color="primary"
														textDecoration="underline"
														_hover={{ textDecoration: "none" }}
													>
														<Link to="/">Create one first</Link>
													</ChakraLink>
												</Text>
											</EmptyState.Description>
										</VStack>
									</EmptyState.Content>
								</EmptyState.Root>
							</Card.Body>
						</Card.Root>
					) : (
						<VStack gap="4" align="stretch">
							{merchants.map((merchant) => (
								<Button
									key={merchant.id}
									variant="ghost"
									w="full"
									h="auto"
									p="0"
									onClick={() =>
										loginMutation.mutate({ merchantId: merchant.id })
									}
									disabled={loginMutation.isPending}
									opacity={loginMutation.isPending ? 0.6 : 1}
									cursor={loginMutation.isPending ? "not-allowed" : "pointer"}
									_hover={{
										transform: loginMutation.isPending
											? undefined
											: "translateY(-2px)",
										bg: "transparent",
									}}
									transition="all 0.2s"
									textAlign="left"
									justifyContent="flex-start"
								>
									<Card.Root
										w="full"
										_hover={{ shadow: "md" }}
										transition="all 0.2s"
									>
										<Card.Body>
											<HStack
												justify="space-between"
												align="flex-start"
												gap="4"
											>
												<HStack gap="4" flex="1" align="flex-start">
													<Icon fontSize="xl" color="primary">
														<Building2
															style={{ height: "1.5rem", width: "1.5rem" }}
														/>
													</Icon>
													<VStack align="flex-start" gap="2" flex="1">
														<Card.Title>{merchant.name}</Card.Title>
														<HStack gap="4" flexWrap="wrap">
															<HStack gap="1" color="fg.muted">
																<Icon fontSize="sm">
																	<User
																		style={{ height: "1rem", width: "1rem" }}
																	/>
																</Icon>
																<Text textStyle="sm">{merchant.ownerName}</Text>
															</HStack>
															<HStack gap="1" color="fg.muted">
																<Icon fontSize="sm">
																	<Mail
																		style={{ height: "1rem", width: "1rem" }}
																	/>
																</Icon>
																<Text textStyle="sm">{merchant.email}</Text>
															</HStack>
															{merchant.stores[0] && (
																<HStack gap="1" color="fg.muted">
																	<Icon fontSize="sm">
																		<Building2
																			style={{ height: "1rem", width: "1rem" }}
																		/>
																	</Icon>
																	<Text textStyle="sm">
																		{merchant.stores[0].name}
																	</Text>
																</HStack>
															)}
														</HStack>
													</VStack>
												</HStack>
												<Icon fontSize="lg" color="fg.muted">
													<ChevronRight
														style={{ height: "1.25rem", width: "1.25rem" }}
													/>
												</Icon>
											</HStack>
										</Card.Body>
									</Card.Root>
								</Button>
							))}

							<Card.Root borderStyle="dashed">
								<Card.Body>
									<Box textAlign="center">
										<Button asChild variant="ghost" gap="2">
											<Link to="/">
												<Plus style={{ height: "1rem", width: "1rem" }} />
												Create new merchant
											</Link>
										</Button>
									</Box>
								</Card.Body>
							</Card.Root>
						</VStack>
					)}
				</VStack>
			</Container>
		</Box>
	);
}

import { Box, Card, HStack, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { Link } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { Mail, MapPin, Phone, Store as StoreIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Store = RouterOutput["store"]["list"][number];

interface StoreCardProps {
	store: Store;
}

export function StoreCard({ store }: StoreCardProps) {
	const { t } = useTranslation("stores");
	const addressLine1 = store.street || "";
	const addressLine2 = [store.city, store.postalCode, store.country]
		.filter(Boolean)
		.join(", ");

	const addressDescription =
		addressLine1 || addressLine2 ? (
			<HStack align="flex-start" gap="1.5">
				<MapPin
					style={{
						marginTop: "0.125rem",
						height: "1rem",
						width: "1rem",
						flexShrink: 0,
					}}
				/>
				<VStack align="flex-start" gap="0">
					{addressLine1 && <Text>{addressLine1}</Text>}
					{addressLine2 && <Text>{addressLine2}</Text>}
				</VStack>
			</HStack>
		) : (
			<Text>{t("labels.noAddressConfigured")}</Text>
		);

	return (
		<Link
			to="/stores/$storeId/settings"
			params={{ storeId: store.id }}
			style={{ display: "block" }}
		>
			<Card.Root
				h="full"
				cursor="pointer"
				overflow="hidden"
				transition="all"
				_hover={{ bg: "bg.muted", shadow: "md" }}
			>
				<Card.Header>
					<HStack align="flex-start" gap="4" pb="4">
						<Box
							flexShrink="0"
							h="12"
							w="12"
							display="flex"
							alignItems="center"
							justifyContent="center"
							rounded="lg"
							bg="primary/10"
						>
							<StoreIcon
								style={{ height: "1.5rem", width: "1.5rem" }}
								color="var(--chakra-colors-primary)"
							/>
						</Box>
						<VStack align="flex-start" gap="1" flex="1" minW="0">
							<Card.Title
								fontWeight="semibold"
								textStyle="xl"
								letterSpacing="tight"
							>
								{store.name}
							</Card.Title>
							<Box textStyle="sm" color="fg.muted">
								{addressDescription}
							</Box>
						</VStack>
					</HStack>
				</Card.Header>
				{(store.phone || store.email) && (
					<Card.Body pt="0">
						<SimpleGrid columns={2} gap="4">
							{store.phone && (
								<HStack gap="2" color="fg.muted" textStyle="sm">
									<Phone
										style={{ height: "1rem", width: "1rem", flexShrink: 0 }}
									/>
									<Text truncate>{store.phone}</Text>
								</HStack>
							)}
							{store.email && (
								<HStack gap="2" color="fg.muted" textStyle="sm">
									<Mail
										style={{ height: "1rem", width: "1rem", flexShrink: 0 }}
									/>
									<Text truncate>{store.email}</Text>
								</HStack>
							)}
						</SimpleGrid>
					</Card.Body>
				)}
			</Card.Root>
		</Link>
	);
}

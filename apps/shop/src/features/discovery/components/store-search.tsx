import {
	Box,
	CloseButton,
	Flex,
	Input,
	InputGroup,
	VStack,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuSearch } from "react-icons/lu";
import { ShopPillButton } from "../../shared/components/ui";

interface StoreSearchProps {
	cities: string[];
	selectedCity: string;
	searchQuery: string;
	onCityChange: (city: string) => void;
	onSearchChange: (query: string) => void;
}

export function StoreSearch({
	cities,
	selectedCity,
	searchQuery,
	onCityChange,
	onSearchChange,
}: StoreSearchProps) {
	const { t } = useTranslation("discovery");
	const cityOptions = ["all", ...cities];

	return (
		<VStack gap="4">
			{/* Search input - elevated, prominent */}
			<InputGroup
				w="full"
				startElement={
					<Box as={LuSearch} boxSize="5" color="fg.muted" opacity={0.6} />
				}
				endElement={
					searchQuery ? (
						<CloseButton
							size="sm"
							onClick={() => onSearchChange("")}
							aria-label={t("search.clearSearch")}
							me="-1"
						/>
					) : undefined
				}
			>
				<Input
					h="14"
					rounded="xl"
					bg="bg.panel"
					ps="14"
					pe="12"
					fontSize="md"
					color="fg"
					placeholder={t("search.placeholder")}
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					shadow="lg"
					borderWidth="1px"
					borderColor="border.muted"
					transition="all 0.3s"
					_hover={{
						shadow: "xl",
						borderColor: "border",
					}}
					_focus={{
						shadow: "xl",
						outline: "none",
						borderColor: "teal.solid",
						ring: "2px",
						ringColor: "teal.muted",
					}}
					_placeholder={{ color: "fg.muted", opacity: 0.5 }}
				/>
			</InputGroup>

			{/* City filter pills - centered, refined */}
			<Flex
				justify="center"
				gap="2"
				overflowX="auto"
				pb="1"
				w="full"
				css={{
					"&::-webkit-scrollbar": { display: "none" },
					msOverflowStyle: "none",
					scrollbarWidth: "none",
				}}
			>
				{cityOptions.map((city) => {
					const isSelected = city === selectedCity;
					const label = city === "all" ? t("search.allCities") : city;

					return (
						<ShopPillButton
							key={city}
							active={isSelected}
							onClick={() => onCityChange(city)}
							flexShrink={0}
							whiteSpace="nowrap"
						>
							{label}
						</ShopPillButton>
					);
				})}
			</Flex>
		</VStack>
	);
}

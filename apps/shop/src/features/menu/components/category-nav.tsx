import { Box, HStack } from "@chakra-ui/react";
import { focusRingProps, ShopPillButton } from "../../shared/components/ui";

interface CategoryNavProps {
	categories: {
		id: string;
		name: string;
	}[];
	activeCategoryId: string | null;
	onCategoryClick: (categoryId: string) => void;
}

export function CategoryNav({
	categories,
	activeCategoryId,
	onCategoryClick,
}: CategoryNavProps) {
	if (categories.length === 0) {
		return null;
	}

	return (
		<Box
			as="nav"
			zIndex="40"
			borderBottomWidth="1px"
			borderColor="border"
			bg="bg"
			aria-label="Menu categories"
		>
			{/* Category tabs */}
			<HStack
				gap="1.5"
				overflowX="auto"
				scrollBehavior="smooth"
				px="4"
				py="2"
				css={{
					/* Hide scrollbar */
					scrollbarWidth: "none",
					"&::-webkit-scrollbar": {
						display: "none",
					},
				}}
			>
				{categories.map((category) => {
					const isActive = activeCategoryId === category.id;

					return (
						<ShopPillButton
							key={category.id}
							active={isActive}
							onClick={() => onCategoryClick(category.id)}
							whiteSpace="nowrap"
							aria-current={isActive ? "true" : undefined}
							{...focusRingProps}
						>
							{category.name}
						</ShopPillButton>
					);
				})}
			</HStack>
		</Box>
	);
}

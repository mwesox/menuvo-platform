import { Box, Button, HStack, Separator, Text, VStack } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface SidebarNavItem {
	value: string;
	label: string;
	icon?: ReactNode;
	/** Whether this item is disabled (not clickable) */
	disabled?: boolean;
	/** Badge to show next to the label */
	badge?: ReactNode;
}

export interface SidebarNavDangerItem {
	label: string;
	icon?: ReactNode;
	onClick: () => void;
}

interface SidebarNavProps {
	items: SidebarNavItem[];
	value: string;
	onChange: (value: string) => void;
	/** Optional danger zone item shown at the bottom with a divider */
	dangerItem?: SidebarNavDangerItem;
	/** Layout mode - vertical for sidebar, horizontal for mobile */
	layout?: "vertical" | "horizontal";
}

export function SidebarNav({
	items,
	value,
	onChange,
	dangerItem,
	layout = "vertical",
}: SidebarNavProps) {
	if (layout === "horizontal") {
		return (
			<HStack gap="1" w="max-content">
				{items.map((item) => (
					<Button
						key={item.value}
						variant={value === item.value ? "solid" : "ghost"}
						colorPalette={value === item.value ? "primary" : undefined}
						size="sm"
						onClick={() => !item.disabled && onChange(item.value)}
						disabled={item.disabled}
						gap="2"
						whiteSpace="nowrap"
						px="3"
						py="2"
					>
						{item.icon && <Box flexShrink="0">{item.icon}</Box>}
						{item.label}
						{item.badge}
					</Button>
				))}
			</HStack>
		);
	}

	return (
		<Box as="nav">
			<VStack gap="1" align="stretch">
				{items.map((item) => (
					<Button
						key={item.value}
						variant={value === item.value ? "subtle" : "ghost"}
						colorPalette={value === item.value ? "primary" : undefined}
						size="sm"
						w="full"
						justifyContent="flex-start"
						onClick={() => !item.disabled && onChange(item.value)}
						disabled={item.disabled}
						gap="3"
						px="3"
						py="2"
						fontWeight={value === item.value ? "medium" : "normal"}
					>
						{item.icon && (
							<Box
								flexShrink="0"
								color={
									item.disabled
										? "fg.muted"
										: value === item.value
											? "primary"
											: "fg.muted"
								}
							>
								{item.icon}
							</Box>
						)}
						<Text flex="1" textAlign="start" textStyle="sm">
							{item.label}
						</Text>
						{item.badge}
					</Button>
				))}

				{dangerItem && (
					<>
						<Separator my="3" />
						<Button
							variant="ghost"
							size="sm"
							w="full"
							justifyContent="flex-start"
							colorPalette="red"
							onClick={dangerItem.onClick}
							gap="3"
							px="3"
							py="2"
						>
							{dangerItem.icon && <Box flexShrink="0">{dangerItem.icon}</Box>}
							{dangerItem.label}
						</Button>
					</>
				)}
			</VStack>
		</Box>
	);
}

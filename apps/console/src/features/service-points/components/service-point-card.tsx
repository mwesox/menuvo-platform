import {
	Box,
	Card,
	HStack,
	Icon,
	IconButton,
	Menu,
	Portal,
	Switch,
	Text,
} from "@chakra-ui/react";
import { Edit, MoreVertical, QrCode, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ServicePoint } from "../types.ts";

interface ServicePointCardProps {
	servicePoint: ServicePoint;
	onEdit: (servicePoint: ServicePoint) => void;
	onViewQR: (servicePoint: ServicePoint) => void;
	onToggleActive: (id: string, isActive: boolean) => void;
	onDelete: (id: string) => void;
}

export function ServicePointCard({
	servicePoint,
	onEdit,
	onViewQR,
	onToggleActive,
	onDelete,
}: ServicePointCardProps) {
	const { t } = useTranslation("servicePoints");

	return (
		<Card.Root overflow="hidden" transition="shadow" _hover={{ shadow: "md" }}>
			<Card.Body>
				<HStack gap="3" align="center">
					{/* QR Code Icon - clickable */}
					<IconButton
						variant="ghost"
						w="10"
						h="10"
						flexShrink={0}
						onClick={() => onViewQR(servicePoint)}
						rounded="lg"
						bg="primary/10"
						_hover={{ bg: "primary/20" }}
						aria-label={t("labels.viewQrCode")}
					>
						<Icon w="5" h="5" color="primary">
							<QrCode />
						</Icon>
					</IconButton>

					{/* Name + Description */}
					<Box minW="0" flex="1">
						<Text fontWeight="medium" truncate>
							{servicePoint.name}
						</Text>
						{servicePoint.description && (
							<Text color="fg.muted" textStyle="sm" truncate>
								{servicePoint.description}
							</Text>
						)}
					</Box>

					{/* Toggle */}
					<Switch.Root
						checked={servicePoint.isActive}
						onCheckedChange={(details) =>
							onToggleActive(servicePoint.id, details.checked)
						}
						colorPalette="red"
					>
						<Switch.HiddenInput />
						<Switch.Control>
							<Switch.Thumb />
						</Switch.Control>
					</Switch.Root>

					{/* Actions Menu */}
					<Menu.Root>
						<Menu.Trigger asChild>
							<IconButton
								variant="ghost"
								size="sm"
								me="-1"
								rounded="md"
								p="1"
								_hover={{ bg: "bg.muted" }}
							>
								<Icon w="4" h="4" color="fg.muted">
									<MoreVertical />
								</Icon>
							</IconButton>
						</Menu.Trigger>
						<Portal>
							<Menu.Positioner>
								<Menu.Content>
									<Menu.Item
										value="view-qr"
										onClick={() => onViewQR(servicePoint)}
									>
										<Icon w="4" h="4" me="2">
											<QrCode />
										</Icon>
										{t("labels.viewQrCode")}
									</Menu.Item>
									<Menu.Item value="edit" onClick={() => onEdit(servicePoint)}>
										<Icon w="4" h="4" me="2">
											<Edit />
										</Icon>
										{t("buttons.edit")}
									</Menu.Item>
									<Menu.Separator />
									<Menu.Item
										value="delete"
										onClick={() => onDelete(servicePoint.id)}
										color="fg.error"
										_hover={{ bg: "bg.error", color: "fg.error" }}
									>
										<Icon w="4" h="4" me="2">
											<Trash2 />
										</Icon>
										{t("buttons.delete")}
									</Menu.Item>
								</Menu.Content>
							</Menu.Positioner>
						</Portal>
					</Menu.Root>
				</HStack>
			</Card.Body>
		</Card.Root>
	);
}

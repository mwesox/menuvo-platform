/**
 * Connection status indicator showing online/offline state.
 */

import { Box, Icon, Text } from "@chakra-ui/react";
import { Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/ui/tooltip";
import { useConnectionStatus } from "../hooks/use-connection-status";

interface ConnectionStatusProps {
	/** Additional class names */
	className?: string;
}

export function ConnectionStatus({}: ConnectionStatusProps) {
	const { t } = useTranslation("console-kitchen");
	const { isOnline, justReconnected } = useConnectionStatus();

	return (
		<Tooltip
			content={
				isOnline
					? t("connection.onlineTooltip")
					: t("connection.offlineTooltip")
			}
		>
			<Box
				display="flex"
				alignItems="center"
				gap="2"
				rounded="md"
				px="2"
				py="1"
				textStyle="sm"
				bg={isOnline ? "green.100" : "red.100"}
				color={isOnline ? "green.700" : "red.700"}
				animation={justReconnected ? "pulse" : undefined}
			>
				<Icon w="4" h="4">
					{isOnline ? <Wifi /> : <WifiOff />}
				</Icon>
				<Text display={{ base: "none", sm: "inline" }}>
					{isOnline ? t("connection.online") : t("connection.offline")}
				</Text>
			</Box>
		</Tooltip>
	);
}

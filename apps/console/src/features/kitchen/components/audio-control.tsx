/**
 * Audio control button for muting/unmuting order notifications.
 */

import { Box, Button, HStack, Text } from "@chakra-ui/react";
import { Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/ui/tooltip";
import { useKitchenPreferences } from "../stores/kitchen-preferences";

interface AudioControlProps {
	/** Additional class names */
	className?: string;
	/** Request audio permission and play test sound (from useOrderNotifications) */
	onRequestPermission?: () => Promise<boolean>;
	/** Play notification sound for testing */
	onPlayTestSound?: () => void;
}

export function AudioControl({
	className,
	onRequestPermission,
	onPlayTestSound,
}: AudioControlProps) {
	const { t } = useTranslation("console-kitchen");
	const { audioMuted, toggleAudio } = useKitchenPreferences();

	const handleClick = async () => {
		// Toggle audio state first
		toggleAudio();

		// Check the NEW state after toggling - if now unmuted, play test sound
		const { audioMuted: isNowMuted } = useKitchenPreferences.getState();

		if (!isNowMuted && onRequestPermission) {
			const granted = await onRequestPermission();
			// Play test sound after unmuting to confirm it's working
			if (granted && onPlayTestSound) {
				onPlayTestSound();
			}
		}
	};

	return (
		<Tooltip
			content={audioMuted ? t("audio.clickToUnmute") : t("audio.clickToMute")}
		>
			<Button
				variant={audioMuted ? "outline" : "subtle"}
				size="sm"
				onClick={handleClick}
				className={className}
			>
				<HStack gap="2">
					{audioMuted ? (
						<Box color="fg.muted">
							<VolumeX size={16} />
						</Box>
					) : (
						<Volume2 size={16} />
					)}
					<Text display={{ base: "none", sm: "inline" }}>
						{audioMuted ? t("audio.muted") : t("audio.unmuted")}
					</Text>
				</HStack>
			</Button>
		</Tooltip>
	);
}

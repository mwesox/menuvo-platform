/**
 * Audio control button for muting/unmuting order notifications.
 */

import { Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@menuvo/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@menuvo/ui/tooltip";
import { cn } from "@/lib/utils";
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
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant={audioMuted ? "outline" : "secondary"}
					size="sm"
					onClick={handleClick}
					className={cn("gap-2", className)}
				>
					{audioMuted ? (
						<VolumeX className="size-4 text-muted-foreground" />
					) : (
						<Volume2 className="size-4" />
					)}
					<span className="hidden sm:inline">
						{audioMuted ? t("audio.muted") : t("audio.unmuted")}
					</span>
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{audioMuted ? t("audio.clickToUnmute") : t("audio.clickToMute")}
			</TooltipContent>
		</Tooltip>
	);
}

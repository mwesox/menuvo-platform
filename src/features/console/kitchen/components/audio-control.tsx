/**
 * Audio control button for muting/unmuting order notifications.
 */

import { Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useKitchenPreferences } from "../stores/kitchen-preferences";

interface AudioControlProps {
	/** Additional class names */
	className?: string;
}

export function AudioControl({ className }: AudioControlProps) {
	const { t } = useTranslation("console-kitchen");
	const { audioMuted, toggleAudio } = useKitchenPreferences();

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant={audioMuted ? "outline" : "secondary"}
					size="sm"
					onClick={toggleAudio}
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

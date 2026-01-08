/**
 * Connection status indicator showing online/offline state.
 */

import { Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@menuvo/ui/tooltip";
import { cn } from "@/lib/utils";
import { useConnectionStatus } from "../hooks/use-connection-status";

interface ConnectionStatusProps {
	/** Additional class names */
	className?: string;
}

export function ConnectionStatus({ className }: ConnectionStatusProps) {
	const { t } = useTranslation("console-kitchen");
	const { isOnline, justReconnected } = useConnectionStatus();

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div
					className={cn(
						"flex items-center gap-2 rounded-md px-2 py-1 text-sm",
						isOnline
							? "bg-green-100 text-green-700"
							: "bg-red-100 text-red-700",
						justReconnected && "animate-pulse",
						className,
					)}
				>
					{isOnline ? (
						<Wifi className="size-4" />
					) : (
						<WifiOff className="size-4" />
					)}
					<span className="hidden sm:inline">
						{isOnline ? t("connection.online") : t("connection.offline")}
					</span>
				</div>
			</TooltipTrigger>
			<TooltipContent>
				{isOnline
					? t("connection.onlineTooltip")
					: t("connection.offlineTooltip")}
			</TooltipContent>
		</Tooltip>
	);
}

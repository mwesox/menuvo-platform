"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useCookieConsentOptional } from "../contexts/cookie-consent-context";

export function CookieBanner() {
	const { t } = useTranslation("legal");
	const cookieConsent = useCookieConsentOptional();

	if (!cookieConsent) {
		return null;
	}

	const { showBanner, acceptAll, rejectNonEssential } = cookieConsent;

	return (
		<Drawer open={showBanner} onOpenChange={() => {}}>
			<DrawerContent
				style={{
					backgroundColor: "var(--card)",
					fontFamily: "var(--font-body)",
				}}
			>
				<DrawerHeader className="text-center">
					<DrawerTitle
						className="text-foreground"
						style={{ fontFamily: "var(--font-heading)" }}
					>
						{t("cookie.bannerTitle")}
					</DrawerTitle>
					<DrawerDescription className="text-muted-foreground">
						{t("cookie.bannerDescription")}
					</DrawerDescription>
				</DrawerHeader>
				<DrawerFooter className="flex-row gap-3">
					<Button
						variant="outline"
						className="flex-1"
						onClick={rejectNonEssential}
					>
						{t("cookie.essentialOnly")}
					</Button>
					<Button
						className="flex-1"
						onClick={acceptAll}
						style={{
							backgroundColor: "var(--primary)",
							color: "var(--primary-foreground)",
						}}
					>
						{t("cookie.acceptAll")}
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

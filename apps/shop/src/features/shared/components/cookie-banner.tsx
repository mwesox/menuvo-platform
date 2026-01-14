import { Button } from "@menuvo/ui/components/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@menuvo/ui/components/card";
import { useTranslation } from "react-i18next";
import { useCookieConsentOptional } from "../contexts/cookie-consent-context";

export function CookieBanner() {
	const { t } = useTranslation("legal");
	const cookieConsent = useCookieConsentOptional();

	if (!cookieConsent) {
		return null;
	}

	const { showBanner, acceptAll, rejectNonEssential } = cookieConsent;

	if (!showBanner) {
		return null;
	}

	return (
		<div
			className="slide-in-from-bottom fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-in duration-300"
			style={{
				fontFamily: "var(--font-body)",
			}}
		>
			<Card
				className="gap-4 py-4"
				style={{
					backgroundColor: "var(--card)",
					borderColor: "var(--border)",
				}}
			>
				<CardHeader className="gap-1 pb-0">
					<CardTitle
						className="text-base"
						style={{ fontFamily: "var(--font-heading)" }}
					>
						{t("cookie.bannerTitle")}
					</CardTitle>
					<CardDescription>{t("cookie.bannerDescription")}</CardDescription>
				</CardHeader>
				<CardFooter className="flex gap-3 pt-0">
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
				</CardFooter>
			</Card>
		</div>
	);
}

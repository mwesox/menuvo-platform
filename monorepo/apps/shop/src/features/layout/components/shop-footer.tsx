import { Button } from "@menuvo/ui/components/button";
import { Separator } from "@menuvo/ui/components/separator";
import { useTranslation } from "react-i18next";
import { useCookieConsentOptional } from "../../shared/contexts/cookie-consent-context";

function PoweredByMenuvo() {
	const { t } = useTranslation("legal");

	return (
		<div className="flex items-center justify-center gap-2">
			<span className="text-muted-foreground text-sm">
				{t("footer.poweredBy")}
			</span>
			<img src="/menuvo-logo.svg" alt="Menuvo" className="h-6" />
		</div>
	);
}

function FooterLegalLinks() {
	const { t } = useTranslation("legal");
	const cookieConsent = useCookieConsentOptional();

	return (
		<div className="flex items-center justify-center gap-2 text-sm">
			<Button
				variant="link"
				size="sm"
				className="h-auto p-0 text-muted-foreground hover:text-foreground"
				asChild
			>
				<a href="/legal/impressum" target="_blank" rel="noopener noreferrer">
					{t("footer.impressum")}
				</a>
			</Button>
			<Separator orientation="vertical" className="h-4" />
			<Button
				variant="link"
				size="sm"
				className="h-auto p-0 text-muted-foreground hover:text-foreground"
				asChild
			>
				<a href="/legal/privacy" target="_blank" rel="noopener noreferrer">
					{t("footer.privacy")}
				</a>
			</Button>
			{cookieConsent && (
				<>
					<Separator orientation="vertical" className="h-4" />
					<Button
						variant="link"
						size="sm"
						className="h-auto p-0 text-muted-foreground hover:text-foreground"
						onClick={cookieConsent.openSettings}
					>
						{t("footer.cookies")}
					</Button>
				</>
			)}
		</div>
	);
}

function FooterCopyright() {
	const { t } = useTranslation("legal");
	const year = new Date().getFullYear();

	return (
		<p className="text-center text-muted-foreground text-xs">
			{t("footer.copyright", { year })}
		</p>
	);
}

export function ShopFooter() {
	return (
		<footer
			className="border-t px-4 py-6"
			style={{
				borderColor: "var(--border)",
				backgroundColor: "var(--background)",
			}}
		>
			<PoweredByMenuvo />
			<div className="mt-4">
				<FooterLegalLinks />
			</div>
			<div className="mt-4">
				<FooterCopyright />
			</div>
		</footer>
	);
}

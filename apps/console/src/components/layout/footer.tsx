import { Separator } from "@menuvo/ui";
import { useTranslation } from "react-i18next";

const footerLinks = [
	{ href: "/legal/impressum", labelKey: "impressum" },
	{ href: "/legal/privacy", labelKey: "privacyPolicy" },
] as const;

export function Footer() {
	const { t } = useTranslation("legal");
	const currentYear = new Date().getFullYear();

	return (
		<footer className="mt-auto border-border border-t bg-background">
			<div className="px-4 py-6 lg:px-6">
				<nav
					aria-label={t("footer.dataProtection")}
					className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
				>
					{footerLinks.map((link) => (
						<a
							key={link.href}
							href={link.href}
							className="text-muted-foreground transition-colors hover:text-foreground"
						>
							{t(`footer.${link.labelKey}`)}
						</a>
					))}
				</nav>

				<Separator className="my-4" />

				<div className="flex flex-col items-center gap-2 text-center text-muted-foreground text-xs">
					<p>
						{t("footer.dpoContact")}:{" "}
						<a
							href={`mailto:${t("dpo.email")}`}
							className="underline hover:text-foreground"
						>
							{t("dpo.email")}
						</a>
					</p>
					<p>
						&copy; {currentYear} Menuvo. {t("footer.allRightsReserved")}
					</p>
				</div>
			</div>
		</footer>
	);
}

import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";

const footerLinks = [
	{ href: "/legal/impressum", labelKey: "impressum" },
	{ href: "/legal/privacy", labelKey: "privacyPolicy" },
] as const;

export function Footer() {
	const { t } = useTranslation("legal");
	const currentYear = new Date().getFullYear();

	return (
		<footer className="mt-auto border-zinc-200 border-t bg-white dark:border-zinc-800 dark:bg-zinc-950">
			<div className="px-4 py-6 lg:px-6">
				<nav
					aria-label={t("footer.dataProtection")}
					className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
				>
					{footerLinks.map((link) => (
						<a
							key={link.href}
							href={link.href}
							className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
						>
							{t(`footer.${link.labelKey}`)}
						</a>
					))}
				</nav>

				<Separator className="my-4" />

				<div className="flex flex-col items-center gap-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
					<p>
						{t("footer.dpoContact")}:{" "}
						<a
							href={`mailto:${t("dpo.email")}`}
							className="underline hover:text-zinc-900 dark:hover:text-zinc-50"
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

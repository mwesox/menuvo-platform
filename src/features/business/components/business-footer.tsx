import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { useTranslation } from "react-i18next";

export function BusinessFooter() {
	const { t } = useTranslation("business");
	const currentYear = new Date().getFullYear();

	function scrollToSection(id: string) {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
	}

	return (
		<footer className="border-gray-200 border-t bg-gray-50 pb-12">
			<div className="container mx-auto max-w-7xl px-4 py-16 md:px-6">
				<div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<img
								src="/menuvo-app-icon.svg"
								alt="Menuvo Logo"
								className="size-8"
							/>
							<span className="font-bold text-gray-900 text-lg">Menuvo</span>
						</div>
						<p className="text-gray-600 text-sm">{t("footer.tagline")}</p>
					</div>

					<div className="space-y-4">
						<h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
							{t("footer.product")}
						</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<button
									type="button"
									onClick={() => scrollToSection("features")}
									className="cursor-pointer text-gray-600 transition-colors hover:text-brand-red"
								>
									{t("header.features")}
								</button>
							</li>
							<li>
								<button
									type="button"
									onClick={() => scrollToSection("pricing")}
									className="cursor-pointer text-gray-600 transition-colors hover:text-brand-red"
								>
									{t("header.pricing")}
								</button>
							</li>
							<li>
								<button
									type="button"
									onClick={() => scrollToSection("faq")}
									className="cursor-pointer text-gray-600 transition-colors hover:text-brand-red"
								>
									{t("header.faq")}
								</button>
							</li>
						</ul>
					</div>

					<div className="space-y-4">
						<h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
							{t("footer.company")}
						</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									to="/business"
									className="text-gray-600 transition-colors hover:text-brand-red"
								>
									{t("footer.contact")}
								</Link>
							</li>
						</ul>
					</div>

					<div className="space-y-4">
						<h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
							{t("footer.legal")}
						</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<a
									href="/legal/privacy"
									className="text-gray-600 transition-colors hover:text-brand-red"
								>
									{t("footer.privacy")}
								</a>
							</li>
							<li>
								<a
									href="/legal/terms"
									className="text-gray-600 transition-colors hover:text-brand-red"
								>
									{t("footer.terms")}
								</a>
							</li>
							<li>
								<a
									href="/legal/impressum"
									className="text-gray-600 transition-colors hover:text-brand-red"
								>
									{t("footer.impressum")}
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-12 border-gray-200 border-t pt-8">
					<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
						<p className="text-gray-500 text-sm">
							{t("footer.copyright", { year: currentYear })}
						</p>
						<div className="flex gap-4">
							<button
								type="button"
								className="text-gray-500 transition-colors hover:text-brand-red"
								aria-label="Twitter"
							>
								<Twitter className="size-5" />
							</button>
							<button
								type="button"
								className="text-gray-500 transition-colors hover:text-brand-red"
								aria-label="Instagram"
							>
								<Instagram className="size-5" />
							</button>
							<button
								type="button"
								className="text-gray-500 transition-colors hover:text-brand-red"
								aria-label="Facebook"
							>
								<Facebook className="size-5" />
							</button>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}

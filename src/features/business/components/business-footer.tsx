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
		<footer className="border-t border-gray-200 bg-gray-50 pb-12">
			<div className="container px-4 md:px-6 py-16 max-w-7xl mx-auto">
				<div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<img
								src="/menuvo-app-icon.svg"
								alt="Menuvo Logo"
								className="size-8"
							/>
							<span className="text-lg font-bold text-gray-900">Menuvo</span>
						</div>
						<p className="text-sm text-gray-600">{t("footer.tagline")}</p>
					</div>

					<div className="space-y-4">
						<h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
							{t("footer.product")}
						</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<button
									type="button"
									onClick={() => scrollToSection("features")}
									className="text-gray-600 hover:text-brand-red transition-colors cursor-pointer"
								>
									{t("header.features")}
								</button>
							</li>
							<li>
								<button
									type="button"
									onClick={() => scrollToSection("pricing")}
									className="text-gray-600 hover:text-brand-red transition-colors cursor-pointer"
								>
									{t("header.pricing")}
								</button>
							</li>
							<li>
								<button
									type="button"
									onClick={() => scrollToSection("faq")}
									className="text-gray-600 hover:text-brand-red transition-colors cursor-pointer"
								>
									{t("header.faq")}
								</button>
							</li>
						</ul>
					</div>

					<div className="space-y-4">
						<h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
							{t("footer.company")}
						</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									to="/business"
									className="text-gray-600 hover:text-brand-red transition-colors"
								>
									{t("footer.contact")}
								</Link>
							</li>
						</ul>
					</div>

					<div className="space-y-4">
						<h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
							{t("footer.legal")}
						</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<a
									href="/legal/privacy"
									className="text-gray-600 hover:text-brand-red transition-colors"
								>
									{t("footer.privacy")}
								</a>
							</li>
							<li>
								<a
									href="/legal/terms"
									className="text-gray-600 hover:text-brand-red transition-colors"
								>
									{t("footer.terms")}
								</a>
							</li>
							<li>
								<a
									href="/legal/impressum"
									className="text-gray-600 hover:text-brand-red transition-colors"
								>
									{t("footer.impressum")}
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-12 pt-8 border-t border-gray-200">
					<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
						<p className="text-sm text-gray-500">
							{t("footer.copyright", { year: currentYear })}
						</p>
						<div className="flex gap-4">
							<button
								type="button"
								className="text-gray-500 hover:text-brand-red transition-colors"
								aria-label="Twitter"
							>
								<Twitter className="size-5" />
							</button>
							<button
								type="button"
								className="text-gray-500 hover:text-brand-red transition-colors"
								aria-label="Instagram"
							>
								<Instagram className="size-5" />
							</button>
							<button
								type="button"
								className="text-gray-500 hover:text-brand-red transition-colors"
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

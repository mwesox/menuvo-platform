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
		<footer className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 pb-12">
			<div className="container px-4 md:px-6 py-16 max-w-7xl mx-auto">
				<div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<img
								src="/menuvo-app-icon.svg"
								alt="Menuvo Logo"
								className="h-8 w-8"
							/>
							<span className="text-lg font-sans font-bold text-gray-900 dark:text-white">
								Menuvo
							</span>
						</div>
						<p className="font-sans text-sm text-gray-600 dark:text-gray-400">
							{t("footer.tagline")}
						</p>
					</div>

					<div className="space-y-4">
						<h4 className="text-sm font-sans font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
							{t("footer.product")}
						</h4>
						<ul className="space-y-2 font-sans text-sm">
							<li>
								<button
									type="button"
									onClick={() => scrollToSection("features")}
									className="text-gray-600 dark:text-gray-400 hover:text-[#e1393b] transition-colors cursor-pointer"
								>
									{t("header.features")}
								</button>
							</li>
							<li>
								<button
									type="button"
									onClick={() => scrollToSection("pricing")}
									className="text-gray-600 dark:text-gray-400 hover:text-[#e1393b] transition-colors cursor-pointer"
								>
									{t("header.pricing")}
								</button>
							</li>
							<li>
								<button
									type="button"
									onClick={() => scrollToSection("faq")}
									className="text-gray-600 dark:text-gray-400 hover:text-[#e1393b] transition-colors cursor-pointer"
								>
									{t("header.faq")}
								</button>
							</li>
						</ul>
					</div>

					<div className="space-y-4">
						<h4 className="text-sm font-sans font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
							{t("footer.company")}
						</h4>
						<ul className="space-y-2 font-sans text-sm">
							<li>
								<Link
									to="/business"
									className="text-gray-600 dark:text-gray-400 hover:text-[#e1393b] transition-colors"
								>
									{t("footer.contact")}
								</Link>
							</li>
						</ul>
					</div>

					<div className="space-y-4">
						<h4 className="text-sm font-sans font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
							{t("footer.legal")}
						</h4>
						<ul className="space-y-2 font-sans text-sm">
							<li>
								<a
									href="/legal/privacy"
									className="text-gray-600 dark:text-gray-400 hover:text-[#e1393b] transition-colors"
								>
									{t("footer.privacy")}
								</a>
							</li>
							<li>
								<a
									href="/legal/terms"
									className="text-gray-600 dark:text-gray-400 hover:text-[#e1393b] transition-colors"
								>
									{t("footer.terms")}
								</a>
							</li>
							<li>
								<a
									href="/legal/impressum"
									className="text-gray-600 dark:text-gray-400 hover:text-[#e1393b] transition-colors"
								>
									{t("footer.impressum")}
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
					<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
						<p className="font-sans text-sm text-gray-500 dark:text-gray-400">
							{t("footer.copyright", { year: currentYear })}
						</p>
						<div className="flex gap-4">
							<button
								type="button"
								className="text-gray-500 hover:text-[#e1393b] transition-colors"
								aria-label="Twitter"
							>
								<Twitter className="w-5 h-5" />
							</button>
							<button
								type="button"
								className="text-gray-500 hover:text-[#e1393b] transition-colors"
								aria-label="Instagram"
							>
								<Instagram className="w-5 h-5" />
							</button>
							<button
								type="button"
								className="text-gray-500 hover:text-[#e1393b] transition-colors"
								aria-label="Facebook"
							>
								<Facebook className="w-5 h-5" />
							</button>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}

import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function BusinessHeader() {
	const { t } = useTranslation("business");
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	function scrollToSection(id: string) {
		const element = document.getElementById(id);
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
		setMobileMenuOpen(false);
	}

	return (
		<header className="fixed top-0 inset-x-0 z-50 bg-brand-dark text-white transition-all duration-300">
			<div className="mx-auto max-w-7xl px-4 md:px-6">
				<nav className="flex items-center justify-between py-4 md:py-5">
					<Link
						to="/business"
						className="flex items-center hover:opacity-90 transition-opacity"
						aria-label="Menuvo"
					>
						<img
							src="/menuvo-logo-white.svg"
							alt="Menuvo"
							className="h-10 md:h-12"
						/>
					</Link>

					<div className="hidden md:flex items-center gap-8">
						<button
							type="button"
							onClick={() => scrollToSection("features")}
							className="nav-link text-base font-medium text-white/70 hover:text-white transition-colors py-2 uppercase tracking-wider relative cursor-pointer"
						>
							{t("header.features")}
						</button>
						<button
							type="button"
							onClick={() => scrollToSection("pricing")}
							className="nav-link text-base font-medium text-white/70 hover:text-white transition-colors py-2 uppercase tracking-wider relative cursor-pointer"
						>
							{t("header.pricing")}
						</button>
						<button
							type="button"
							onClick={() => scrollToSection("faq")}
							className="nav-link text-base font-medium text-white/70 hover:text-white transition-colors py-2 uppercase tracking-wider relative cursor-pointer"
						>
							{t("header.faq")}
						</button>
					</div>

					<div className="flex items-center gap-3">
						<a
							href="/console/onboarding"
							className="hidden md:inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 bg-brand-red text-white hover:bg-brand-red-dark hover:scale-[1.02] active:scale-[0.98] h-10 px-6 shadow-md hover:shadow-lg uppercase tracking-wide"
						>
							{t("header.cta")}
						</a>

						<button
							type="button"
							className="md:hidden inline-flex items-center justify-center size-10 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
							aria-label="Toggle menu"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						>
							{mobileMenuOpen ? (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							) : (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<line x1="4" y1="6" x2="20" y2="6" />
									<line x1="4" y1="12" x2="20" y2="12" />
									<line x1="4" y1="18" x2="20" y2="18" />
								</svg>
							)}
						</button>
					</div>
				</nav>
			</div>

			{mobileMenuOpen && (
				<div className="md:hidden fixed inset-0 top-[65px] bg-brand-dark/98 backdrop-blur-sm z-40">
					<nav className="flex flex-col p-6 space-y-2">
						<button
							type="button"
							onClick={() => scrollToSection("features")}
							className="text-xl font-medium text-white/80 hover:text-white py-4 px-4 rounded-lg hover:bg-white/5 transition-all uppercase tracking-wider text-start cursor-pointer"
						>
							{t("header.features")}
						</button>
						<button
							type="button"
							onClick={() => scrollToSection("faq")}
							className="text-xl font-medium text-white/80 hover:text-white py-4 px-4 rounded-lg hover:bg-white/5 transition-all uppercase tracking-wider text-start cursor-pointer"
						>
							{t("header.faq")}
						</button>
						<button
							type="button"
							onClick={() => scrollToSection("pricing")}
							className="text-xl font-medium text-white/80 hover:text-white py-4 px-4 rounded-lg hover:bg-white/5 transition-all uppercase tracking-wider text-start cursor-pointer"
						>
							{t("header.pricing")}
						</button>

						<div className="pt-4 border-t border-white/10">
							<a
								href="/console/onboarding"
								className="inline-flex w-full items-center justify-center gap-2 rounded-lg text-base font-medium transition-all duration-200 bg-brand-red text-white hover:bg-brand-red-dark py-4 px-6 shadow-md uppercase tracking-wide"
							>
								{t("header.cta")}
							</a>
						</div>
					</nav>
				</div>
			)}

			<style>{`
				.nav-link::after {
					content: '';
					position: absolute;
					left: 0;
					bottom: 0;
					width: 0;
					height: 1px;
					background-color: currentColor;
					transition: width 0.3s ease;
				}
				.nav-link:hover::after {
					width: 100%;
				}
			`}</style>
		</header>
	);
}

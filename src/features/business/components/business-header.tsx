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
		<header className="fixed inset-x-0 top-0 z-50 bg-brand-dark text-white transition-all duration-300">
			<div className="mx-auto max-w-7xl px-4 md:px-6">
				<nav className="flex items-center justify-between py-4 md:py-5">
					<Link
						to="/business"
						className="flex items-center transition-opacity hover:opacity-90"
						aria-label="Menuvo"
					>
						<img
							src="/menuvo-logo-white.svg"
							alt="Menuvo"
							className="h-10 md:h-12"
						/>
					</Link>

					<div className="hidden items-center gap-8 md:flex">
						<button
							type="button"
							onClick={() => scrollToSection("features")}
							className="nav-link relative cursor-pointer py-2 font-medium text-base text-white/70 uppercase tracking-wider transition-colors hover:text-white"
						>
							{t("header.features")}
						</button>
						<button
							type="button"
							onClick={() => scrollToSection("pricing")}
							className="nav-link relative cursor-pointer py-2 font-medium text-base text-white/70 uppercase tracking-wider transition-colors hover:text-white"
						>
							{t("header.pricing")}
						</button>
						<button
							type="button"
							onClick={() => scrollToSection("faq")}
							className="nav-link relative cursor-pointer py-2 font-medium text-base text-white/70 uppercase tracking-wider transition-colors hover:text-white"
						>
							{t("header.faq")}
						</button>
					</div>

					<div className="flex items-center gap-3">
						<a
							href="/console/onboarding"
							className="hidden h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-brand-red px-6 font-medium text-sm text-white uppercase tracking-wide shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-brand-red-dark hover:shadow-lg active:scale-[0.98] md:inline-flex"
						>
							{t("header.cta")}
						</a>

						<button
							type="button"
							className="inline-flex size-10 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/10 hover:text-white md:hidden"
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
				<div className="fixed inset-0 top-[65px] z-40 bg-brand-dark/98 backdrop-blur-sm md:hidden">
					<nav className="flex flex-col space-y-2 p-6">
						<button
							type="button"
							onClick={() => scrollToSection("features")}
							className="cursor-pointer rounded-lg px-4 py-4 text-start font-medium text-white/80 text-xl uppercase tracking-wider transition-all hover:bg-white/5 hover:text-white"
						>
							{t("header.features")}
						</button>
						<button
							type="button"
							onClick={() => scrollToSection("faq")}
							className="cursor-pointer rounded-lg px-4 py-4 text-start font-medium text-white/80 text-xl uppercase tracking-wider transition-all hover:bg-white/5 hover:text-white"
						>
							{t("header.faq")}
						</button>
						<button
							type="button"
							onClick={() => scrollToSection("pricing")}
							className="cursor-pointer rounded-lg px-4 py-4 text-start font-medium text-white/80 text-xl uppercase tracking-wider transition-all hover:bg-white/5 hover:text-white"
						>
							{t("header.pricing")}
						</button>

						<div className="border-white/10 border-t pt-4">
							<a
								href="/console/onboarding"
								className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-6 py-4 font-medium text-base text-white uppercase tracking-wide shadow-md transition-all duration-200 hover:bg-brand-red-dark"
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

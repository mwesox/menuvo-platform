import { Bot } from "lucide-react";
import { useTranslation } from "react-i18next";

export function BusinessAIBanner() {
	const { t } = useTranslation("business");

	return (
		<section className="relative py-12 bg-gradient-to-r from-gray-100/80 via-gray-50 to-gray-100/80 dark:from-gray-800/80 dark:via-gray-800 dark:to-gray-800/80 border-y border-gray-200/50 dark:border-gray-700/50">
			<div className="container px-4 md:px-6 max-w-7xl mx-auto">
				<div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-center md:text-left">
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800">
							<Bot className="h-6 w-6 text-gray-700 dark:text-gray-300" />
						</div>
						<div>
							<p className="text-2xl md:text-3xl font-sans font-bold text-gray-900 dark:text-white">
								{t("ai.headline")}
							</p>
						</div>
					</div>
					<div className="hidden md:block w-px h-12 bg-gray-300 dark:bg-gray-600" />
					<p className="text-base md:text-lg font-sans text-gray-600 dark:text-gray-400 max-w-md">
						{t("ai.description")}
					</p>
				</div>
			</div>
		</section>
	);
}

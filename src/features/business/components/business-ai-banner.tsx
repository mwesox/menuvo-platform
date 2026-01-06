import { Bot } from "lucide-react";
import { useTranslation } from "react-i18next";

export function BusinessAIBanner() {
	const { t } = useTranslation("business");

	return (
		<section className="relative py-12 bg-gradient-to-r from-gray-100/80 via-gray-50 to-gray-100/80 border-y border-gray-200/50">
			<div className="container px-4 md:px-6 max-w-7xl mx-auto">
				<div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-center md:text-start">
					<div className="flex items-center gap-3">
						<div className="flex items-center justify-center size-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-50">
							<Bot className="size-6 text-gray-700" />
						</div>
						<div>
							<p className="text-2xl md:text-3xl font-bold text-gray-900">
								{t("ai.headline")}
							</p>
						</div>
					</div>
					<div className="hidden md:block w-px h-12 bg-gray-300" />
					<p className="text-base md:text-lg text-gray-600 max-w-md">
						{t("ai.description")}
					</p>
				</div>
			</div>
		</section>
	);
}

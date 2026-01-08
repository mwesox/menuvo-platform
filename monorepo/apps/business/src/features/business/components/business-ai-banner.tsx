import { Bot } from "lucide-react";
import { useTranslation } from "react-i18next";

export function BusinessAIBanner() {
	const { t } = useTranslation("business");

	return (
		<section className="relative border-gray-200/50 border-y bg-gradient-to-r from-gray-100/80 via-gray-50 to-gray-100/80 py-12">
			<div className="container mx-auto max-w-7xl px-4 md:px-6">
				<div className="flex flex-col items-center justify-center gap-4 text-center md:flex-row md:gap-8 md:text-start">
					<div className="flex items-center gap-3">
						<div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-50">
							<Bot className="size-6 text-gray-700" />
						</div>
						<div>
							<p className="font-bold text-2xl text-gray-900 md:text-3xl">
								{t("ai.headline")}
							</p>
						</div>
					</div>
					<div className="hidden h-12 w-px bg-gray-300 md:block" />
					<p className="max-w-md text-base text-gray-600 md:text-lg">
						{t("ai.description")}
					</p>
				</div>
			</div>
		</section>
	);
}

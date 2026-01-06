import { useTranslation } from "react-i18next";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
	question: string;
	answer: string;
}

export function BusinessFAQ() {
	const { t } = useTranslation("business");

	const faqs = t("faq.items", { returnObjects: true }) as FaqItem[];

	return (
		<section
			id="faq"
			className="py-20 bg-gradient-to-b from-gray-100/50 via-white to-gray-100/50"
		>
			<div className="container px-4 md:px-6 max-w-7xl mx-auto">
				<div className="flex flex-col items-center justify-center space-y-3 text-center mb-12">
					<h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-gray-900">
						{t("faq.title")}
					</h2>
					<p className="mx-auto max-w-[600px] text-gray-600">
						{t("faq.subtitle")}
					</p>
				</div>

				<div className="mx-auto max-w-3xl">
					<div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
						<Accordion type="single" collapsible className="w-full">
							{faqs.map((faq) => (
								<AccordionItem
									key={faq.question}
									value={faq.question}
									className="border-b border-gray-200 last:border-b-0"
								>
									<AccordionTrigger className="px-4 py-4 text-start text-sm md:text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors [&[data-state=open]>svg]:rotate-180">
										{faq.question}
									</AccordionTrigger>
									<AccordionContent className="px-4 pb-4">
										<p className="text-gray-600 text-sm leading-relaxed">
											{faq.answer}
										</p>
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</div>
				</div>
			</div>
		</section>
	);
}

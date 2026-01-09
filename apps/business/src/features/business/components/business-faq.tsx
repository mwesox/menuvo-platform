import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@menuvo/ui/components/accordion";
import { useTranslation } from "react-i18next";

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
			className="bg-gradient-to-b from-gray-100/50 via-white to-gray-100/50 py-20"
		>
			<div className="container mx-auto max-w-7xl px-4 md:px-6">
				<div className="mb-12 flex flex-col items-center justify-center space-y-3 text-center">
					<h2 className="font-bold text-3xl text-gray-900 tracking-tighter sm:text-4xl">
						{t("faq.title")}
					</h2>
					<p className="mx-auto max-w-[600px] text-gray-600">
						{t("faq.subtitle")}
					</p>
				</div>

				<div className="mx-auto max-w-3xl">
					<div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
						<Accordion type="single" collapsible className="w-full">
							{faqs.map((faq) => (
								<AccordionItem
									key={faq.question}
									value={faq.question}
									className="border-gray-200 border-b last:border-b-0"
								>
									<AccordionTrigger className="px-4 py-4 text-start font-medium text-gray-900 text-sm transition-colors hover:bg-gray-50 md:text-base [&[data-state=open]>svg]:rotate-180">
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

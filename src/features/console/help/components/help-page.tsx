import { HelpCircle, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export function HelpPage() {
	const { t } = useTranslation("console-help");

	return (
		<div className="container max-w-4xl py-8">
			<div className="mb-8">
				<h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
				<p className="text-muted-foreground">{t("description")}</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<HelpCircle className="size-5" />
							{t("documentation.title")}
						</CardTitle>
						<CardDescription>{t("documentation.description")}</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">{t("comingSoon")}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Mail className="size-5" />
							{t("contact.title")}
						</CardTitle>
						<CardDescription>{t("contact.description")}</CardDescription>
					</CardHeader>
					<CardContent>
						<a
							href="mailto:support@menuvo.app"
							className="text-primary text-sm hover:underline"
						>
							support@menuvo.app
						</a>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

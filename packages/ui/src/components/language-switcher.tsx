import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "./dropdown-menu";

const SUPPORTED_LANGUAGES = ["en", "de"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const languageLabels: Record<SupportedLanguage, string> = {
	en: "English",
	de: "Deutsch",
};

export function LanguageSwitcher() {
	const { i18n } = useTranslation();
	const currentLanguage = (i18n.language?.split("-")[0] ||
		"en") as SupportedLanguage;

	const handleLanguageChange = (lang: string) => {
		i18n.changeLanguage(lang);
		localStorage.setItem("menuvo-language", lang);
		document.documentElement.lang = lang;
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon">
					<Globe className="h-4 w-4" />
					<span className="sr-only">Switch language</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuRadioGroup
					value={currentLanguage}
					onValueChange={handleLanguageChange}
				>
					{SUPPORTED_LANGUAGES.map((lang) => (
						<DropdownMenuRadioItem key={lang} value={lang}>
							{languageLabels[lang]}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

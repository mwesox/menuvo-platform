import { IconButton, Menu, Portal, VisuallyHidden } from "@chakra-ui/react";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

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
		<Menu.Root positioning={{ placement: "bottom-end" }}>
			<Menu.Trigger asChild>
				<IconButton variant="ghost" size="sm" aria-label="Switch language">
					<Globe style={{ height: "1rem", width: "1rem" }} />
					<VisuallyHidden>Switch language</VisuallyHidden>
				</IconButton>
			</Menu.Trigger>
			<Portal>
				<Menu.Positioner>
					<Menu.Content>
						<Menu.RadioItemGroup
							value={currentLanguage}
							onValueChange={(e) => handleLanguageChange(e.value)}
						>
							{SUPPORTED_LANGUAGES.map((lang) => (
								<Menu.RadioItem key={lang} value={lang}>
									{languageLabels[lang]}
									<Menu.ItemIndicator />
								</Menu.RadioItem>
							))}
						</Menu.RadioItemGroup>
					</Menu.Content>
				</Menu.Positioner>
			</Portal>
		</Menu.Root>
	);
}

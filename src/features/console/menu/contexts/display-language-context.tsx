import { createContext, useContext } from "react";

/**
 * Context for the display language in menu admin.
 * This is the language used to show entity names/descriptions.
 * Typically supportedLanguages[0] from merchant settings.
 */
const DisplayLanguageContext = createContext<string>("de");

export function DisplayLanguageProvider({
	language,
	children,
}: {
	language: string;
	children: React.ReactNode;
}) {
	return (
		<DisplayLanguageContext.Provider value={language}>
			{children}
		</DisplayLanguageContext.Provider>
	);
}

/**
 * Get the current display language for menu content.
 */
export function useDisplayLanguage(): string {
	return useContext(DisplayLanguageContext);
}

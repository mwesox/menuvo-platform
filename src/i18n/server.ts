import { createServerFn } from "@tanstack/react-start";
import {
	DEFAULT_LANGUAGE,
	SUPPORTED_LANGUAGES,
	type SupportedLanguage,
} from "./config";

export const detectLanguageFromRequest = createServerFn().handler(
	async (): Promise<SupportedLanguage> => {
		// Dynamic import to avoid bundling server-only code in client
		const { getRequestHeader } = await import("@tanstack/react-start/server");

		try {
			// During prerendering, getRequestHeader may not be available
			let acceptLanguage: string | null | undefined;
			try {
				acceptLanguage = getRequestHeader("accept-language");
			} catch {
				// Prerender context - no request available
				return DEFAULT_LANGUAGE;
			}

			if (!acceptLanguage) return DEFAULT_LANGUAGE;

			const languages = acceptLanguage
				.split(",")
				.map((lang) => {
					const [code, qValue] = lang.trim().split(";q=");
					return {
						code: code.split("-")[0].toLowerCase(),
						quality: qValue ? Number.parseFloat(qValue) : 1,
					};
				})
				.sort((a, b) => b.quality - a.quality);

			for (const { code } of languages) {
				if (SUPPORTED_LANGUAGES.includes(code as SupportedLanguage)) {
					return code as SupportedLanguage;
				}
			}

			return DEFAULT_LANGUAGE;
		} catch {
			return DEFAULT_LANGUAGE;
		}
	},
);

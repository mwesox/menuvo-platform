import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

type ConsentStatus = "pending" | "accepted" | "rejected";

interface CookieConsentContextValue {
	consent: ConsentStatus;
	showBanner: boolean;
	openSettings: () => void;
	acceptAll: () => void;
	rejectNonEssential: () => void;
}

const STORAGE_KEY = "menuvo-cookie-consent";

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
	null,
);

interface CookieConsentProviderProps {
	children: ReactNode;
}

export function CookieConsentProvider({
	children,
}: CookieConsentProviderProps) {
	const [consent, setConsent] = useState<ConsentStatus>("pending");
	const [showBanner, setShowBanner] = useState(false);
	const [isHydrated, setIsHydrated] = useState(false);

	// Hydrate from localStorage on mount
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === "accepted" || stored === "rejected") {
			setConsent(stored);
		} else {
			setShowBanner(true);
		}
		setIsHydrated(true);
	}, []);

	const acceptAll = useCallback(() => {
		setConsent("accepted");
		setShowBanner(false);
		localStorage.setItem(STORAGE_KEY, "accepted");
	}, []);

	const rejectNonEssential = useCallback(() => {
		setConsent("rejected");
		setShowBanner(false);
		localStorage.setItem(STORAGE_KEY, "rejected");
	}, []);

	const openSettings = useCallback(() => {
		setShowBanner(true);
	}, []);

	// ALWAYS wrap in provider to maintain consistent tree structure during hydration
	// Banner visibility is controlled via the value, not conditional rendering
	return (
		<CookieConsentContext.Provider
			value={{
				consent,
				showBanner: isHydrated ? showBanner : false,
				openSettings,
				acceptAll,
				rejectNonEssential,
			}}
		>
			{children}
		</CookieConsentContext.Provider>
	);
}

export function useCookieConsent() {
	const context = useContext(CookieConsentContext);
	if (!context) {
		throw new Error(
			"useCookieConsent must be used within a CookieConsentProvider",
		);
	}
	return context;
}

export function useCookieConsentOptional() {
	return useContext(CookieConsentContext);
}

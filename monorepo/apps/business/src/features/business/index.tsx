// Components
export * from "./components";

// Layout
export { BusinessLayout } from "./layout";

// Page compositions
import {
	BusinessAIBanner,
	BusinessCTA,
	BusinessFAQ,
	BusinessFeatures,
	BusinessHero,
	BusinessPricing,
} from "./components";

export function BusinessLandingPage() {
	return (
		<>
			<BusinessHero />
			<BusinessAIBanner />
			<BusinessFeatures />
			<BusinessPricing />
			<BusinessFAQ />
			<BusinessCTA />
		</>
	);
}

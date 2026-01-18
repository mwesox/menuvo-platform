import { createFileRoute } from "@tanstack/react-router";
import {
	BusinessFooter,
	BusinessHeader,
	BusinessLandingPage,
	BusinessLayout,
} from "@/features/business";

export const Route = createFileRoute("/")({
	component: IndexPage,
});

function IndexPage() {
	return (
		<BusinessLayout>
			<BusinessHeader />
			<main>
				<BusinessLandingPage />
			</main>
			<BusinessFooter />
		</BusinessLayout>
	);
}

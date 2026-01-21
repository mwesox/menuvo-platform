import { Box, Flex } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import {
	DiscoveryHeader,
	DiscoveryPage,
	DiscoveryPageError,
	DiscoveryPageSkeleton,
} from "../features/discovery";
import { ShopFooter } from "../features/layout";
import { CookieBanner, CookieConsentProvider } from "../features/shared";
import { trpcUtils } from "../lib/trpc";

export const Route = createFileRoute("/")({
	loader: async () => {
		await trpcUtils.store.getFeaturedStores.ensureData({ limit: 20 });
	},
	head: () => ({
		meta: [
			{
				title:
					"Menuvo – Restaurants Near Me | Order Ahead, Skip the Wait | menuvo.app",
			},
			{
				name: "description",
				content:
					"Find restaurants near you with Menuvo. Browse menus, order ahead from your phone, and skip the wait – whether dining in or grabbing takeaway. The smarter way to order food.",
			},
			// Open Graph
			{
				property: "og:title",
				content: "Menuvo – Find Restaurants & Order Ahead | menuvo.app",
			},
			{
				property: "og:description",
				content:
					"Discover local restaurants, browse menus, and order ahead from your phone. Dine in or take away – no more waiting in line.",
			},
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:url",
				content: "https://menuvo.app",
			},
			{
				property: "og:site_name",
				content: "Menuvo",
			},
			// Twitter
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:title",
				content: "Menuvo – Restaurants Near Me | Order Ahead",
			},
			{
				name: "twitter:description",
				content:
					"Find restaurants, browse menus, order ahead. Skip the wait with Menuvo.",
			},
			// SEO Keywords (less important now, but still used by some engines)
			{
				name: "keywords",
				content:
					"restaurants near me, order food online, local restaurants, restaurant menu, dine in ordering, skip the line, mobile ordering, QR code menu, food ordering app, restaurant finder, order ahead, takeaway, menuvo",
			},
			// Additional SEO
			{
				name: "robots",
				content: "index, follow",
			},
			{
				name: "author",
				content: "Menuvo",
			},
		],
		links: [
			{
				rel: "canonical",
				href: "https://menuvo.app",
			},
		],
	}),
	component: DiscoveryLayout,
	pendingComponent: DiscoveryLayoutSkeleton,
	errorComponent: DiscoveryPageError,
});

function DiscoveryLayout() {
	return (
		<CookieConsentProvider>
			<Flex direction="column" minH="100vh" bg="bg">
				<DiscoveryHeader />
				<Box as="main" flex="1">
					<DiscoveryPage />
				</Box>
				<ShopFooter />
			</Flex>
			<CookieBanner />
		</CookieConsentProvider>
	);
}

function DiscoveryLayoutSkeleton() {
	return (
		<Flex direction="column" minH="100vh" bg="bg">
			<DiscoveryHeader />
			<Box as="main" flex="1">
				<DiscoveryPageSkeleton />
			</Box>
			<ShopFooter />
		</Flex>
	);
}

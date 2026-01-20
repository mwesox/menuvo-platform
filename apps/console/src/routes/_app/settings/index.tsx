import { Badge, Skeleton } from "@menuvo/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Building2,
	CreditCard,
	Globe,
	Palette,
	Sparkles,
	Users,
} from "lucide-react";
import { Suspense, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod/v4";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarPageLayout } from "@/components/layout/sidebar-page-layout";
import { ConsoleError } from "@/features/components/console-error";
import { AiRecommendationsForm } from "@/features/settings/components/ai-recommendations/ai-recommendations-form";
import { MerchantGeneralForm } from "@/features/settings/components/merchant/merchant-general-form";
import { MerchantLanguageForm } from "@/features/settings/components/merchant/merchant-language-form";
import { MollieSetupCard } from "@/features/settings/components/payments/mollie-setup-card";
import { MollieStatusCard } from "@/features/settings/components/payments/mollie-status-card";
import { trpcUtils, useTRPC } from "@/lib/trpc";

const tabSchema = z.enum([
	"business",
	"language",
	"payments",
	"ai",
	"staff",
	"brand",
]);
type TabValue = z.infer<typeof tabSchema>;

const searchSchema = z.object({
	tab: tabSchema.optional().default("business"),
	// For Mollie callback
	from: z.literal("mollie").optional(),
	refresh: z.boolean().optional(),
	error: z.string().optional(),
});

export const Route = createFileRoute("/_app/settings/")({
	validateSearch: searchSchema,
	loader: async () => {
		// Prefetch merchant data for forms
		await trpcUtils.merchant.getCurrent.ensureData();
	},
	component: SettingsPage,
	pendingComponent: SettingsPageSkeleton,
	errorComponent: ConsoleError,
});

function SettingsPage() {
	const { t } = useTranslation("settings");
	const navigate = useNavigate();
	const { tab = "business", from, refresh } = Route.useSearch();

	const handleTabChange = (value: string) => {
		navigate({
			to: "/settings",
			search: { tab: value as TabValue },
		});
	};

	const navItems = [
		{
			value: "business",
			label: t("nav.business"),
			icon: <Building2 className="h-4 w-4" />,
		},
		{
			value: "language",
			label: t("nav.language"),
			icon: <Globe className="h-4 w-4" />,
		},
		{
			value: "payments",
			label: t("nav.payments"),
			icon: <CreditCard className="h-4 w-4" />,
		},
		{
			value: "ai",
			label: t("nav.ai"),
			icon: <Sparkles className="h-4 w-4" />,
		},
		{
			value: "staff",
			label: t("nav.staff"),
			icon: <Users className="h-4 w-4" />,
			disabled: true,
			badge: (
				<Badge variant="secondary" className="font-normal text-xs">
					{t("hub.comingSoon")}
				</Badge>
			),
		},
		{
			value: "brand",
			label: t("nav.brand"),
			icon: <Palette className="h-4 w-4" />,
			disabled: true,
			badge: (
				<Badge variant="secondary" className="font-normal text-xs">
					{t("hub.comingSoon")}
				</Badge>
			),
		},
	];

	return (
		<SidebarPageLayout
			nav={
				<>
					{/* Desktop: vertical nav */}
					<div className="hidden lg:block">
						<SidebarNav
							items={navItems}
							value={tab}
							onChange={handleTabChange}
						/>
					</div>
					{/* Mobile: horizontal scroll */}
					<div className="lg:hidden">
						<SidebarNav
							items={navItems}
							value={tab}
							onChange={handleTabChange}
							layout="horizontal"
						/>
					</div>
				</>
			}
		>
			<Suspense fallback={<SettingsContentSkeleton />}>
				<SettingsContent tab={tab} from={from} refresh={refresh} />
			</Suspense>
		</SidebarPageLayout>
	);
}

interface SettingsContentProps {
	tab: TabValue;
	from?: "mollie";
	refresh?: boolean;
}

function SettingsContent({ tab, from, refresh }: SettingsContentProps) {
	return (
		<>
			{tab === "business" && <MerchantGeneralForm />}
			{tab === "language" && <MerchantLanguageForm />}
			{tab === "payments" && <PaymentsContent from={from} refresh={refresh} />}
			{tab === "ai" && <AiRecommendationsContent />}
		</>
	);
}

interface PaymentsContentProps {
	from?: "mollie";
	refresh?: boolean;
}

function PaymentsContent({ from, refresh }: PaymentsContentProps) {
	const { t: tToasts } = useTranslation("toasts");
	const navigate = useNavigate();
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	// Mollie payment status
	const { data: mollieStatus } = useQuery({
		...trpc.payments.getMollieStatus.queryOptions(),
	});

	const refreshMollieStatus = useCallback(async () => {
		try {
			await queryClient.fetchQuery(
				trpc.payments.getOnboardingStatus.queryOptions(),
			);
			queryClient.invalidateQueries({
				queryKey: trpc.payments.getMollieStatus.queryKey(),
			});
			toast.success(tToasts("success.paymentStatusRefreshed"));
		} catch {
			toast.error(tToasts("error.refreshPaymentStatus"));
		}
	}, [queryClient, tToasts, trpc]);

	// Track if we've already triggered a refresh for this URL to prevent double-triggers
	const hasTriggeredRefresh = useRef(false);

	// Auto-refresh status when returning from Mollie
	useEffect(() => {
		const shouldRefresh = from === "mollie" || refresh;

		if (shouldRefresh && !hasTriggeredRefresh.current) {
			hasTriggeredRefresh.current = true;
			void refreshMollieStatus();

			// Clear URL params to prevent re-triggering on page refresh
			navigate({
				to: "/settings",
				search: { tab: "payments" },
				replace: true,
			});
		}
	}, [from, refresh, navigate, refreshMollieStatus]);

	// Reset the ref when URL params are cleared
	useEffect(() => {
		if (!from && !refresh) {
			hasTriggeredRefresh.current = false;
		}
	}, [from, refresh]);

	// Early return after all hooks are called
	if (!mollieStatus) {
		return null;
	}

	const hasMollieAccount = !!mollieStatus.organizationId;

	return (
		<>
			{!hasMollieAccount ? (
				<MollieSetupCard />
			) : (
				<MollieStatusCard mollieStatus={mollieStatus} />
			)}
		</>
	);
}

function AiRecommendationsContent() {
	const trpc = useTRPC();

	// Get the first store for AI recommendations (global setting)
	const { data: stores } = useQuery({
		...trpc.store.list.queryOptions(),
	});

	const firstStoreId = stores?.[0]?.id;

	if (!firstStoreId) {
		return null;
	}

	return (
		<Suspense fallback={<SettingsContentSkeleton />}>
			<AiRecommendationsFormWrapper storeId={firstStoreId} />
		</Suspense>
	);
}

function AiRecommendationsFormWrapper({ storeId }: { storeId: string }) {
	const trpc = useTRPC();

	// Ensure AI settings data is loaded
	useQuery({
		...trpc.store.recommendations.getAiSettings.queryOptions({ storeId }),
	});

	return <AiRecommendationsForm storeId={storeId} />;
}

function SettingsPageSkeleton() {
	return (
		<SidebarPageLayout
			nav={
				<div className="space-y-2">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-10 w-full" />
					))}
				</div>
			}
		>
			<SettingsContentSkeleton />
		</SidebarPageLayout>
	);
}

function SettingsContentSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<Skeleton className="h-6 w-48" />
				<Skeleton className="h-4 w-80" />
			</div>
			<div className="space-y-4 rounded-lg border p-4">
				<Skeleton className="h-10 w-full" />
				<div className="grid gap-4 sm:grid-cols-2">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
			</div>
		</div>
	);
}

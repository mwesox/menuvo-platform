import {
	Box,
	Button,
	Card,
	Flex,
	Heading,
	HStack,
	Text,
	VStack,
} from "@chakra-ui/react";
import { ArrowRight, Pencil } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Caption, Label, Muted } from "@/components/ui/typography";
import type {
	OnboardingData,
	SlideIndex,
} from "../../hooks/use-onboarding-wizard";
import { LEGAL_FORMS_REQUIRING_REGISTER } from "../../schemas";

interface ReviewSlideProps {
	direction: number;
	data: OnboardingData;
	onEdit: (slideIndex: SlideIndex) => void;
	onSubmit: () => void;
	isSubmitting: boolean;
}

const slideVariants = {
	enter: (direction: number) => ({
		y: direction > 0 ? 50 : -50,
		opacity: 0,
	}),
	center: {
		y: 0,
		opacity: 1,
	},
	exit: (direction: number) => ({
		y: direction > 0 ? -50 : 50,
		opacity: 0,
	}),
};

export function ReviewSlide({
	direction,
	data,
	onEdit,
	onSubmit,
	isSubmitting,
}: ReviewSlideProps) {
	const { t } = useTranslation("onboarding");

	// Check if legal entity requires register info
	const requiresRegister = LEGAL_FORMS_REQUIRING_REGISTER.includes(
		data.legalEntity.legalForm,
	);

	// Build legal entity items based on what's filled
	const legalEntityItems = [
		{
			label: t("fields.legalForm"),
			value:
				data.legalEntity.legalForm === "other"
					? data.legalEntity.legalFormOther
					: t(`legalForms.${data.legalEntity.legalForm}`),
		},
		{ label: t("fields.companyName"), value: data.legalEntity.companyName },
		{
			label: t("fields.representativeName"),
			value: data.legalEntity.representativeName,
		},
	];

	// Add register info if required
	if (requiresRegister) {
		legalEntityItems.push({
			label: t("fields.registerCourt"),
			value: data.legalEntity.registerCourt,
		});
		legalEntityItems.push({
			label: t("fields.registerNumber"),
			value: data.legalEntity.registerNumber,
		});
	}

	// Add VAT ID if provided
	if (data.legalEntity.vatId) {
		legalEntityItems.push({
			label: t("fields.vatId"),
			value: data.legalEntity.vatId,
		});
	}

	const sections = [
		{
			title: t("slides.review.sections.business"),
			editSlide: 1 as SlideIndex, // Legal entity slide (now includes company name)
			items: [
				{ label: t("fields.companyName"), value: data.merchant.name },
				{ label: t("fields.ownerName"), value: data.merchant.ownerName },
			],
		},
		{
			title: t("slides.review.sections.legalEntity"),
			editSlide: 1 as SlideIndex, // Legal entity slide
			items: legalEntityItems,
		},
		{
			title: t("slides.review.sections.contact"),
			editSlide: 3 as SlideIndex, // Contact slide
			items: [
				{ label: t("fields.contactEmail"), value: data.merchant.email },
				{ label: t("fields.phone"), value: data.merchant.phone },
			],
		},
		{
			title: t("slides.review.sections.store"),
			editSlide: 4 as SlideIndex, // Store name slide
			items: [
				{ label: t("fields.storeName"), value: data.store.name },
				{
					label: t("fields.streetAddress"),
					value: `${data.store.street}, ${data.store.postalCode} ${data.store.city}`,
				},
			],
		},
	];

	return (
		<motion.div
			custom={direction}
			variants={slideVariants}
			initial="enter"
			animate="center"
			exit="exit"
			transition={{
				y: { type: "spring", stiffness: 300, damping: 30 },
				opacity: { duration: 0.25 },
			}}
		>
			<Flex flex="1" direction="column" justify="center" p="3rem 1rem">
				<Box mx="auto" w="full" maxW="xl">
					<Heading
						as="h2"
						textAlign="center"
						fontWeight="bold"
						textStyle={{ base: "2xl", sm: "3xl", md: "4xl" }}
					>
						{t("slides.review.title")}
					</Heading>
					<Muted mt="3" textAlign="center" textStyle="lg">
						{t("slides.review.subtitle")}
					</Muted>

					{/* Data summary */}
					<VStack gap="4" mt="10">
						{sections.map((section, i) => (
							<motion.div
								key={section.title}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 + i * 0.1 }}
							>
								<Card.Root rounded="xl" borderWidth="1px" p="5">
									<Card.Body>
										<HStack justify="space-between" align="center" mb="3">
											<Text
												fontWeight="semibold"
												color="fg.muted"
												textStyle="xs"
												textTransform="uppercase"
												letterSpacing="wider"
											>
												{section.title}
											</Text>
											<Button
												variant="ghost"
												size="xs"
												onClick={() => onEdit(section.editSlide)}
												colorPalette="accent"
											>
												<Pencil
													style={{ height: "0.75rem", width: "0.75rem" }}
												/>
												{t("slides.review.edit")}
											</Button>
										</HStack>
										<VStack gap="2" align="stretch">
											{section.items.map((item) => (
												<HStack
													key={item.label}
													justify="space-between"
													gap="4"
												>
													<Caption as="dt">{item.label}</Caption>
													<Label as="dd" textAlign="right">
														{item.value || "—"}
													</Label>
												</HStack>
											))}
										</VStack>
									</Card.Body>
								</Card.Root>
							</motion.div>
						))}
					</VStack>

					{/* Submit */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.7 }}
					>
						<Box mt="10">
							<Button
								onClick={onSubmit}
								disabled={isSubmitting}
								size="lg"
								w="full"
								h="14"
								gap="2"
								loading={isSubmitting}
								loadingText={t("slides.review.creating")}
							>
								{!isSubmitting && (
									<>
										{t("slides.review.createAccount")}
										<ArrowRight
											style={{ height: "1.25rem", width: "1.25rem" }}
										/>
									</>
								)}
							</Button>
						</Box>
					</motion.div>
				</Box>
			</Flex>
		</motion.div>
	);
}
